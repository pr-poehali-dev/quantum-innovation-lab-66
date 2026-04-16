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

def handler(event: dict, context) -> dict:
    """Управление отделами СКУД: получение, создание, удаление"""
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
        if method == 'GET':
            rows = conn.run("SELECT id, name, description, created_at FROM departments ORDER BY id")
            data = [
                {'id': r[0], 'name': r[1], 'description': r[2], 'created_at': str(r[3])}
                for r in rows
            ]
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'departments': data}, ensure_ascii=False)}

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')
            name = body.get('name', '').strip()
            description = body.get('description', '').strip()
            if not name:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Название обязательно'})}
            rows = conn.run(
                "INSERT INTO departments (name, description) VALUES (:name, :desc) RETURNING id, name, description, created_at",
                name=name, desc=description
            )
            r = rows[0]
            dept = {'id': r[0], 'name': r[1], 'description': r[2], 'created_at': str(r[3])}
            return {'statusCode': 201, 'headers': cors, 'body': json.dumps({'department': dept}, ensure_ascii=False)}

        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            dept_id = params.get('id')
            if not dept_id:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'ID обязателен'})}
            conn.run("DELETE FROM departments WHERE id = :id", id=int(dept_id))
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}
    finally:
        conn.close()