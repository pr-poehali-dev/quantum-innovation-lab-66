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
        CREATE TABLE IF NOT EXISTS journal_events (
            id SERIAL PRIMARY KEY,
            event_type VARCHAR(50) NOT NULL,
            employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
            key_number VARCHAR(100),
            zone VARCHAR(255),
            result VARCHAR(20) DEFAULT 'allowed',
            note TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

def handler(event: dict, context) -> dict:
    """Журнал событий СКУД: проходы, отказы, тревоги"""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod')
    conn = get_conn()

    try:
        ensure_table(conn)

        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            limit = int(params.get('limit', 50))
            filter_type = params.get('type', '')
            filter_result = params.get('result', '')

            where_parts = []
            if filter_type:
                where_parts.append(f"j.event_type = '{esc(filter_type)}'")
            if filter_result:
                where_parts.append(f"j.result = '{esc(filter_result)}'")
            where = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

            rows = conn.run(f"""
                SELECT j.id, j.event_type, j.employee_id, e.full_name,
                       j.key_number, j.zone, j.result, j.note, j.created_at
                FROM journal_events j
                LEFT JOIN employees e ON j.employee_id = e.id
                {where}
                ORDER BY j.created_at DESC
                LIMIT {limit}
            """)
            data = [
                {
                    'id': r[0],
                    'event_type': r[1],
                    'employee_id': r[2],
                    'employee_name': r[3] or '—',
                    'key_number': r[4] or '',
                    'zone': r[5] or '',
                    'result': r[6],
                    'note': r[7] or '',
                    'created_at': str(r[8]),
                }
                for r in rows
            ]
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'events': data}, ensure_ascii=False)}

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')
            event_type = body.get('event_type', 'entry').strip()
            employee_id = body.get('employee_id') or None
            key_number = body.get('key_number', '').strip() or None
            zone = body.get('zone', '').strip()
            result = body.get('result', 'allowed')
            note = body.get('note', '').strip()

            emp_part = f"{int(employee_id)}" if employee_id else "NULL"
            key_part = f"'{esc(key_number)}'" if key_number else "NULL"

            rows = conn.run(
                f"INSERT INTO journal_events (event_type, employee_id, key_number, zone, result, note) "
                f"VALUES ('{esc(event_type)}', {emp_part}, {key_part}, '{esc(zone)}', '{esc(result)}', '{esc(note)}') "
                f"RETURNING id, event_type, employee_id, key_number, zone, result, note, created_at"
            )
            r = rows[0]
            ev = {
                'id': r[0], 'event_type': r[1], 'employee_id': r[2],
                'key_number': r[3] or '', 'zone': r[4], 'result': r[5],
                'note': r[6] or '', 'created_at': str(r[7]),
            }
            return {'statusCode': 201, 'headers': cors, 'body': json.dumps({'event': ev}, ensure_ascii=False)}

        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}
    finally:
        conn.close()
