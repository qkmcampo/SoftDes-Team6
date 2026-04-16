import os
import sqlite3

DB_NAME = "financial_tracker.db"
DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), DB_NAME)
DB_PATH = os.getenv("DATABASE_PATH", DEFAULT_DB_PATH)


def _ensure_database_directory() -> None:
    database_dir = os.path.dirname(DB_PATH)
    if database_dir:
        os.makedirs(database_dir, exist_ok=True)


def get_connection() -> sqlite3.Connection:
    _ensure_database_directory()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_db() -> sqlite3.Connection:
    return get_connection()


def _get_table_columns(cursor: sqlite3.Cursor, table_name: str) -> set[str]:
    cursor.execute(f"PRAGMA table_info({table_name})")
    return {row[1] for row in cursor.fetchall()}


def _create_transactions_table(cursor: sqlite3.Cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            note TEXT
        )
        """
    )


def _create_storage_table(cursor: sqlite3.Cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS storage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL,
            emoji TEXT,
            current_stock INTEGER,
            unit TEXT,
            min_level INTEGER,
            status TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    if "updated_at" not in _get_table_columns(cursor, "storage"):
        cursor.execute("ALTER TABLE storage ADD COLUMN updated_at TEXT")


def _create_sales_table(cursor: sqlite3.Cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT,
            quantity INTEGER,
            price REAL,
            total REAL,
            date TEXT
        )
        """
    )


def init_db() -> None:
    """Create required tables without inserting sample transactions."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        _create_transactions_table(cursor)
        _create_storage_table(cursor)
        _create_sales_table(cursor)
        conn.commit()
    finally:
        conn.close()


def reset_transactions() -> None:
    """Clear all transactions and reset the next transaction ID to 1."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        _create_transactions_table(cursor)
        cursor.execute("DELETE FROM transactions")

        try:
            cursor.execute(
                "DELETE FROM sqlite_sequence WHERE name = ?",
                ("transactions",),
            )
        except sqlite3.OperationalError:
            # sqlite_sequence may not exist yet on a brand-new database.
            pass

        conn.commit()
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
