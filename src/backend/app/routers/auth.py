from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import create_token, get_current_user, user_to_frontend
from app.database import db
from app.models import LoginRequest, RegisterRequest

router = APIRouter()


@router.post("/login")
def login(payload: LoginRequest):
    user = db.users.find_one({"login": payload.login, "password": payload.password})

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid login or password")

    return {
        "access_token": create_token(user["_id"], user["login"]),
        "user": user_to_frontend(user),
    }


@router.get("/me")
def me(user: Dict[str, Any] = Depends(get_current_user)):
    return user_to_frontend(user)


@router.post("/register", status_code=501)
def register_disabled(_: RegisterRequest):
    raise HTTPException(status_code=501, detail="Registration is disabled for this coursework stage")
