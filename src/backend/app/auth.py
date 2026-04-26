import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict, Optional

from bson import ObjectId
from fastapi import Header, HTTPException, status

from app.database import db

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
TOKEN_TTL_SECONDS = 60 * 60 * 24


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_token(user_id: ObjectId, login: str) -> str:
    payload = {
        "sub": str(user_id),
        "login": login,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    payload_raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode()
    payload_encoded = _b64encode(payload_raw)
    signature = hmac.new(SECRET_KEY.encode(), payload_encoded.encode(), hashlib.sha256).digest()
    return f"{payload_encoded}.{_b64encode(signature)}"


def verify_token(token: str) -> Dict[str, Any]:
    try:
        payload_encoded, signature_encoded = token.split(".", 1)
        expected = hmac.new(SECRET_KEY.encode(), payload_encoded.encode(), hashlib.sha256).digest()
        actual = _b64decode(signature_encoded)
        if not hmac.compare_digest(expected, actual):
            raise ValueError("bad signature")

        payload = json.loads(_b64decode(payload_encoded).decode())
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("expired")

        return payload
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


def user_to_frontend(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(user["_id"]),
        "firstName": user.get("first_name", ""),
        "lastName": user.get("last_name", ""),
        "login": user.get("login", ""),
        "role": user.get("role", "user"),
    }


def get_current_user(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header is required")

    token = authorization.split(" ", 1)[1]
    payload = verify_token(token)

    try:
        user_id = ObjectId(payload["sub"])
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject") from exc

    user = db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User was not found")

    return user
