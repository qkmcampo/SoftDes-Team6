import os
import sqlite3
import sys

import pytest

sys.path.insert(0, os.path.dirname(__file__))

from app import app
from database import db as db_module
from routes import transactions as transactions_module

TEST_DATE = "2026-04-16"
MEMORY_DB_URI = "file:transaction_validation_pytest?mode=memory&cache=shared"
VALIDATION_CASES = [
    {
        "trial": 1,
        "label": "Missing name (amount only)",
        "request": {"json": {"amount": -500}},
        "expected_status": 400,
        "expected_error": "Please enter a transaction name or description.",
        "expected_field": "to_name",
    },
    {
        "trial": 2,
        "label": "Missing amount (name only)",
        "request": {"json": {"to_name": "Test Supplier"}},
        "expected_status": 400,
        "expected_error": "Please enter an amount before saving this transaction.",
        "expected_field": "amount",
    },
    {
        "trial": 3,
        "label": "Empty name (blank string)",
        "request": {"json": {"to_name": "", "amount": -500}},
        "expected_status": 400,
        "expected_error": "Please enter a transaction name or description.",
        "expected_field": "to_name",
    },
    {
        "trial": 4,
        "label": "Empty name (whitespace only)",
        "request": {"json": {"to_name": "   ", "amount": -500}},
        "expected_status": 400,
        "expected_error": "Please enter a transaction name or description.",
        "expected_field": "to_name",
    },
    {
        "trial": 5,
        "label": "Empty JSON body {}",
        "request": {"json": {}},
        "expected_status": 400,
        "expected_error": "No transaction details were received.",
        "expected_field": "request",
    },
    {
        "trial": 6,
        "label": "JSON array body []",
        "request": {"json": []},
        "expected_status": 400,
        "expected_error": "No transaction details were received.",
        "expected_field": "request",
    },
    {
        "trial": 7,
        "label": "No JSON content-type",
        "request": {"data": '{"to_name":"Plain","amount":1}'},
        "expected_status": 400,
        "expected_error": "No transaction details were received.",
        "expected_field": "request",
    },
    {
        "trial": 8,
        "label": "Malformed JSON body",
        "request": {"data": '{"to_name":"Broken"', "content_type": "application/json"},
        "expected_status": 400,
        "expected_error": "No transaction details were received.",
        "expected_field": "request",
    },
    {
        "trial": 9,
        "label": "Missing both name and amount",
        "request": {"json": {"type": "expense", "date": TEST_DATE}},
        "expected_status": 400,
        "expected_error": "Please enter a transaction name or description.",
        "expected_field": "to_name",
    },
    {
        "trial": 10,
        "label": "Null amount",
        "request": {"json": {"to_name": "Null Amount", "amount": None, "date": TEST_DATE}},
        "expected_status": 400,
        "expected_error": "Please enter an amount before saving this transaction.",
        "expected_field": "amount",
    },
    {
        "trial": 11,
        "label": "Empty string amount",
        "request": {"json": {"to_name": "Empty Amount", "amount": "", "date": TEST_DATE}},
        "expected_status": 400,
        "expected_error": "Please enter a valid numeric amount.",
        "expected_field": "amount",
    },
    {
        "trial": 12,
        "label": "Non-numeric amount",
        "request": {"json": {"to_name": "Bad Amount", "amount": "abc", "date": TEST_DATE}},
        "expected_status": 400,
        "expected_error": "Please enter a valid numeric amount.",
        "expected_field": "amount",
    },
    {
        "trial": 13,
        "label": "Amount = 0",
        "request": {
            "json": {
                "to_name": "Zero Amount",
                "amount": 0,
                "type": "expense",
                "date": TEST_DATE,
            }
        },
        "expected_status": 201,
        "expected_stored": {
            "category": "Zero Amount",
            "amount": 0.0,
            "type": "expense",
            "date": TEST_DATE,
        },
    },
    {
        "trial": 14,
        "label": "Negative amount expense",
        "request": {
            "json": {
                "to_name": "Negative Expense",
                "amount": -500,
                "type": "expense",
                "date": TEST_DATE,
            }
        },
        "expected_status": 201,
        "expected_stored": {
            "category": "Negative Expense",
            "amount": -500.0,
            "type": "expense",
            "date": TEST_DATE,
        },
    },
    {
        "trial": 15,
        "label": "Very large amount",
        "request": {
            "json": {
                "to_name": "Large Deposit",
                "amount": 999999999.99,
                "type": "income",
                "date": TEST_DATE,
            }
        },
        "expected_status": 201,
        "expected_stored": {
            "category": "Large Deposit",
            "amount": 999999999.99,
            "type": "income",
            "date": TEST_DATE,
        },
    },
    {
        "trial": 16,
        "label": "Missing type field",
        "request": {
            "json": {
                "to_name": "Default Type",
                "amount": -50,
                "date": TEST_DATE,
            }
        },
        "expected_status": 201,
        "expected_stored": {
            "category": "Default Type",
            "amount": -50.0,
            "type": "expense",
            "date": TEST_DATE,
        },
    },
    {
        "trial": 17,
        "label": "Missing date field",
        "request": {
            "json": {
                "to_name": "No Date",
                "amount": -75,
                "type": "expense",
            }
        },
        "expected_status": 201,
        "expected_stored": {
            "category": "No Date",
            "amount": -75.0,
            "type": "expense",
            "date": "",
        },
    },
    {
        "trial": 18,
        "label": "Missing note field",
        "request": {
            "json": {
                "to_name": "No Note",
                "amount": 120,
                "type": "income",
                "date": TEST_DATE,
            }
        },
        "expected_status": 201,
        "expected_stored": {
            "category": "No Note",
            "amount": 120.0,
            "type": "income",
            "date": TEST_DATE,
            "note": "",
        },
    },
    {
        "trial": 19,
        "label": "Use category alias instead of to_name",
        "request": {
            "json": {
                "category": "Category Alias",
                "amount": -30,
                "type": "expense",
                "date": TEST_DATE,
            }
        },
        "expected_status": 201,
        "expected_stored": {
            "category": "Category Alias",
            "amount": -30.0,
            "type": "expense",
            "date": TEST_DATE,
        },
    },
    {
        "trial": 20,
        "label": "Use name alias instead of to_name",
        "request": {
            "json": {
                "name": "Name Alias",
                "amount": 25,
                "type": "income",
                "date": TEST_DATE,
            }
        },
        "expected_status": 201,
        "expected_stored": {
            "category": "Name Alias",
            "amount": 25.0,
            "type": "income",
            "date": TEST_DATE,
        },
    },
]


