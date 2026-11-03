# ⚖️ PAKSHAK — Autonomous Legal Metrology AI Engine
### *Next-Gen AI Label Compliance & Statutory Verification System*

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20VLM-black.svg?logo=ollama&logoColor=white)](https://ollama.ai/)
[![Model](https://img.shields.io/badge/Model-Qwen2.5--VL%3A7B-orange.svg)](https://ollama.com/library/qwen2.5vl)
[![Database](https://img.shields.io/badge/Database-SQLite3-003B57.svg?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Table of Contents

- [Overview & Mission](#-overview--mission)
- [The Regulatory Framework (Rule 6, 2011)](#-the-regulatory-framework-rule-6-2011)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Dependencies](#-dependencies)
  - [System & External Prerequisites](#1-system--external-prerequisites)
  - [Python Libraries](#2-python-libraries)
- [Installation & Quickstart](#-installation--quickstart)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Environment Setup](#2-environment-setup)
  - [3. Install Dependencies](#3-install-dependencies)
  - [4. Set Up Ollama & Vision Model](#4-set-up-ollama--vision-model)
  - [5. Run the Application](#5-run-the-application)
- [API Reference](#-api-reference)
  - [Audit Label Endpoint](#post-apiv1audit)
  - [Fetch Records Endpoint](#get-apiv1products)
- [Project Structure](#-project-structure)
- [Command Line Interface (CLI) Usage](#-command-line-interface-cli-usage)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)
- [Future Roadmap](#-future-roadmap)

---

## 📖 Overview & Mission

**PAKSHAK** (*Legal Metrology Packaging Auditor*) is an AI-powered compliance auditing platform engineered for the **Smart India Hackathon (SIH)**. It automates inspection and verification of mandatory statutory declarations on commercial packaged commodities under India's **Legal Metrology Act, 2009** and the **Legal Metrology (Packaged Commodities) Rules, 2011**.

Manual market surveillance by enforcement officers is slow, labor-intensive, and prone to human error. PAKSHAK bridges this gap by enabling:
1. **15-Second Field Audits:** Officers capture up to 3 angles (front, back, and MRP/quantity panel) of any product on shelves using a smartphone or tablet.
2. **Zero-Inference Hallucination Engine:** Multi-image visual inspection via **Qwen2.5-VL:7B** running locally through **Ollama** with deterministic parameters (`temperature=0.0`) and structured JSON schema enforcement.
3. **Consumer Empowerment:** Dual-mode portal serving both everyday buyers (spotting missing consumer helplines, tampered pricing, or missing net content) and enforcement inspectors (logging evidentiary dossiers into SQLite).

---

## 🏛️ The Regulatory Framework (Rule 6, 2011)

Every packaged commodity sold in India must display mandatory statutory declarations under **Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011**. PAKSHAK inspects and audits against all 10 core clauses:

| # | Statutory Clause | Field Extracted | Description |
|---|---|---|---|
| **1** | Rule 6(1) | `product_name` | Brand name and product trade identity |
| **2** | Rule 6(1)(b) | `generic_name` | Common or generic name of commodity |
| **3** | Rule 6(1)(a) | `manufacturer_name` | Legal name of manufacturer, packer, or importer |
| **4** | Rule 6(1)(a) | `manufacturer_address` | Physical manufacturing plant or registered address |
| **5** | Rule 6(1)(c) | `net_quantity` | Declared weight, volume, or piece count with standard metric units (`g`, `kg`, `ml`, `L`) |
| **6** | Rule 6(1)(e) | `mrp` | Maximum Retail Price inclusive of all taxes (strictly validated for numeric content) |
| **7** | Rule 6(1)(s) | `unit_sale_price` | Unit Sale Price per gram/milliliter/unit for transparency |
| **8** | Rule 6(1)(d) | `manufacturing_date` | Month and year / date of manufacture or packing |
| **9** | Rule 6(1)(d) | `use_by_date` | Best before date or expiry timeline |
| **10** | Rule 6(1)(n) | `consumer_care_details` | Customer grievance helpline, official email, or postal address |

---

## ⚡ Key Features

- **Multi-Angle Visual Synthesis:** Accepts up to 3 package angles simultaneously to synthesize text spread across front panels, nutrition labels, and side flaps.
- **Smart Image Preprocessing:** Automatic RGB conversion, aspect ratio preservation, and Lanczos downscaling (capped at 1024px) for optimal VLM latency and memory efficiency.
- **Strict Pydantic JSON Guardrails:** Guarantees uniform schema compliance from the AI model; unmentioned or obscured fields are strictly flagged as `false`.
- **Post-Inference Regex Validation:** Sanitizes model output against hallucinated textual pricing or dates by requiring explicit numeric confirmation.
- **Dual Portal Switcher:**
  - 👤 **Consumer Protection Mode:** Intuitive citizen scan view for grocery and retail checks.
  - 🛡️ **Inspector Enforcement Mode:** Amber-accented tactical HUD with tamper-proof dossier PDF export triggers.
  - 📋 **Database Records Viewer:** Interactive modal pulling all recorded audits from SQLite (`database.db`) with visual flags for missing fields.
- **Live Canvas Simulation:** Cybernetic HUD animation showing real-time scanning simulation on the landing page.
- **Zero Cloud Dependence:** Complete privacy and operational security—all inference runs 100% on-premise/locally via Ollama.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    A["📸 Multi-Angle Package Capture<br/>(1-3 Photos: Front, Back, MRP Panel)"] --> B["🌐 Web Interface / Mobile Client<br/>(Vanilla JS + Canvas HUD)"]
    B -->|Multipart POST /api/v1/audit| C["⚡ FastAPI Server (main.py)"]
    
    subgraph Preprocessing ["Image Optimization Engine"]
        C --> D["Pillow Image Processor"]
        D --> E["Lanczos Downscaling (Max 1024px)"]
        E --> F["Base64 JPEG Matrix Encoding"]
    end
    
    subgraph LocalVLM ["Deterministic AI Inference"]
        F --> G["Ollama Server (Local API)"]
        G --> H["Qwen2.5-VL:7B Vision-Language Model"]
        H -->|Zero Temp (0.0) + Pydantic Schema| I["Structured JSON Extraction"]
    end
    
    subgraph ValidationPersistence ["Rule 6 Verification & Storage"]
        I --> J["Regex Post-Inference Sanitizer<br/>(Validates numeric MRP, USP, Mfg Date)"]
        J --> K["Audit Verdict Generator<br/>(COMPLIANT vs NON-COMPLIANT)"]
        K --> L[("🗄️ SQLite Database<br/>(database.db)")]
    end
    
    K -->|Audit JSON Payload| B
    L -->|GET /api/v1/products| M["📋 Inspection Records Modal"]
```

---

## 📦 Dependencies

### 1. System & External Prerequisites

| Dependency | Required Version | Purpose |
|---|---|---|
| **Python** | `3.10` or higher | Required for modern type union syntax (`str \| bool`) |
| **Ollama** | Latest release | Local inference server for running open-source Vision Models |
| **Model: Qwen2.5-VL** | `7b` (`qwen2.5vl:7b`) | Multi-modal vision-language model trained for high-precision OCR and document understanding |
| **SQLite3** | Bundled with Python | Embedded database engine for compliance audit records (`database.db`) |
| **Hardware Recommendation** | 8 GB+ VRAM (NVIDIA GPU) or Apple Silicon / 16 GB System RAM | For smooth local inference of the 7B Vision Model |

### 2. Python Libraries

The project dependencies are managed via [requirements.txt](file:///home/swiz/Projects/test/sih-compliance-engine/requirements.txt):

| Package | Version | Purpose in Project |
|---|---|---|
| **`fastapi`** | `>=0.110.0` | High-performance async web framework powering the REST API and serving static assets |
| **`uvicorn[standard]`** | `>=0.28.0` | Production-grade ASGI server implementation for hosting the FastAPI application |
| **`pydantic`** | `>=2.0.0` | Data validation, structured schema extraction, and JSON Schema generation for the LLM prompt |
| **`ollama`** | `>=0.3.0` | Official Python client library to interface directly with the local Ollama daemon |
| **`pillow`** | `>=10.0.0` | Python Imaging Library (PIL) for image resizing, RGB conversion, and JPEG compression |
| **`python-multipart`** | `>=0.0.9` | Required by FastAPI to process streaming `multipart/form-data` file uploads |

---

## 🚀 Installation & Quickstart

### 1. Clone Repository

```bash
git clone https://github.com/SWIZ6/sih-compliance-engine.git
cd sih-compliance-engine
```

### 2. Environment Setup

It is strongly recommended to use a Python virtual environment:

```bash
# Create virtual environment
python3 -m venv venv

# Activate on Linux / macOS:
source venv/bin/activate

# Or activate on Windows (PowerShell):
# .\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies

Install all required Python packages with `pip`:

```bash
pip install -r requirements.txt
```

### 4. Set Up Ollama & Vision Model

1. **Install Ollama**: Follow instructions for your operating system at [ollama.com/download](https://ollama.com/download).
   - Linux:
     ```bash
     curl -fsSL https://ollama.com/install.sh | sh
     ```
2. **Start the Ollama daemon**:
   ```bash
   ollama serve
   ```
3. **Pull the Qwen2.5-VL model** (in a separate terminal window):
   ```bash
   ollama pull qwen2.5vl:7b
   ```
   > *Verify the model is ready:*
   > ```bash
   > ollama list
   > ```

### 5. Run the Application

Start the FastAPI backend with Uvicorn:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Once running, open your web browser and navigate to:
```text
http://localhost:8000
```
- The frontend will load automatically from [index.html](file:///home/swiz/Projects/test/sih-compliance-engine/index.html).
- Interactive Swagger API docs are available at: `http://localhost:8000/docs`.

---

## 🔌 API Reference

### `POST /api/v1/audit`
Uploads 1 to 3 packaging photos, runs deterministic VLM extraction, validates Rule 6 fields, and stores the audit in SQLite.

- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `files` (`list[UploadFile]`): 1 to 3 valid image files (JPEG, PNG, WEBP).

#### Sample Request (cURL)
```bash
curl -X POST "http://localhost:8000/api/v1/audit" \
  -F "files=@packaging_front.jpg" \
  -F "files=@packaging_back.jpg"
```

#### Sample Response (`200 OK`)
```json
{
  "status": "success",
  "record_id": 4,
  "images_analyzed": 2,
  "data": {
    "product_name": "Premium Basmati Rice",
    "generic_name": "Rice",
    "manufacturer_name": "Agro Foods India Ltd.",
    "manufacturer_address": "Plot 42, Industrial Area, Phase II, Karnal, Haryana",
    "net_quantity": "5 kg",
    "mrp": "₹450.00",
    "unit_sale_price": "₹90.00/kg",
    "manufacturing_date": "08/2026",
    "use_by_date": "08/2028",
    "consumer_care_details": "care@agrofoods.in | 1800-111-222"
  }
}
```

*Note: If any mandatory statutory field is missing or unreadable on the packaging, its value will strictly be returned as `false`.*

---

### `GET /api/v1/products`
Retrieves past packaging audit records from the SQLite database.

- **Query Parameters:**
  - `limit` (*integer, optional, default: 50*): Maximum number of recent records to retrieve.

#### Sample Request
```bash
curl -X GET "http://localhost:8000/api/v1/products?limit=10"
```

---

## 💻 Command Line Interface (CLI) Usage

You can also run batch label extraction directly from disk without starting the web server:

1. Open [main.py](file:///home/swiz/Projects/test/sih-compliance-engine/main.py) and uncomment image paths under `if __name__ == "__main__":`:
   ```python
   IMAGE_PATHS = [
       "/path/to/packaging_front.jpg",
       "/path/to/packaging_back.jpg"
   ]
   ```
2. Execute the script:
   ```bash
   python main.py
   ```

---

## 📁 Project Structure

```text
sih-compliance-engine/
├── database.db          # Embedded SQLite database storing verified audit records
├── database.py          # Database operations (schema initialization, record insertion, querying)
├── index.html           # Single-page application UI (Landing page, citizen & inspector portals)
├── main.py              # FastAPI server, Ollama VLM pipeline, Pydantic schemas, and endpoints
├── requirements.txt     # Python package dependencies
├── script.js            # Frontend logic (camera/gallery triggers, API calls, dynamic themes, canvas animation)
├── style.css            # Cybernetic styling, responsive layout, dark/amber theme variations
└── .gitignore           # Git ignore configuration
```

---

## 🛠️ Troubleshooting & FAQs

### 1. `Inference error: Failed to connect to Ollama`
- **Cause:** The Ollama service is not running on your host machine.
- **Fix:** Start the daemon in your terminal with:
  ```bash
  ollama serve
  ```

### 2. `model "qwen2.5vl:7b" not found`
- **Cause:** The Qwen2.5-VL weights have not been pulled yet.
- **Fix:** Download the weights using:
  ```bash
  ollama pull qwen2.5vl:7b
  ```

### 3. `Maximum 3 images permitted` or `No images received`
- **Cause:** The endpoint requires at least 1 image and at most 3 images to prevent GPU memory saturation.
- **Fix:** Select between 1 and 3 photos (e.g., front face, nutritional label, MRP stamping).

### 4. Low VRAM / Out of Memory
- If running on a GPU with less than 6 GB VRAM, Ollama will automatically offload partial layers to system RAM.
- Ensure that the Lanczos downscale resolution in `main.py` is kept at `max_res=1024` or reduce to `max_res=768` for faster processing on constrained hardware.

---

## 🔮 Future Roadmap

- [ ] **Barcode & GS1 GTIN Cross-Verification:** Scan EAN-13 barcodes to validate extracted manufacturer data against national registries.
- [ ] **Automated Font Size & Ratio Checking (Rule 7):** Measure character height relative to package area to detect sub-standard font violations.
- [ ] **Multi-Lingual Indic OCR:** Native packaging parsing in Hindi, Tamil, Telugu, and other regional Indian languages.
- [ ] **Automated Legal Notice Generator:** One-click PDF notice dispatch ready for enforcement officers under Section 39 of the Legal Metrology Act.

---

<div align="center">
  <sub>Developed for the Smart India Hackathon (SIH) • Department of Consumer Affairs Compliance Automation</sub>
</div>
