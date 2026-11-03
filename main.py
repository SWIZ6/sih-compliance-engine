import asyncio
import base64
import io
import json
import re
from contextlib import asynccontextmanager
from pathlib import Path
from PIL import Image, ImageOps
import ollama
from pydantic import BaseModel, Field

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import init_db, save_product_record, get_all_products

BASE_DIR = Path(__file__).resolve().parent


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
        description="Maximum Retail Price with currency (e.g., '50.00'), or false if absent."
    )
    unit_sale_price: str | bool = Field(
        description="Unit sale price (e.g., '0.10/g'), or false if absent without including symbol."
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
    "6. mrp: Maximum Retail Price including currency symbol only if present,must not be text, numbers only.\n"
    "7. unit_sale_price: Per-unit price.\n"
    "8. manufacturing_date: Date/month/year of manufacture or packing.\n"
    "9. use_by_date: Expiry date, or best-before timeframe/date.\n"
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

    # Robust handling for string content vs dict or message object
    raw_content = getattr(response.message, "content", "") if hasattr(response, "message") else str(response)
    raw_content = raw_content.strip()

    # Strip markdown code fences if wrapped by the model (e.g., ```json ... ```)
    if raw_content.startswith("```"):
        raw_content = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_content, flags=re.DOTALL).strip()

    validated_data = ProductDetails.model_validate_json(raw_content)
    data = validated_data.model_dump()

    # --- POST-INFERENCE VALIDATION & SANITIZATION ---
    # Convert string artifacts like "false", "none", "null", "N/A" to boolean False
    for k, v in list(data.items()):
        if isinstance(v, str) and v.strip().lower() in ("false", "none", "null", "n/a", "missing", "not visible", ""):
            data[k] = False

    # Numerical verification for pricing & date fields
    if data.get("mrp") is not False:
        if not re.search(r"\d", str(data.get("mrp", ""))):
            data["mrp"] = False

    if data.get("unit_sale_price") is not False:
        if not re.search(r"\d", str(data.get("unit_sale_price", ""))):
            data["unit_sale_price"] = False

    if data.get("manufacturing_date") is not False:
        if not re.search(r"\d", str(data.get("manufacturing_date", ""))):
            data["manufacturing_date"] = False
    # ------------------------------------------------

    return data


# --- FastAPI Web Application ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Legal Metrology Packaging Auditor", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/v1/audit")
async def audit_product_label(files: list[UploadFile] = File(...)):
    """Receives multiple photos sent from the client."""
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No images received.")
    if len(files) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 images permitted.")

    encoded_images = []
    for file in files:
        contents = await file.read()
        try:
            with Image.open(io.BytesIO(contents)) as pil_img:
                # Transpose smartphone EXIF rotation so sideways photos are righted
                pil_img = ImageOps.exif_transpose(pil_img)
                encoded_images.append(downscale_and_encode(pil_img))
        except Exception:
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a valid image.")

    try:
        # Offload blocking Ollama inference to worker thread pool to prevent blocking the event loop
        extracted_data = await asyncio.to_thread(run_qwen_inference, encoded_images)
        record_id = save_product_record(extracted_data)

        return {
            "status": "success",
            "record_id": record_id,  # Returns the SQLite row ID
            "images_analyzed": len(encoded_images),
            "data": extracted_data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


# --- GET STORED AUDIT RECORDS ---
@app.get("/api/v1/products")
def fetch_saved_products(limit: int = 50):
    """Retrieve logged compliance records from database.db."""
    return get_all_products(limit=limit)


# --- Optional Local CLI Execution ---

def extract_product_info_from_disk(image_paths: list[str]) -> dict:
    """Reads paths directly from disk."""
    encoded_images = []
    for p in image_paths:
        path = Path(p).expanduser().resolve()
        if not path.is_file():
            raise FileNotFoundError(f"Image not found at path: {path}")
        with Image.open(path) as img:
            img = ImageOps.exif_transpose(img)
            encoded_images.append(downscale_and_encode(img))

    return run_qwen_inference(encoded_images)


# --- SERVE STATIC ASSETS (HTML, CSS, JS) ---
# Mounted with absolute BASE_DIR so it works regardless of current working directory
app.mount("/", StaticFiles(directory=str(BASE_DIR), html=True), name="static")


if __name__ == "__main__":
    IMAGE_PATHS = [
        # "/home/swiz/testmodel/front.jpeg",
        # "/home/swiz/testmodel/back.jpeg",
    ]

    try:
        extracted_data = extract_product_info_from_disk(IMAGE_PATHS)
        print(json.dumps(extracted_data, indent=2))
    except Exception as e:
        print(f"Error processing images: {e}")
