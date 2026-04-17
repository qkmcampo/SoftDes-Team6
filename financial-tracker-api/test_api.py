import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(__file__))

from app import app
from database import db as db_module
from database.db import execute, init_db
from routes import assistant as assistant_module

TEST_DATE = "2026-04-15"
TRANSACTION_CASES = [
    ("Supplier Payment", -500),
    ("Store Sales", 4500),
    ("Electricity Bill", -1200),
    ("Water Bill", -350),
    ("Customer Payment", 2000),
    ("Inventory Restock", -3000),
    ("Daily Sales", 1800),
    ("Rent Payment", -5000),
    ("Loan Repayment", -1000),
    ("Weekend Sales", 3200),
    ("Grocery Purchase", -800),
    ("Online Sales", 2500),
    ("Internet Bill", -1500),
    ("Mobile Load Sales", 900),
    ("Equipment Repair", -2200),
    ("Cash Deposit", 5000),
    ("Transportation", -600),
    ("Product Sales", 2700),
    ("Utility Payment", -1300),
    ("Bonus Income", 4000),
]
RESTOCK_STOCK_LEVELS = [50, 45, 40, 35, 30, 29, 28, 25, 22, 20, 18, 15, 14, 10, 8, 5, 2, 1, 0, 60]
CHAT_MESSAGES = [
    "What should I restock first today?",
    "How is my cash flow looking this week?",
    "Which expenses are affecting my balance the most?",
    "Do I need to adjust my budget for daily operations?",
    "What inventory items are close to the minimum level?",
    "Summarize today's financial movement for me.",
    "Which sales entries helped the balance the most?",
    "Should I be worried about my recurring expenses?",
    "Give me a quick recommendation for better savings.",
    "Can you explain my current wallet balance simply?",
    "What should I review before the end of the day?",
    "Which items look safe enough to restock later?",
    "How can I improve cash flow next week?",
    "What recent expenses should I reduce first?",
    "Which transactions look strongest for income?",
    "What is the smartest next action for inventory planning?",
    "Can you give a short business health update?",
    "What are the main things I should monitor tomorrow?",
    "How can I stay on top of both stock and budget?",
    "What is your top financial recommendation right now?",
]


def _validation_error_case(trial, label, request_kwargs, expected_field, expected_error):
    return {
        "trial": trial,
        "label": label,
        "request": request_kwargs,
        "expected_status": 400,
        "expected_field": expected_field,
        "expected_error": expected_error,
    }


def _validation_success_case(trial, label, payload, expected_row):
    return {
        "trial": trial,
        "label": label,
        "request": {"json": payload},
        "expected_status": 201,
        "expected_row": expected_row,
    }


