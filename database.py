import sqlite3

DB_FILE = "database.db"

def init_db():
    """Initializes the SQLite database schema if not already present."""
    with sqlite3.connect(DB_FILE) as conn:
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
    with sqlite3.connect(DB_FILE) as conn:
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
            str(data.get("product_name")) if data.get("product_name") is not False else None,
            str(data.get("generic_name")) if data.get("generic_name") is not False else None,
            str(data.get("manufacturer_name")) if data.get("manufacturer_name") is not False else None,
            str(data.get("manufacturer_address")) if data.get("manufacturer_address") is not False else None,
            str(data.get("net_quantity")) if data.get("net_quantity") is not False else None,
            str(data.get("mrp")) if data.get("mrp") is not False else None,
            str(data.get("unit_sale_price")) if data.get("unit_sale_price") is not False else None,
            str(data.get("manufacturing_date")) if data.get("manufacturing_date") is not False else None,
            str(data.get("use_by_date")) if data.get("use_by_date") is not False else None,
            str(data.get("consumer_care_details")) if data.get("consumer_care_details") is not False else None,
        ))
        conn.commit()
        return cursor.lastrowid

def get_all_products(limit: int = 50) -> list[dict]:
    """Retrieves the most recent product records."""
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM product_details ORDER BY product_id DESC LIMIT ?", (limit,))
        return [dict(row) for row in cursor.fetchall()]