import json
from datetime import datetime, timezone
from typing import Any, Dict

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.auth import get_current_user, user_to_frontend
from app.database import db
from app.utils import decoration_to_frontend, payload_to_db

router = APIRouter()


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role is required")
    return user


@router.get("/stats")
def get_stats(user: Dict[str, Any] = Depends(require_admin)):
    pipeline = [
        {
            "$group": {
                "_id": "$category",
                "total": {"$sum": 1},
                "in_stock": {
                    "$sum": {"$cond": [{"$eq": ["$status", "in-stock"]}, 1, 0]}
                },
                "out_of_stock": {
                    "$sum": {"$cond": [{"$eq": ["$status", "out-of-stock"]}, 1, 0]}
                },
                "total_quantity": {"$sum": "$total_quantity"},
                "available_quantity": {"$sum": "$available_quantity"},
            }
        }
    ]

    category_stats = {
        doc["_id"]: {
            "total": doc["total"],
            "inStock": doc["in_stock"],
            "outOfStock": doc["out_of_stock"],
            "totalQuantity": doc["total_quantity"],
            "availableQuantity": doc["available_quantity"],
        }
        for doc in db.decorations.aggregate(pipeline)
    }

    total_decorations = db.decorations.count_documents({})
    total_in_stock = db.decorations.count_documents({"status": "in-stock"})
    total_users = db.users.count_documents({})

    return {
        "totalDecorations": total_decorations,
        "inStock": total_in_stock,
        "outOfStock": total_decorations - total_in_stock,
        "totalUsers": total_users,
        "byCategory": category_stats,
    }


@router.get("/users")
def list_users(user: Dict[str, Any] = Depends(require_admin)):
    return [user_to_frontend(u) for u in db.users.find({})]


class UpdateRolePayload(BaseModel):
    role: str


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: UpdateRolePayload,
    current_user: Dict[str, Any] = Depends(require_admin),
):
    if payload.role not in {"user", "manager", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    try:
        oid = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid user id") from exc

    target = db.users.find_one({"_id": oid})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if str(target["_id"]) == str(current_user["_id"]):
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    db.users.update_one({"_id": oid}, {"$set": {"role": payload.role}})
    updated = db.users.find_one({"_id": oid})
    return user_to_frontend(updated)


@router.get("/export")
def export_all(user: Dict[str, Any] = Depends(require_admin)):
    decorations = [decoration_to_frontend(doc) for doc in db.decorations.find({})]
    users = [user_to_frontend(u) for u in db.users.find({})]

    return JSONResponse(
        content={
            "exportedAt": datetime.now(timezone.utc).isoformat(),
            "decorations": decorations,
            "users": users,
        },
        headers={"Content-Disposition": "attachment; filename=theatre_backup.json"},
    )


@router.post("/import")
async def import_all(
    request_body: Dict[str, Any], user: Dict[str, Any] = Depends(require_admin)
):
    decorations_data = request_body.get("decorations", [])
    users_data = request_body.get("users", [])

    imported_decorations = 0
    imported_users = 0

    for dec in decorations_data:
        existing_id = dec.get("id")
        doc = payload_to_db(dec, user)

        if existing_id:
            try:
                oid = ObjectId(existing_id)
                existing = db.decorations.find_one({"_id": oid})
                if existing:
                    db.decorations.update_one({"_id": oid}, {"$set": doc})
                else:
                    doc["_id"] = oid
                    db.decorations.insert_one(doc)
                imported_decorations += 1
            except Exception:
                pass
        else:
            db.decorations.insert_one(doc)
            imported_decorations += 1

    for u in users_data:
        login = u.get("login")
        if not login:
            continue
        existing = db.users.find_one({"login": login})
        if not existing:
            db.users.insert_one(
                {
                    "_id": ObjectId(),
                    "first_name": u.get("firstName", ""),
                    "last_name": u.get("lastName", ""),
                    "login": login,
                    "password": u.get("password", ""),
                    "role": u.get("role", "user"),
                }
            )
            imported_users += 1

    return {
        "importedDecorations": imported_decorations,
        "importedUsers": imported_users,
    }
