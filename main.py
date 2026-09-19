import base64
import io
import json
import ollama
from pathlib import Path
from PIL import Image
from pydantic import BaseModel, Field

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware


# 1. Pydantic schema enforcing the 10 statutory declarations
class ProductDetails(BaseModel):
    product_name: str | bool = Field(
        description="Brand and product trade name, or false if absent."
    )
    generic_name: str | bool = Field(
        description="Common name of commodity, or false if absent."
    )
    manufacturer_name: str | bool = Field(
        description="Name of manufacturer/packer, or false if absent."
    )
    manufacturer_address: str | bool = Field(
        description="Physical factory/plant address of manufacturer, or false if absent."
    )
    net_quantity: str | bool = Field(
        description="Net quantity with units (e.g., '500 g', '1 L'), or false if absent."
    )
    mrp: str | bool = Field(
        description="Maximum Retail Price with currency (e.g., '₹50.00'), or false if absent."
    )
    unit_sale_price: str | bool = Field(
        description="Unit sale price (e.g., '₹0.10/g'), or false if absent."
    )
    manufacturing_date: str | bool = Field(
        description="Date/month/year of manufacture/packing, or false if absent."
    )
    use_by_date: str | bool = Field(
        description="Expiry/best-before date or timeframe, or false if absent."
    )
    consumer_care_details: str | bool = Field(
        description="Customer care phone, email, or postal address, or false if absent."
    )


PROMPT = (
    "Analyze the provided product packaging images (multiple angles/sides may be shown) "
    "and extract the following 10 fields.\n"
    "Rule: Extract only text that is explicitly printed and visible across any of the images. "
    "Do not infer, guess, or extrapolate. If any field is not clearly visible or completely missing, "
    "set its value strictly to false.\n\n"
    "Fields to extract:\n"
    "1. product_name: Brand and product trade name.\n"
    "2. generic_name: Common or standard name of the commodity.\n"
    "3. manufacturer_name: Legal name of the manufacturing/packing entity.\n"
    "4. manufacturer_address: Physical factory/plant address of the manufacturer.\n"
    "5. net_quantity: Declared net weight, volume, or piece count with units.\n"
    "6. mrp: Maximum Retail Price including currency symbol.\n"
    "7. unit_sale_price: Per-unit price.\n"
    "8. manufacturing_date: Date/month/year of manufacture or packing.\n"
    "9. use_by_date: Expiry date, use-by date, or best-before timeframe/date.\n"
    "10. consumer_care_details: Customer care phone, email, or physical postal address.\n\n"
    "Strictly adhere to the target JSON schema."
)


def downscale_and_encode(img: Image.Image, max_res: int = 1024) -> str:
    """Helper to convert, resize, and encode any PIL image to base64."""
    if img.mode != "RGB":
        img = img.convert("RGB")

    if max(img.size) > max_res:
        img.thumbnail((max_res, max_res), Image.Resampling.LANCZOS)

    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def run_qwen_inference(encoded_images: list[str]) -> dict:
    """Queries local Qwen2.5-VL via Ollama using deterministic zero temperature."""
    response = ollama.chat(
        model="qwen2.5vl:7b",
        messages=[
            {
                "role": "user",
                "content": PROMPT,
                "images": encoded_images,
            }
        ],
        format=ProductDetails.model_json_schema(),
        options={"temperature": 0.0},
    )
    validated_data = ProductDetails.model_validate_json(response.message.content)
    return validated_data.model_dump()


# --- FastAPI Web Application ---

app = FastAPI(title="Legal Metrology Packaging Auditor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
async def serve_camera_ui():
    """Serves index.html to the phone's web browser."""
    html_path = Path("index.html")
    if not html_path.is_file():
        raise HTTPException(status_code=404, detail="index.html file not found in current folder.")
    return html_path.read_text(encoding="utf-8")


@app.post("/api/v1/audit")
async def audit_product_label(files: list[UploadFile] = File(...)):
    """Receives multiple photos sent from the phone."""
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No images received.")
    if len(files) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 images permitted.")

    # Process image bytes directly in RAM without saving temp files to disk
    encoded_images = []
    for file in files:
        contents = await file.read()
        try:
            with Image.open(io.BytesIO(contents)) as pil_img:
                encoded_images.append(downscale_and_encode(pil_img))
        except Exception:
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a valid image.")

    try:
        extracted_data = run_qwen_inference(encoded_images)
        return {
            "status": "success",
            "images_analyzed": len(encoded_images),
            "data": extracted_data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


# --- Optional Local CLI Execution ---

def extract_product_info_from_disk(image_paths: list[str]) -> dict:
    """Reads paths directly from disk (your original workflow)."""
    encoded_images = []
    for p in image_paths:
        path = Path(p).expanduser().resolve()
        if not path.is_file():
            raise FileNotFoundError(f"Image not found at path: {path}")
        with Image.open(path) as img:
            encoded_images.append(downscale_and_encode(img))

    return run_qwen_inference(encoded_images)


if __name__ == "__main__":
    # If executed directly with 'python main.py', it tests local files
    IMAGE_PATHS = [
        "/home/swiz/testmodel/front.jpeg",
        "/home/swiz/testmodel/back.jpeg",
    ]

    try:
        extracted_data = extract_product_info_from_disk(IMAGE_PATHS)
        print(json.dumps(extracted_data, indent=2))
    except Exception as e:
        print(f"Error processing images: {e}")