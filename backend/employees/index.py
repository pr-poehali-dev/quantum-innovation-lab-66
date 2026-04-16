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
        CREATE TABLE IF NOT EXISTS employees (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
            key_number VARCHAR(100),
            access_level VARCHAR(50) DEFAULT 'low',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

def handler(event: dict, context) -> dict:
    """Управление сотрудниками СКУД: список, добавление, удаление"""
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
                SELECT e.id, e.full_name, e.department_id, d.name as department_name,
                       e.key_number, e.access_level, e.created_at
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.id
                ORDER BY e.id
            """)
            data = [
                {
                    'id': r[0],
                    'full_name': r[1],
                    'department_id': r[2],
                    'department_name': r[3] or '—',
                    'key_number': r[4] or '',
                    'access_level': r[5],
                    'created_at': str(r[6]),
                }
                for r in rows
            ]
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'employees': data}, ensure_ascii=False)}

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')
            full_name = body.get('full_name', '').strip()
            department_id = body.get('department_id') or None
            key_number = body.get('key_number', '').strip() or None
            access_level = body.get('access_level', 'low')

            if not full_name:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'ФИО обязательно'})}

            if department_id:
                rows = conn.run(
                    "INSERT INTO employees (full_name, department_id, key_number, access_level) VALUES (:fn, :did, :kn, :al) RETURNING id, full_name, department_id, key_number, access_level, created_at",
                    fn=full_name, did=int(department_id), kn=key_number, al=access_level
                )
            else:
                rows = conn.run(
                    "INSERT INTO employees (full_name, key_number, access_level) VALUES (:fn, :kn, :al) RETURNING id, full_name, department_id, key_number, access_level, created_at",
                    fn=full_name, kn=key_number, al=access_level
                )

            r = rows[0]
            emp = {'id': r[0], 'full_name': r[1], 'department_id': r[2], 'key_number': r[3], 'access_level': r[4], 'created_at': str(r[5])}
            return {'statusCode': 201, 'headers': cors, 'body': json.dumps({'employee': emp}, ensure_ascii=False)}

        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            emp_id = params.get('id')
            if not emp_id:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'ID обязателен'})}
            conn.run("DELETE FROM employees WHERE id = :id", id=int(emp_id))
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}
    finally:
        conn.close()
