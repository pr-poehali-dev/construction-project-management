import json
import os
import hashlib
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p29757712_construction_project")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

DEMO_USERS = [
    {"name": "Смирнов В.А.", "phone": "+79001112233", "password": "1234", "role": "foreman"},
    {"name": "Коваль И.Р.", "phone": "+79002223344", "password": "1234", "role": "foreman"},
    {"name": "Ковалёв Д.С.", "phone": "+79003334455", "password": "1234", "role": "engineer"},
    {"name": "Администратор", "phone": "+79000000000", "password": "admin1234", "role": "admin"},
]


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    """Создаёт демо-пользователей в БД (вызывается один раз)"""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    created = []
    skipped = []

    for u in DEMO_USERS:
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone = %s", (u["phone"],))
        if cur.fetchone():
            skipped.append(u["phone"])
            continue

        pw_hash = hash_password(u["password"])
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (name, phone, password_hash, role) VALUES (%s, %s, %s, %s)",
            (u["name"], u["phone"], pw_hash, u["role"]),
        )
        created.append(u["phone"])

    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps({"created": created, "skipped": skipped}),
    }