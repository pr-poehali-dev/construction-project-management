import json
import os
import base64
import uuid
import psycopg2
import boto3

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p29757712_construction_project")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Content-Type": "application/json",
}

CATEGORY_LABELS = {
    "attendance": "Табель / явка",
    "work": "Производство работ",
    "safety": "Охрана труда",
    "issue": "Замечание / проблема",
    "report": "Дневной отчёт",
    "general": "Общее",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def get_user(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        f"""SELECT u.id, u.name, u.role FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,),
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "role": row[2]}


def resp(status, body):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}


def handler(event: dict, context) -> dict:
    """Загрузка фото в S3 и просмотр альбома проекта"""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token") or ""
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    conn = get_conn()
    user = get_user(conn, token)
    if not user:
        conn.close()
        return resp(401, {"error": "Не авторизован"})

    # POST ?action=upload — загрузить фото (base64)
    if method == "POST" and action == "upload":
        body = json.loads(event.get("body") or "{}")
        file_b64 = body.get("file")
        content_type = body.get("content_type", "image/jpeg")
        category = body.get("category", "general")
        caption = (body.get("caption") or "").strip()

        if not file_b64:
            conn.close()
            return resp(400, {"error": "Файл не передан"})

        # Декодируем base64
        if "," in file_b64:
            file_b64 = file_b64.split(",", 1)[1]
        file_bytes = base64.b64decode(file_b64)

        ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
        s3_key = f"photos/{uuid.uuid4().hex}.{ext}"

        s3 = get_s3()
        s3.put_object(
            Bucket="files",
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type,
        )
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"

        cur = conn.cursor()
        cur.execute(
            f"""INSERT INTO {SCHEMA}.photos (user_id, user_name, category, caption, s3_key, cdn_url)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, created_at""",
            (user["id"], user["name"], category, caption, s3_key, cdn_url),
        )
        photo_id, created_at = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return resp(201, {
            "photo": {
                "id": photo_id,
                "cdn_url": cdn_url,
                "category": category,
                "caption": caption,
                "user_name": user["name"],
                "created_at": created_at,
            }
        })

    # GET ?action=list[&category=X] — список фото альбома
    if method == "GET" and action == "list":
        category = params.get("category")
        cur = conn.cursor()
        if category:
            cur.execute(
                f"""SELECT id, user_name, category, caption, cdn_url, created_at
                    FROM {SCHEMA}.photos WHERE category = %s ORDER BY created_at DESC LIMIT 200""",
                (category,),
            )
        else:
            cur.execute(
                f"""SELECT id, user_name, category, caption, cdn_url, created_at
                    FROM {SCHEMA}.photos ORDER BY created_at DESC LIMIT 200"""
            )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        photos = [
            {"id": r[0], "user_name": r[1], "category": r[2], "caption": r[3], "cdn_url": r[4], "created_at": r[5]}
            for r in rows
        ]
        return resp(200, {"photos": photos, "categories": CATEGORY_LABELS})

    conn.close()
    return resp(400, {"error": "Неизвестный action"})
