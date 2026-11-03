import sqlite3
from pathlib import Path

# Resolve DB path relative to this script directory to prevent CWD dependency issues
DB_FILE = Path(__file__).resolve().parent / "database.db"

def _clean_field(val) -> str | None:
    """Sanitizes field values so None, False, or string placeholders convert to SQL NULL."""
    if val is None or val is False:
        return None
    s = str(val).strip()
    if s.lower() in ("false", "none", "null", "missing", "n/a", "not declared", ""):
        return None
    return s

def init_db():
    """Initializes the SQLite database schema if not already present."""
    with sqlite3.connect(DB_FILE, timeout=10.0) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_details (
                product_id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_name TEXT,
                generic_name TEXT,
                manufacturer_name TEXT,
                manufacturer_address TEXT,
                net_quantity TEXT,
                mrp TEXT,
                unit_sale_price TEXT,
                manufacturing_date TEXT,
                use_by_date TEXT,
                consumer_care_details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()

def save_product_record(data: dict) -> int:
    """Inserts an extracted product record and returns its product_id."""
    with sqlite3.connect(DB_FILE, timeout=10.0) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO product_details (
                product_name,
                generic_name,
                manufacturer_name,
                manufacturer_address,
                net_quantity,
                mrp,
                unit_sale_price,
                manufacturing_date,
                use_by_date,
                consumer_care_details
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            _clean_field(data.get("product_name")),
            _clean_field(data.get("generic_name")),
            _clean_field(data.get("manufacturer_name")),
            _clean_field(data.get("manufacturer_address")),
            _clean_field(data.get("net_quantity")),
            _clean_field(data.get("mrp")),
            _clean_field(data.get("unit_sale_price")),
            _clean_field(data.get("manufacturing_date")),
            _clean_field(data.get("use_by_date")),
            _clean_field(data.get("consumer_care_details")),
        ))
        conn.commit()
        return cursor.lastrowid

def get_all_products(limit: int = 50) -> list[dict]:
    """Retrieves the most recent product records."""
    init_db()  # Ensure database and table exist
    with sqlite3.connect(DB_FILE, timeout=10.0) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM product_details ORDER BY product_id DESC LIMIT ?", (limit,))
        return [dict(row) for row in cursor.fetchall()]
