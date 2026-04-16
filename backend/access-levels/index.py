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

def esc(val):
    return str(val).replace("'", "''")

def ensure_table(conn):
    conn.run("""
        CREATE TABLE IF NOT EXISTS access_levels (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(50) NOT NULL UNIQUE,
            color VARCHAR(20) DEFAULT '#6366f1',
            zones TEXT DEFAULT '',
            description TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    conn.run("""
        INSERT INTO access_levels (name, code, color, zones, description)
        SELECT * FROM (VALUES
            ('Базовый', 'low', '#059669', 'Вход, Столовая, Парковка', 'Стандартный доступ для всех сотрудников'),
            ('Средний', 'medium', '#d97706', 'Офисы, Конференц-залы, Склад', 'Расширенный доступ для менеджеров'),
            ('Высокий', 'high', '#7c3aed', 'Серверная, Архив, Руководство', 'Полный доступ для ключевого персонала')
        ) AS v(name, code, color, zones, description)
        WHERE NOT EXISTS (SELECT 1 FROM access_levels LIMIT 1)
    """)

def handler(event: dict, context) -> dict:
    """Управление уровнями допуска СКУД: зоны, права, количество сотрудников"""
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
                SELECT al.id, al.name, al.code, al.color, al.zones, al.description, al.created_at,
                       COUNT(e.id) as employee_count
                FROM access_levels al
                LEFT JOIN employees e ON e.access_level = al.code
                GROUP BY al.id, al.name, al.code, al.color, al.zones, al.description, al.created_at
                ORDER BY al.id
            """)
            data = [
                {
                    'id': r[0], 'name': r[1], 'code': r[2],
                    'color': r[3], 'zones': r[4], 'description': r[5],
                    'created_at': str(r[6]), 'employee_count': r[7],
                }
                for r in rows
            ]
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'levels': data}, ensure_ascii=False)}

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')
            name = body.get('name', '').strip()
            code = body.get('code', '').strip().lower().replace(' ', '_')
            color = body.get('color', '#6366f1')
            zones = body.get('zones', '').strip()
            description = body.get('description', '').strip()

            if not name or not code:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Название и код обязательны'})}

            rows = conn.run(
                f"INSERT INTO access_levels (name, code, color, zones, description) VALUES ('{esc(name)}', '{esc(code)}', '{esc(color)}', '{esc(zones)}', '{esc(description)}') RETURNING id, name, code, color, zones, description, created_at"
            )
            r = rows[0]
            level = {'id': r[0], 'name': r[1], 'code': r[2], 'color': r[3], 'zones': r[4], 'description': r[5], 'created_at': str(r[6]), 'employee_count': 0}
            return {'statusCode': 201, 'headers': cors, 'body': json.dumps({'level': level}, ensure_ascii=False)}

        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            level_id = params.get('id')
            if not level_id:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'ID обязателен'})}
            conn.run(f"DELETE FROM access_levels WHERE id = {int(level_id)}")
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}
    finally:
        conn.close()