def _get_memory_db():
    conn = sqlite3.connect(MEMORY_DB_URI, uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def _reset_memory_db():
    keeper = _get_memory_db()
    cursor = keeper.cursor()
    cursor.execute("DROP TABLE IF EXISTS transactions")
    cursor.execute(
        """
        CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            note TEXT
        )
        """
    )
    keeper.commit()
    return keeper


@pytest.fixture
def client():
    app.config["TESTING"] = True
    original_db_getter = db_module.get_db
    original_route_getter = transactions_module.get_db
    keeper = _reset_memory_db()

    db_module.get_db = _get_memory_db
    transactions_module.get_db = _get_memory_db

    try:
        with app.test_client() as client:
            yield client
    finally:
        db_module.get_db = original_db_getter
        transactions_module.get_db = original_route_getter
        keeper.close()


def _count_transactions():
    conn = db_module.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) AS count FROM transactions")
    count = cursor.fetchone()["count"]
    conn.close()
    return count


def _latest_transaction():
    conn = db_module.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


@pytest.mark.parametrize(
    "case",
    VALIDATION_CASES,
    ids=[f"trial_{case['trial']:02d}" for case in VALIDATION_CASES],
)
def test_transaction_validation_trials(client, case):
    print(f"\n===== TEST CASE 6: TRIAL {case['trial']:02d} =====")
    print(f"Scenario: {case['label']}")

    before_count = _count_transactions()
    response = client.post("/api/transactions", **case["request"])
    data = response.get_json()

    print(f"Expected Status: {case['expected_status']}")
    print("Actual Status Code:", response.status_code)
    print("Actual Response:", data)

    assert response.status_code == case["expected_status"]

    if case["expected_status"] == 400:
        assert _count_transactions() == before_count
        assert data["status"] == "error"
        assert data["title"] == "Unable to save transaction"
        assert data["error"] == case["expected_error"]
        assert data["field"] == case["expected_field"]
        assert "details" in data
        print("Result: PASSED (validation blocked invalid request)")
        return

    assert _count_transactions() == before_count + 1
    assert data["status"] == "success"
    assert data["message"] == "Transaction saved successfully."
    assert "id" in data

    stored = _latest_transaction()
    expected_stored = case["expected_stored"]
    for key, expected_value in expected_stored.items():
        assert stored[key] == expected_value

    print("Stored Row:", stored)
    print("Result: PASSED (valid request stored correctly)")