VALIDATION_CASES = [
    _validation_error_case(
        1,
        "Missing name (amount only)",
        {"json": {"amount": -500}},
        "to_name",
        "Please enter a transaction name or description.",
    ),
    _validation_error_case(
        2,
        "Missing amount (name only)",
        {"json": {"to_name": "Test Supplier"}},
        "amount",
        "Please enter an amount before saving this transaction.",
    ),
    _validation_error_case(
        3,
        "Empty name (blank string)",
        {"json": {"to_name": "", "amount": -500}},
        "to_name",
        "Please enter a transaction name or description.",
    ),
    _validation_error_case(
        4,
        "Empty name (whitespace only)",
        {"json": {"to_name": "   ", "amount": -500}},
        "to_name",
        "Please enter a transaction name or description.",
    ),
    _validation_error_case(
        5,
        "Empty JSON body {}",
        {"json": {}},
        "request",
        "No transaction details were received.",
    ),
    _validation_error_case(
        6,
        "JSON array body []",
        {"json": []},
        "request",
        "No transaction details were received.",
    ),
    _validation_error_case(
        7,
        "No JSON content-type",
        {"data": '{"to_name":"Plain","amount":1}'},
        "request",
        "No transaction details were received.",
    ),
    _validation_error_case(
        8,
        "Malformed JSON body",
        {"data": '{"to_name":"Broken"', "content_type": "application/json"},
        "request",
        "No transaction details were received.",
    ),
    _validation_error_case(
        9,
        "Missing both name and amount",
        {"json": {"type": "expense", "date": TEST_DATE}},
        "to_name",
        "Please enter a transaction name or description.",
    ),
    _validation_error_case(
        10,
        "Null amount",
        {"json": {"to_name": "Null Amount", "amount": None, "date": TEST_DATE}},
        "amount",
        "Please enter an amount before saving this transaction.",
    ),
    _validation_error_case(
        11,
        "Empty string amount",
        {"json": {"to_name": "Empty Amount", "amount": "", "date": TEST_DATE}},
        "amount",
        "Please enter a valid numeric amount.",
    ),
    _validation_error_case(
        12,
        "Non-numeric amount",
        {"json": {"to_name": "Bad Amount", "amount": "abc", "date": TEST_DATE}},
        "amount",
        "Please enter a valid numeric amount.",
    ),
    _validation_success_case(
        13,
        "Amount = 0",
        {"to_name": "Zero Amount", "amount": 0, "type": "expense", "date": TEST_DATE},
        {
            "to_name": "Zero Amount",
            "category": None,
            "amount": 0.0,
            "type": "expense",
            "date": TEST_DATE,
            "note": "",
        },
    ),
    _validation_success_case(
        14,
        "Negative amount expense",
        {"to_name": "Negative Expense", "amount": -500, "type": "expense", "date": TEST_DATE},
        {
            "to_name": "Negative Expense",
            "category": None,
            "amount": -500.0,
            "type": "expense",
            "date": TEST_DATE,
            "note": "",
        },
    ),
    _validation_success_case(
        15,
        "Very large amount",
        {"to_name": "Large Deposit", "amount": 999999999.99, "type": "income", "date": TEST_DATE},
        {
            "to_name": "Large Deposit",
            "category": None,
            "amount": 999999999.99,
            "type": "income",
            "date": TEST_DATE,
            "note": "",
        },
    ),
    _validation_success_case(
        16,
        "Missing type field",
        {"to_name": "Default Type", "amount": -50, "date": TEST_DATE},
        {
            "to_name": "Default Type",
            "category": None,
            "amount": -50.0,
            "type": "expense",
            "date": TEST_DATE,
            "note": "",
        },
    ),
    _validation_success_case(
        17,
        "Missing date field",
        {"to_name": "No Date", "amount": -75, "type": "expense"},
        {
            "to_name": "No Date",
            "category": None,
            "amount": -75.0,
            "type": "expense",
            "date": "",
            "note": "",
        },
    ),
    _validation_success_case(
        18,
        "Missing note field",
        {"to_name": "No Note", "amount": 120, "type": "income", "date": TEST_DATE},
        {
            "to_name": "No Note",
            "category": None,
            "amount": 120.0,
            "type": "income",
            "date": TEST_DATE,
            "note": "",
        },
    ),
    _validation_success_case(
        19,
        "Use name alias instead of to_name",
        {"name": "Name Alias", "amount": 25, "type": "income", "date": TEST_DATE},
        {
            "to_name": "Name Alias",
            "category": None,
            "amount": 25.0,
            "type": "income",
            "date": TEST_DATE,
            "note": "",
        },
    ),
    _validation_success_case(
        20,
        "Missing category field",
        {"to_name": "Category Optional", "amount": 80, "type": "income", "date": TEST_DATE},
        {
            "to_name": "Category Optional",
            "category": None,
            "amount": 80.0,
            "type": "income",
            "date": TEST_DATE,
            "note": "",
        },
    ),
]


def _build_transaction_payload(name, amount):
    return {
        "to_name": name,
        "category": name,
        "amount": amount,
        "type": "income" if amount > 0 else "expense",
        "date": TEST_DATE,
    }


def _build_chat_history(index):
    history = []
    if index % 2 == 0:
        history.append({"role": "user", "content": "Earlier budget concern"})
        history.append({"role": "assistant", "content": "Previous budgeting advice"})
    if index % 3 == 0:
        history.append({"role": "user", "content": "Follow-up about stock levels"})
    return history


def _format_currency(amount):
    sign = "+" if amount >= 0 else "-"
    return f"{sign}P{abs(amount):,.2f}"


def _get_expected_stock_status(stock, min_level):
    if stock == 0:
        return "CRITICAL"
    if stock < min_level * 0.5:
        return "CRITICAL"
    if stock < min_level:
        return "LOW"
    return "OK"


def _assistant_focus(message):
    lowered = message.lower()
    if "restock" in lowered or "stock" in lowered or "inventory" in lowered:
        return "inventory planning"
    if "budget" in lowered or "savings" in lowered:
        return "budget control"
    if "expense" in lowered or "cash flow" in lowered or "balance" in lowered:
        return "cash flow review"
    if "sales" in lowered or "income" in lowered:
        return "sales momentum"
    return "business planning"


