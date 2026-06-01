import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p29757712_construction_project")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Content-Type": "application/json",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    """Авторизация: login, logout, me"""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    # POST ?action=login
    if method == "POST" and action == "login":
        body = json.loads(event.get("body") or "{}")
        phone = (body.get("phone") or "").strip()
        password = body.get("password") or ""

        if not phone or not password:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Введите телефон и пароль"}),
            }

        pw_hash = hash_password(password)

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, role FROM {SCHEMA}.users WHERE phone = %s AND password_hash = %s",
            (phone, pw_hash),
        )
        row = cur.fetchone()

        if not row:
            cur.close()
            conn.close()
            return {
                "statusCode": 401,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Неверный телефон или пароль"}),
            }

        user_id, name, role = row
        token = secrets.token_hex(32)

        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (token, user_id) VALUES (%s, %s)",
            (token, user_id),
        )
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "token": token,
                "user": {"id": user_id, "name": name, "role": role, "phone": phone},
            }),
        }

    # GET ?action=me
    if method == "GET" and action == "me":
        headers = event.get("headers") or {}
        token = headers.get("X-Auth-Token") or headers.get("x-auth-token")

        if not token:
            return {
                "statusCode": 401,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Не авторизован"}),
            }

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""
            SELECT u.id, u.name, u.role, u.phone
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()
            """,
            (token,),
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return {
                "statusCode": 401,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Сессия истекла"}),
            }

        user_id, name, role, phone = row
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"user": {"id": user_id, "name": name, "role": role, "phone": phone}}),
        }

    # POST ?action=logout
    if method == "POST" and action == "logout":
        headers = event.get("headers") or {}
        token = headers.get("X-Auth-Token") or headers.get("x-auth-token")
        if token:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = %s", (token,))
            conn.commit()
            cur.close()
            conn.close()

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True}),
        }

    return {
        "statusCode": 400,
        "headers": CORS_HEADERS,
        "body": json.dumps({"error": "Укажите action: login, me или logout"}),
    }