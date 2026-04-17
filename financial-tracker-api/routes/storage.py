from flask import Blueprint, request, jsonify
from database.db import execute, get_db, insert_and_get_id

storage_bp = Blueprint('storage', __name__)


@storage_bp.route('/storage', methods=['GET'])
def get_storage():
    conn = get_db()
    cursor = conn.cursor()
    execute(cursor, 'SELECT * FROM storage ORDER BY status DESC, item_name ASC')
    rows = cursor.fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows]), 200


@storage_bp.route('/storage', methods=['POST'])
def add_item():
    data = request.get_json()

    if not data.get('item_name'):
        return jsonify({'error': 'item_name is required'}), 400

    conn = get_db()
    cursor = conn.cursor()
    new_id = insert_and_get_id(
        cursor,
        '''INSERT INTO storage
        (item_name, emoji, current_stock, unit, min_level, status)
        VALUES (?, ?, ?, ?, ?, ?)''',
        (
            data['item_name'],
            data.get('emoji', '??'),
            int(data.get('current_stock', 0)),
            data.get('unit', 'pcs'),
            int(data.get('min_level', 10)),
            data.get('status', 'OK'),
        ),
    )
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Item added',
        'id': new_id
    }), 201


@storage_bp.route('/storage/<int:id>', methods=['PUT'])
def update_stock(id):
    data = request.get_json()
    new_stock = int(data.get('current_stock', 0))

    conn = get_db()
    cursor = conn.cursor()

    execute(cursor, 'SELECT min_level FROM storage WHERE id = ?', (id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({'error': 'Item not found'}), 404

    min_level = row['min_level']

    if new_stock == 0:
        status = 'CRITICAL'
    elif new_stock < min_level * 0.5:
        status = 'CRITICAL'
    elif new_stock < min_level:
        status = 'LOW'
    else:
        status = 'OK'

    execute(
        cursor,
        '''UPDATE storage
        SET current_stock = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?''',
        (new_stock, status, id),
    )
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Stock updated',
        'status': status
    }), 200
