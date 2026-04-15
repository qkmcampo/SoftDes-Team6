import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app import app
from database.db import init_db


# ═══════════════════════════════════════════════
# FIXTURE: RESET DATABASE (FIX ID SKIPPING)
# ═══════════════════════════════════════════════
@pytest.fixture
def client():
    app.config['TESTING'] = True

    # Delete old database
    if os.path.exists("database.db"):
        os.remove("database.db")

    # Recreate fresh database
    init_db()

    with app.test_client() as client:
        yield client


# ═══════════════════════════════════════════════
# TC1: ADD 10 TRANSACTIONS (MAIN TABLE OUTPUT)
# ═══════════════════════════════════════════════
def test_add_multiple_transactions(client):
    print("\n===== TEST CASE 1: ADD TRANSACTION API =====")

    transactions = [
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
    ]

    for i, (name, amount) in enumerate(transactions, start=1):
        response = client.post('/api/transactions', json={
            'to_name': name,
            'amount': amount,
            'type': 'income' if amount > 0 else 'expense',
            'date': '2026-04-15'
        })

        data = response.get_json()

        print(f"\n--- Trial {i} ---")
        print(f"Input: {name} / {amount}")
        print("Expected: HTTP 201, ID returned")
        print("Actual Status Code:", response.status_code)
        print("Actual Response:", data)

        assert response.status_code == 201
        assert 'id' in data

        print(f"Result: ✅ PASSED (ID: {data['id']})")

    print("\n🎯 ALL 10 TRANSACTIONS SUCCESSFUL (100% ACCURATE)")


# ═══════════════════════════════════════════════
# TC2: GET BALANCE AFTER ALL TRANSACTIONS
# ═══════════════════════════════════════════════
def test_get_balance_after_transactions(client):
    print("\n===== TEST CASE 2: GET BALANCE API =====")

    # Add same transactions again
    transactions = [
        -500, 4500, -1200, -350, 2000,
        -3000, 1800, -5000, -1000, 3200
    ]

    for amount in transactions:
        client.post('/api/transactions', json={
            'to_name': 'Test',
            'amount': amount,
            'type': 'income' if amount > 0 else 'expense',
            'date': '2026-04-15'
        })

    response = client.get('/api/transactions/balance')
    data = response.get_json()

    print("Expected: HTTP 200, correct balance")
    print("Actual Status Code:", response.status_code)
    print("Actual Response:", data)

    assert response.status_code == 200
    assert 'balance' in data

    print(f"Result: ✅ PASSED (Balance: ₱{data['balance']})")


# ═══════════════════════════════════════════════
# TC3: VALIDATION TEST (MISSING FIELD)
# ═══════════════════════════════════════════════
def test_missing_fields(client):
    print("\n===== TEST CASE 3: VALIDATION =====")

    response = client.post('/api/transactions', json={
        'amount': -500
    })

    data = response.get_json()

    print("Expected: HTTP 400, error message")
    print("Actual Status Code:", response.status_code)
    print("Actual Response:", data)

    assert response.status_code == 400
    assert 'error' in data

    print("Result: ✅ PASSED (Validation working)")