import sqlite3
import os
import datetime
import random

DB_NAME = "financial_tracker.db"
DB_PATH = os.path.join(os.path.dirname(__file__), DB_NAME)

# -----------------------------
# DATABASE CONNECTION
# -----------------------------
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_db():
    return get_connection()

# -----------------------------
# INITIALIZE DATABASE
# -----------------------------
def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # -----------------------------
    # TRANSACTIONS TABLE (FIXED)
    # -----------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        note TEXT
    )
    """)

    # -----------------------------
    # STORAGE TABLE
    # -----------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS storage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_name TEXT NOT NULL,
        emoji TEXT,
        current_stock INTEGER,
        unit TEXT,
        min_level INTEGER,
        status TEXT
    )
    """)

    # -----------------------------
    # SALES TABLE
    # -----------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_name TEXT,
        quantity INTEGER,
        price REAL,
        total REAL,
        date TEXT
    )
    """)

    # -----------------------------
    # INSERT STORAGE ONLY IF EMPTY
    # -----------------------------
    cursor.execute("SELECT COUNT(*) FROM storage")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
        INSERT INTO storage (item_name, emoji, current_stock, unit, min_level, status)
        VALUES (?, ?, ?, ?, ?, ?)
        """, [
            ("Canned Tuna", "🥫", 10, "pcs", 30, "LOW"),
            ("Soft Drink", "🥤", 6, "bottles", 20, "CRITICAL"),
            ("Cooking Oil", "🫙", 5, "bottles", 20, "CRITICAL"),
            ("Instant Noodles", "🍜", 50, "packs", 20, "OK"),
        ])

    # -----------------------------
    # INSERT SALES ONLY IF EMPTY
    # -----------------------------
    cursor.execute("SELECT COUNT(*) FROM sales")
    if cursor.fetchone()[0] == 0:

        end_date = datetime.date.today()
        sales_entries = []

        for i in range(30):
            current_date = end_date - datetime.timedelta(days=(29 - i))
            total = 800 + (i * 10) + random.randint(-50, 50)

            sales_entries.append((
                "Daily Revenue",
                1,
                total,
                total,
                current_date.strftime("%Y-%m-%d")
            ))

        cursor.executemany("""
        INSERT INTO sales (item_name, quantity, price, total, date)
        VALUES (?, ?, ?, ?, ?)
        """, sales_entries)

    # ❗ IMPORTANT: DO NOT DELETE TRANSACTIONS
    # ❗ KEEP USER DATA SAFE

    conn.commit()
    conn.close()
    print("Database initialized (safe mode).")

if __name__ == "__main__":
    init_db()