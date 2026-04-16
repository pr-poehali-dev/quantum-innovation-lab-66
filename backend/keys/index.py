import json
import os
import pg8000.native
from urllib.parse import urlparse

def get_conn():
    url = urlparse(os.environ['DATABASE_URL'])
    return pg8000.native.Connection(
        user=url.username,
        password=url.password,
        host=url.hostname,
        port=url.port or 5432,
        database=url.path.lstrip('/'),
        ssl_context=False,
    )

def ensure_table(conn):
    conn.run("""
        CREATE TABLE IF NOT EXISTS access_keys (
            id SERIAL PRIMARY KEY,
            key_number VARCHAR(100) NOT NULL UNIQUE,
            key_type VARCHAR(50) DEFAULT 'card',
            status VARCHAR(50) DEFAULT 'active',
            employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
            issued_at TIMESTAMP DEFAULT NOW(),
            note TEXT
        )
    """)

def handler(event: dict, context) -> dict:
    """Управление ключами и картами доступа СКУД"""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod')
    conn = get_conn()

    try:
        ensure_table(conn)

        if method == 'GET':
            rows = conn.run("""
                SELECT k.id, k.key_number, k.key_type, k.status,
                       k.employee_id, e.full_name as employee_name,
                       k.issued_at, k.note
                FROM access_keys k
                LEFT JOIN employees e ON k.employee_id = e.id
                ORDER BY k.id
            """)
            data = [
                {
                    'id': r[0],
                    'key_number': r[1],
                    'key_type': r[2],
                    'status': r[3],
                    'employee_id': r[4],
                    'employee_name': r[5] or '—',
                    'issued_at': str(r[6]),
                    'note': r[7] or '',
                }
                for r in rows
            ]
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'keys': data}, ensure_ascii=False)}

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')
            key_number = body.get('key_number', '').strip()
            key_type = body.get('key_type', 'card')
            status = body.get('status', 'active')
            employee_id = body.get('employee_id') or None
            note = body.get('note', '').strip() or None

            if not key_number:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Номер ключа обязателен'})}

            if employee_id:
                rows = conn.run(
                    "INSERT INTO access_keys (key_number, key_type, status, employee_id, note) VALUES (:kn, :kt, :st, :eid, :nt) RETURNING id, key_number, key_type, status, employee_id, issued_at, note",
                    kn=key_number, kt=key_type, st=status, eid=int(employee_id), nt=note
                )
            else:
                rows = conn.run(
                    "INSERT INTO access_keys (key_number, key_type, status, note) VALUES (:kn, :kt, :st, :nt) RETURNING id, key_number, key_type, status, employee_id, issued_at, note",
                    kn=key_number, kt=key_type, st=status, nt=note
                )

            r = rows[0]
            key = {'id': r[0], 'key_number': r[1], 'key_type': r[2], 'status': r[3], 'employee_id': r[4], 'issued_at': str(r[5]), 'note': r[6] or ''}
            return {'statusCode': 201, 'headers': cors, 'body': json.dumps({'key': key}, ensure_ascii=False)}

        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            key_id = params.get('id')
            if not key_id:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'ID обязателен'})}
            conn.run("DELETE FROM access_keys WHERE id = :id", id=int(key_id))
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}
    finally:
        conn.close()
