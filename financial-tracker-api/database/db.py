import os
import sqlite3
from typing import Any, Iterable

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # pragma: no cover - only needed for hosted Postgres deploys
    psycopg = None
    dict_row = None

DB_NAME = "financial_tracker.db"


def _default_db_path() -> str:
    env_path = os.getenv("DATABASE_PATH")
    if env_path:
        return env_path

    # Vercel file systems are read-only except for /tmp, so use that when no
    # hosted Postgres database has been attached yet.
    if os.getenv("VERCEL") and not os.getenv("DATABASE_URL", "").strip():
        return os.path.join("/tmp", DB_NAME)

    return os.path.join(os.path.dirname(__file__), DB_NAME)


DEFAULT_DB_PATH = _default_db_path()
DB_PATH = DEFAULT_DB_PATH
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
POSTGRES_SSLMODE = os.getenv("POSTGRES_SSLMODE", "").strip()


def using_postgres() -> bool:
    return bool(os.getenv("DATABASE_URL", DATABASE_URL).strip())


def _ensure_database_directory() -> None:
    database_dir = os.path.dirname(DB_PATH)
    if database_dir:
        os.makedirs(database_dir, exist_ok=True)


def _get_postgres_connection():
    if psycopg is None:
        raise RuntimeError(
            "DATABASE_URL is set, but psycopg is not installed. "
            "Add psycopg[binary] to requirements before deploying."
        )

    database_url = os.getenv("DATABASE_URL", DATABASE_URL).strip()
    sslmode = os.getenv("POSTGRES_SSLMODE", POSTGRES_SSLMODE).strip()

    connect_kwargs = {"row_factory": dict_row}
    if sslmode and "sslmode=" not in database_url:
        connect_kwargs["sslmode"] = sslmode

    return psycopg.connect(database_url, **connect_kwargs)


def get_connection():
    if using_postgres():
        return _get_postgres_connection()

    _ensure_database_directory()
    sqlite_kwargs = {"uri": DB_PATH.startswith("file:")}
    conn = sqlite3.connect(DB_PATH, **sqlite_kwargs)
    conn.row_factory = sqlite3.Row
    return conn


def get_db():
    return get_connection()


def _adapt_query(query: str) -> str:
    if not using_postgres():
        return query
    return query.replace("?", "%s")


def execute(cursor, query: str, params: Iterable[Any] | None = None):
    cursor.execute(_adapt_query(query), tuple(params or ()))
    return cursor


def executemany(cursor, query: str, rows: Iterable[Iterable[Any]]):
    cursor.executemany(_adapt_query(query), rows)
    return cursor


def get_table_columns(cursor, table_name: str) -> list[str]:
    if using_postgres():
        execute(
            cursor,
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = ?
            ORDER BY ordinal_position
            """,
            (table_name,),
        )
        return [row["column_name"] for row in cursor.fetchall()]

    cursor.execute(f"PRAGMA table_info({table_name})")
    return [row[1] for row in cursor.fetchall()]


def insert_and_get_id(cursor, query: str, params: Iterable[Any] | None = None) -> int:
    values = tuple(params or ())
    if using_postgres():
        returning_query = query.rstrip().rstrip(";")
        if "RETURNING" not in returning_query.upper():
            returning_query += " RETURNING id"
        execute(cursor, returning_query, values)
        row = cursor.fetchone()
        return int(row["id"])

    execute(cursor, query, values)
    return int(cursor.lastrowid)


def _create_transactions_table(cursor) -> None:
    if using_postgres():
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                to_name TEXT,
                type TEXT NOT NULL,
                category TEXT,
                amount DOUBLE PRECISION NOT NULL,
                date TEXT NOT NULL DEFAULT '',
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS to_name TEXT")
        cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category TEXT")
        cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS note TEXT")
        cursor.execute(
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        )
        return

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            to_name TEXT,
            type TEXT NOT NULL,
            category TEXT,
            amount REAL NOT NULL,
            date TEXT NOT NULL DEFAULT '',
            note TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    columns = set(get_table_columns(cursor, "transactions"))
    if "to_name" not in columns:
        cursor.execute("ALTER TABLE transactions ADD COLUMN to_name TEXT")
    if "category" not in columns:
        cursor.execute("ALTER TABLE transactions ADD COLUMN category TEXT")
    if "note" not in columns:
        cursor.execute("ALTER TABLE transactions ADD COLUMN note TEXT")
    if "created_at" not in columns:
        cursor.execute("ALTER TABLE transactions ADD COLUMN created_at TEXT")


def _create_storage_table(cursor) -> None:
    if using_postgres():
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS storage (
                id SERIAL PRIMARY KEY,
                item_name TEXT NOT NULL,
                emoji TEXT,
                current_stock INTEGER DEFAULT 0,
                unit TEXT,
                min_level INTEGER DEFAULT 0,
                status TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute(
            "ALTER TABLE storage ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        )
        return

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

    if "updated_at" not in get_table_columns(cursor, "storage"):
        cursor.execute("ALTER TABLE storage ADD COLUMN updated_at TEXT")


def _create_sales_table(cursor) -> None:
    if using_postgres():
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                item_name TEXT,
                quantity INTEGER,
                price DOUBLE PRECISION,
                total DOUBLE PRECISION,
                date TEXT
            )
            """
        )
        return

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
    """Create required tables for either local SQLite or hosted Postgres."""
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

        if using_postgres():
            cursor.execute("TRUNCATE TABLE transactions RESTART IDENTITY")
        else:
            cursor.execute("DELETE FROM transactions")
            try:
                cursor.execute(
                    "DELETE FROM sqlite_sequence WHERE name = ?",
                    ("transactions",),
                )
            except sqlite3.OperationalError:
                pass

        conn.commit()
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
