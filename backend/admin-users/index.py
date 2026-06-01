import json
import os
import hashlib
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p29757712_construction_project")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Content-Type": "application/json",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def get_admin(conn, token: str):
    """Проверяет токен и возвращает пользователя с ролью admin, иначе None"""
    cur = conn.cursor()
    cur.execute(
        f"""SELECT u.id, u.role FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,),
    )
    row = cur.fetchone()
    cur.close()
    if not row or row[1] != "admin":
        return None
    return {"id": row[0], "role": row[1]}


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}


def handler(event: dict, context) -> dict:
    """Управление пользователями (только для администратора): list, create, update, delete"""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token") or ""
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    conn = get_conn()
    admin = get_admin(conn, token)

    if not admin:
        conn.close()
        return resp(403, {"error": "Доступ запрещён — требуется роль администратора"})

    # GET ?action=list — список всех пользователей
    if method == "GET" and action == "list":
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, phone, role, created_at FROM {SCHEMA}.users ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        users = [
            {"id": r[0], "name": r[1], "phone": r[2], "role": r[3], "created_at": r[4]}
            for r in rows
        ]
        return resp(200, {"users": users})

    # POST ?action=create — создать пользователя
    if method == "POST" and action == "create":
        body = json.loads(event.get("body") or "{}")
        name = (body.get("name") or "").strip()
        phone = (body.get("phone") or "").strip()
        password = (body.get("password") or "").strip()
        role = (body.get("role") or "foreman").strip()

        if not name or not phone or not password:
            conn.close()
            return resp(400, {"error": "Заполните имя, телефон и пароль"})

        if role not in ("foreman", "engineer", "admin"):
            conn.close()
            return resp(400, {"error": "Недопустимая роль"})

        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone = %s", (phone,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return resp(409, {"error": "Пользователь с таким телефоном уже существует"})

        pw_hash = hash_password(password)
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (name, phone, password_hash, role) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
            (name, phone, pw_hash, role),
        )
        new_id, created_at = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return resp(201, {"user": {"id": new_id, "name": name, "phone": phone, "role": role, "created_at": created_at}})

    # PUT ?action=update — изменить пользователя
    if method == "PUT" and action == "update":
        body = json.loads(event.get("body") or "{}")
        user_id = body.get("id")
        name = (body.get("name") or "").strip()
        phone = (body.get("phone") or "").strip()
        role = (body.get("role") or "").strip()
        new_password = (body.get("password") or "").strip()

        if not user_id or not name or not phone or not role:
            conn.close()
            return resp(400, {"error": "Заполните все поля"})

        if role not in ("foreman", "engineer", "admin"):
            conn.close()
            return resp(400, {"error": "Недопустимая роль"})

        cur = conn.cursor()
        if new_password:
            pw_hash = hash_password(new_password)
            cur.execute(
                f"UPDATE {SCHEMA}.users SET name=%s, phone=%s, role=%s, password_hash=%s WHERE id=%s",
                (name, phone, role, pw_hash, user_id),
            )
        else:
            cur.execute(
                f"UPDATE {SCHEMA}.users SET name=%s, phone=%s, role=%s WHERE id=%s",
                (name, phone, role, user_id),
            )
        conn.commit()
        cur.close()
        conn.close()
        return resp(200, {"ok": True})

    # DELETE ?action=delete&id=X — удалить пользователя
    if method == "DELETE" and action == "delete":
        user_id = params.get("id")
        if not user_id:
            conn.close()
            return resp(400, {"error": "Укажите id пользователя"})

        if int(user_id) == admin["id"]:
            conn.close()
            return resp(400, {"error": "Нельзя удалить самого себя"})

        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE user_id = %s", (user_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()
        return resp(200, {"ok": True})

    conn.close()
    return resp(400, {"error": "Неизвестный action"})