def _describe_transaction_output(name, amount, data):
    return (
        f'HTTP 201 Created | "{name}" ({_format_currency(amount)}) saved successfully | '
        f"status={data.get('status', 'unknown')} | returned_id={data.get('id', 'N/A')} | "
        f"{data.get('message', 'No message returned')}"
    )


def _describe_balance_output(balance):
    return f"HTTP 200 OK | running_balance={_format_currency(balance)}"


def _describe_restock_output(item_name, stock, min_level, data):
    return (
        f"HTTP 200 OK | {item_name} updated to {stock}/{min_level} pcs | "
        f"status={data.get('status', 'unknown')}"
    )


def _describe_chat_output(message, data):
    return (
        f'HTTP 200 OK | prompt="{message}" | '
        f'reply="{data.get("reply", "No reply returned")}"'
    )


def _describe_validation_output(data, status_code):
    if status_code == 400:
        return (
            f"HTTP 400 Bad Request | field={data.get('field', 'N/A')} | "
            f"error={data.get('error', 'No error returned')}"
        )

    return (
        f"HTTP 201 Created | status={data.get('status', 'unknown')} | "
        f"returned_id={data.get('id', 'N/A')} | {data.get('message', 'No message returned')}"
    )


def _create_transaction(client, name, amount):
    return client.post("/api/transactions", json=_build_transaction_payload(name, amount))


