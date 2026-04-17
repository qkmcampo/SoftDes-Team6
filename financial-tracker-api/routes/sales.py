from collections import OrderedDict
from datetime import datetime

from flask import Blueprint, request, jsonify

from database.db import execute, get_db, insert_and_get_id

sales_bp = Blueprint('sales', __name__)


@sales_bp.route('/sales', methods=['GET'])
def get_sales():
    try:
        conn = get_db()
        cursor = conn.cursor()
        execute(cursor, 'SELECT * FROM sales ORDER BY date DESC, id DESC')
        rows = cursor.fetchall()
        conn.close()

        return jsonify([dict(row) for row in rows]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sales_bp.route('/sales/summary', methods=['GET'])
def get_sales_summary():
    try:
        conn = get_db()
        cursor = conn.cursor()
        execute(cursor, 'SELECT date, total FROM sales ORDER BY date ASC, id ASC')
        rows = cursor.fetchall()
        conn.close()

        grouped = OrderedDict()
        for row in rows:
            row_data = dict(row)
            raw_date = str(row_data.get('date') or '').strip()
            month = raw_date[:7] if len(raw_date) >= 7 else 'Unknown'
            bucket = grouped.setdefault(month, {'month': month, 'total_sales': 0.0, 'transaction_count': 0})
            bucket['total_sales'] = round(bucket['total_sales'] + float(row_data.get('total') or 0), 2)
            bucket['transaction_count'] += 1

        return jsonify(list(grouped.values())), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@sales_bp.route('/sales', methods=['POST'])
def add_sale():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    item_name = data.get('item_name')
    quantity = data.get('quantity')
    price = data.get('price')

    if not all([item_name, quantity, price]):
        return jsonify({'error': 'item_name, quantity, and price are required'}), 400

    try:
        qty_int = int(quantity)
        price_float = float(price)
        total = round(qty_int * price_float, 2)

        sale_date = data.get('date')
        if not sale_date:
            sale_date = datetime.now().strftime('%Y-%m-%d')

        conn = get_db()
        cursor = conn.cursor()
        new_id = insert_and_get_id(
            cursor,
            '''INSERT INTO sales (item_name, quantity, price, total, date)
               VALUES (?, ?, ?, ?, ?)''',
            (item_name, qty_int, price_float, total, sale_date),
        )
        conn.commit()
        conn.close()

        return jsonify({
            'message': 'Sale recorded successfully',
            'id': new_id,
            'total': total,
            'date': sale_date
        }), 201

    except ValueError:
        return jsonify({'error': 'Quantity must be an integer and price a number'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
