import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException

from app.models import CATEGORY_SPEC_FIELDS, VALID_CATEGORIES, VALID_STATUSES


def iso(dt: Any) -> str:
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt or "")


def text_contains(value: str) -> Dict[str, Any]:
    return {"$regex": re.escape(value.strip()), "$options": "i"}


def decoration_to_frontend(doc: Dict[str, Any]) -> Dict[str, Any]:
    data = {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "category": doc.get("category", "costume"),
        "status": doc.get("status", "in-stock"),
        "description": doc.get("description", ""),
        "totalQuantity": int(doc.get("total_quantity", 0)),
        "availableQuantity": int(doc.get("available_quantity", 0)),
        "ownerName": doc.get("owner_name", ""),
        "ownerPhone": doc.get("owner_phone", ""),
        "image": doc.get("image_url", ""),
        "authorId": str(doc.get("author_id", "")),
        "createdBy": doc.get("created_by", ""),
        "createdAt": iso(doc.get("created_at")),
        "lastEditedAt": iso(doc.get("updated_at")),
    }
    data.update(doc.get("specs") or {})
    return data


def validate_decoration_values(data: Dict[str, Any]) -> None:
    category = data.get("category")
    status_value = data.get("status")

    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail="Unknown decoration category")

    if status_value not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Unknown decoration status")

    if int(data.get("totalQuantity", 0)) < 0 or int(data.get("availableQuantity", 0)) < 0:
        raise HTTPException(status_code=400, detail="Quantities must be non-negative")

    if int(data.get("availableQuantity", 0)) > int(data.get("totalQuantity", 0)):
        raise HTTPException(status_code=400, detail="Available quantity cannot be greater than total quantity")


def payload_to_db(
    data: Dict[str, Any],
    user: Dict[str, Any],
    existing: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    merged = dict(existing or {})

    for key, value in data.items():
        if value is not None:
            merged[key] = value

    if "category" not in merged:
        merged["category"] = existing.get("category") if existing else "costume"

    if "status" not in merged:
        merged["status"] = existing.get("status") if existing else "in-stock"

    if "totalQuantity" not in merged:
        merged["totalQuantity"] = existing.get("total_quantity", 0) if existing else 0

    if "availableQuantity" not in merged:
        merged["availableQuantity"] = existing.get("available_quantity", 0) if existing else 0

    validate_decoration_values(merged)

    category = merged["category"]
    specs = dict(existing.get("specs", {}) if existing else {})

    for field in CATEGORY_SPEC_FIELDS[category]:
        if field in merged and merged[field] is not None:
            specs[field] = str(merged.get(field) or "")

    now = datetime.now(timezone.utc)
    created_by_default = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()

    return {
        "name": str(merged.get("name") if merged.get("name") is not None else existing.get("name", "")),
        "description": str(
            merged.get("description") if merged.get("description") is not None else existing.get("description", "")
        ),
        "category": category,
        "status": merged["status"],
        "total_quantity": int(merged.get("totalQuantity", 0)),
        "available_quantity": int(merged.get("availableQuantity", 0)),
        "owner_name": str(
            merged.get("ownerName") if merged.get("ownerName") is not None else existing.get("owner_name", "")
        ),
        "owner_phone": str(
            merged.get("ownerPhone") if merged.get("ownerPhone") is not None else existing.get("owner_phone", "")
        ),
        "image_url": str(merged.get("image") if merged.get("image") is not None else existing.get("image_url", "")),
        "author_id": existing.get("author_id") if existing else user["_id"],
        "created_by": str(existing.get("created_by") if existing else created_by_default),
        "created_at": existing.get("created_at") if existing else now,
        "updated_at": now,
        "specs": specs,
    }