def _get_latest_transaction():
    conn = db_module.get_db()
    cursor = conn.cursor()
    execute(
        cursor,
        """
        SELECT id, to_name, category, amount, type, date, note
        FROM transactions
        ORDER BY id DESC
        LIMIT 1
        """,
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def _get_transaction_count():
    conn = db_module.get_db()
    cursor = conn.cursor()
    execute(cursor, "SELECT COUNT(*) AS count FROM transactions")
    count = cursor.fetchone()["count"]
    conn.close()
    return count


def _get_storage_item(item_id):
    conn = db_module.get_db()
    cursor = conn.cursor()
    execute(cursor, "SELECT * FROM storage WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


@pytest.fixture
def client(tmp_path):
    app.config["TESTING"] = True
    original_db_path = db_module.DB_PATH
    original_database_url = os.environ.get("DATABASE_URL")
    test_db_path = tmp_path / "financial_tracker_test.db"

    os.environ.pop("DATABASE_URL", None)
    db_module.DB_PATH = str(test_db_path)

    try:
        init_db()
        with app.test_client() as test_client:
            yield test_client
    finally:
        db_module.DB_PATH = original_db_path
        if original_database_url is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = original_database_url


def test_get_wallet_balance_api(client):
    print("\n===== TEST CASE 1: GET WALLET BALANCE API (20 TRIALS) =====")
    running_balance = 0.0

    for trial_no, (name, amount) in enumerate(TRANSACTION_CASES, start=1):
        create_response = _create_transaction(client, name, amount)
        assert create_response.status_code == 201

        running_balance = round(running_balance + amount, 2)
        balance_response = client.get("/api/transactions/balance")
        balance_data = balance_response.get_json()

        print(f"\n--- Trial {trial_no:02d} ---")
        print(f"Input: {name} / {_format_currency(amount)}")
        print(f"Expected: HTTP 200 OK | running_balance={_format_currency(running_balance)}")
        print("Actual Status Code:", balance_response.status_code)
        print("Actual Output:", _describe_balance_output(balance_data.get("balance", 0)))

        assert balance_response.status_code == 200
        assert balance_data["balance"] == pytest.approx(running_balance, abs=0.001)

        print(f"Result: PASSED (Balance after trial {trial_no:02d})")


def test_add_transaction_api(client):
    print("\n===== TEST CASE 2: ADD TRANSACTION API (20 TRIALS) =====")
    previous_id = 0

    for trial_no, (name, amount) in enumerate(TRANSACTION_CASES, start=1):
        response = _create_transaction(client, name, amount)
        data = response.get_json()
        stored = _get_latest_transaction()

        print(f"\n--- Trial {trial_no:02d} ---")
        print(f"Input: {name} / {_format_currency(amount)}")
        print("Expected: HTTP 201 Created | transaction saved with generated ID")
        print("Actual Status Code:", response.status_code)
        print("Actual Output:", _describe_transaction_output(name, amount, data))

        assert response.status_code == 201
        assert data.get("status") == "success"
        assert data.get("message") == "Transaction saved successfully."
        assert isinstance(data.get("id"), int)
        assert data["id"] > previous_id
        assert stored["to_name"] == name
        assert stored["category"] == name
        assert stored["amount"] == pytest.approx(float(amount), abs=0.001)
        previous_id = data["id"]

        print(f"Result: PASSED (Generated ID: {data['id']})")


def test_inventory_restock_api(client):
    print("\n===== TEST CASE 3: INVENTORY RESTOCK API (20 TRIALS) =====")
    min_level = 30
    create_response = client.post(
        "/api/storage",
        json={
            "item_name": "Cooking Oil",
            "emoji": "??",
            "current_stock": 50,
            "unit": "pcs",
            "min_level": min_level,
        },
    )
    create_data = create_response.get_json()
    item_id = create_data["id"]

    assert create_response.status_code == 201

    for trial_no, stock in enumerate(RESTOCK_STOCK_LEVELS, start=1):
        expected_status = _get_expected_stock_status(stock, min_level)
        update_response = client.put(
            f"/api/storage/{item_id}",
            json={"current_stock": stock},
        )
        update_data = update_response.get_json()
        stored_item = _get_storage_item(item_id)

        print(f"\n--- Trial {trial_no:02d} ---")
        print(f"Input: Set Cooking Oil stock to {stock} pcs (min: {min_level})")
        print(f"Expected: HTTP 200 OK | status={expected_status}")
        print("Actual Status Code:", update_response.status_code)
        print("Actual Output:", _describe_restock_output("Cooking Oil", stock, min_level, update_data))

        assert update_response.status_code == 200
        assert update_data["status"] == expected_status
        assert stored_item["current_stock"] == stock
        assert stored_item["status"] == expected_status

        print(f"Result: PASSED (Status {expected_status} confirmed)")


def test_ai_assistant_chat_api(client, monkeypatch):
    print("\n===== TEST CASE 4: AI ASSISTANT CHAT API (20 TRIALS) =====")

    def fake_ask_gemini(message, history=None):
        prior_turns = len(history or [])
        focus = _assistant_focus(message)
        return (
            f"AI guidance on {focus}: I reviewed your request and "
            f"used {prior_turns} prior messages for context."
        )

    monkeypatch.setattr(assistant_module, "ask_gemini", fake_ask_gemini)

    for trial_no, message in enumerate(CHAT_MESSAGES, start=1):
        history = _build_chat_history(trial_no)
        expected_focus = _assistant_focus(message)
        response = client.post(
            "/api/assistant/chat",
            json={"message": message, "history": history},
        )
        data = response.get_json()

        print(f"\n--- Trial {trial_no:02d} ---")
        print(f"Input: {message}")
        print(
            "Expected:",
            f"HTTP 200 OK | natural AI reply about {expected_focus} with {len(history)} prior messages",
        )
        print("Actual Status Code:", response.status_code)
        print("Actual Output:", _describe_chat_output(message, data))

        assert response.status_code == 200
        assert "reply" in data
        assert expected_focus in data["reply"]
        assert str(len(history)) in data["reply"]

        print(f"Result: PASSED (Reply matched {expected_focus})")


def test_transaction_validation_missing_fields(client):
    print("\n===== TEST CASE 5: TRANSACTION VALIDATION - MISSING FIELDS (20 TRIALS) =====")

    for case in VALIDATION_CASES:
        before_count = _get_transaction_count()
        response = client.post("/api/transactions", **case["request"])
        data = response.get_json()

        print(f"\n--- Trial {case['trial']:02d} ---")
        print(f"Scenario: {case['label']}")
        print(f"Expected: HTTP {case['expected_status']}")
        print("Actual Status Code:", response.status_code)
        print("Actual Output:", _describe_validation_output(data, response.status_code))

        assert response.status_code == case["expected_status"]

        if case["expected_status"] == 400:
            assert _get_transaction_count() == before_count
            assert data["status"] == "error"
            assert data["title"] == "Unable to save transaction"
            assert data["field"] == case["expected_field"]
            assert data["error"] == case["expected_error"]
            assert "details" in data
            print("Result: PASSED (Invalid request blocked)")
            continue

        latest = _get_latest_transaction()
        assert _get_transaction_count() == before_count + 1
        assert data["status"] == "success"
        assert data["message"] == "Transaction saved successfully."
        assert isinstance(data["id"], int)

        for key, expected_value in case["expected_row"].items():
            assert latest[key] == expected_value

        print(f"Result: PASSED (Valid request stored with ID {data['id']})")
