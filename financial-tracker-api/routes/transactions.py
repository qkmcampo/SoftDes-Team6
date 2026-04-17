from flask import Blueprint, request, jsonify
from database.db import execute, get_db, get_table_columns, insert_and_get_id

transactions_bp = Blueprint('transactions', __name__)


def _transaction_error(message, *, field=None, details=None, status_code=400, code='TRANSACTION_VALIDATION_ERROR'):
    payload = {
        'status': 'error',
        'title': 'Unable to save transaction',
        'code': code,
        'error': message,
    }
    if field:
        payload['field'] = field
    if details:
        payload['details'] = details
    return jsonify(payload), status_code


def _get_transaction_label(data):
    if 'to_name' in data:
        return data.get('to_name'), 'to_name'

    if 'name' in data:
        return data.get('name'), 'name'

    return '', 'to_name'


# ── Helper: get actual column names ──
def _get_columns():
    conn = get_db()
    cursor = conn.cursor()
    cols = get_table_columns(cursor, "transactions")
    conn.close()
    return cols


# ── GET all transactions ───────────────────────────────────────────────
@transactions_bp.route('/transactions', methods=['GET'])
def get_transactions():
    conn = get_db()
    cursor = conn.cursor()
    execute(cursor, 'SELECT * FROM transactions ORDER BY date DESC, id DESC')
    rows = cursor.fetchall()
    conn.close()

    transactions = [dict(row) for row in rows]
    return jsonify(transactions), 200


# ── GET total balance ──────────────────────────────────────────────────
@transactions_bp.route('/transactions/balance', methods=['GET'])
def get_balance():
    conn = get_db()
    cursor = conn.cursor()
    execute(cursor, 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions')
    result = cursor.fetchone()
    conn.close()

    total = result['total'] or 0
    return jsonify({'balance': round(total, 2)}), 200


# ── POST add a new transaction ─────────────────────────────────────────
@transactions_bp.route('/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json(silent=True)

    # ── TC6: Validate required fields ─────────────────────
    # Sending only {'amount': -500.00} without to_name
    # must return 400 with an 'error' field.
    # to_name is checked first and explicitly so the test
    # assertion assert 'error' in data always passes.
    if not isinstance(data, dict) or not data:
        return _transaction_error(
            'No transaction details were received.',
            field='request',
            details='Please complete the required fields and submit the transaction again.',
        )

    to_name, name_field = _get_transaction_label(data)

    if not to_name or not str(to_name).strip():
        return _transaction_error(
            'Please enter a transaction name or description.',
            field=name_field,
            details='Add a supplier name, income source, or short description so the entry is easy to identify.',
        )

    amount = data.get('amount')
    if amount is None:
        return _transaction_error(
            'Please enter an amount before saving this transaction.',
            field='amount',
            details='The amount field is required for both income and expense entries.',
        )

    try:
        amount_value = float(amount)
    except (TypeError, ValueError):
        return _transaction_error(
            'Please enter a valid numeric amount.',
            field='amount',
            details='Use numbers only, for example 500 or 1250.75.',
        )

    # Detect which columns the table actually has
    columns = _get_columns()

    conn = get_db()
    cursor = conn.cursor()

    clean_to_name = str(to_name).strip()
    clean_category = str(data.get('category', '')).strip() or None
    transaction_type = data.get('type', 'expense')
    transaction_date = data.get('date', '')
    transaction_note = data.get('note', '')

    if 'to_name' in columns and 'category' in columns:
        new_id = insert_and_get_id(
            cursor,
            '''INSERT INTO transactions (to_name, category, amount, type, date, note)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (
                clean_to_name,
                clean_category,
                amount_value,
                transaction_type,
                transaction_date,
                transaction_note,
            )
        )
    elif 'to_name' in columns:
        new_id = insert_and_get_id(
            cursor,
            '''INSERT INTO transactions (to_name, amount, type, date, note)
               VALUES (?, ?, ?, ?, ?)''',
            (
                clean_to_name,
                amount_value,
                transaction_type,
                transaction_date,
                transaction_note,
            )
        )
    elif 'category' in columns:
        new_id = insert_and_get_id(
            cursor,
            '''INSERT INTO transactions (type, category, amount, date, note)
               VALUES (?, ?, ?, ?, ?)''',
            (
                transaction_type,
                clean_category or clean_to_name,
                amount_value,
                transaction_date,
                transaction_note,
            )
        )
    else:
        conn.close()
        return _transaction_error(
            'The transaction could not be saved because the database schema is not supported.',
            details='Please contact the development team or refresh the transaction database setup.',
            status_code=500,
            code='TRANSACTION_SCHEMA_ERROR',
        )

    conn.commit()
    conn.close()

    return jsonify({
        'status': 'success',
        'message': 'Transaction saved successfully.',
        'id': new_id
    }), 201


# ── DELETE a transaction ───────────────────────────────────────────────
@transactions_bp.route('/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    conn = get_db()
    cursor = conn.cursor()
    execute(cursor, 'DELETE FROM transactions WHERE id = ?', (id,))
    conn.commit()
    conn.close()

    return jsonify({
        'status': 'success',
        'message': 'Transaction deleted successfully.'
    }), 200
