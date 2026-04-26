from datetime import datetime, timezone
from typing import Any, Dict, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.errors import DuplicateKeyError

from app.auth import get_current_user
from app.database import db
from app.models import DecorationPatch, DecorationPayload, VALID_STATUSES
from app.permissions import ensure_can_modify_decoration, require_manager_or_admin
from app.utils import decoration_to_frontend, payload_to_db, text_contains

router = APIRouter()


@router.get("")
def list_decorations(
    user: Dict[str, Any] = Depends(get_current_user),
    name: Optional[str] = Query(default=None),
    description: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    status_value: Optional[str] = Query(default=None, alias="status"),
    ownerName: Optional[str] = Query(default=None),
    ownerPhone: Optional[str] = Query(default=None),
    totalFrom: Optional[int] = Query(default=None),
    totalTo: Optional[int] = Query(default=None),
    availableFrom: Optional[int] = Query(default=None),
    availableTo: Optional[int] = Query(default=None),
    size: Optional[str] = Query(default=None),
    color: Optional[str] = Query(default=None),
    era: Optional[str] = Query(default=None),
    condition: Optional[str] = Query(default=None),
    type_value: Optional[str] = Query(default=None, alias="type"),
    material: Optional[str] = Query(default=None),
    dimensions: Optional[str] = Query(default=None),
    period: Optional[str] = Query(default=None),
    theme: Optional[str] = Query(default=None),
):
    query: Dict[str, Any] = {}

    if name:
        query["name"] = text_contains(name)

    if description:
        query["description"] = text_contains(description)

    if category:
        query["category"] = category

    if status_value:
        query["status"] = status_value

    if ownerName:
        query["owner_name"] = text_contains(ownerName)

    if ownerPhone:
        query["owner_phone"] = text_contains(ownerPhone)

    if totalFrom is not None or totalTo is not None:
        query["total_quantity"] = {}

        if totalFrom is not None:
            query["total_quantity"]["$gte"] = totalFrom

        if totalTo is not None:
            query["total_quantity"]["$lte"] = totalTo

    if availableFrom is not None or availableTo is not None:
        query["available_quantity"] = {}

        if availableFrom is not None:
            query["available_quantity"]["$gte"] = availableFrom

        if availableTo is not None:
            query["available_quantity"]["$lte"] = availableTo

    spec_filters = {
        "size": size,
        "color": color,
        "era": era,
        "condition": condition,
        "type": type_value,
        "material": material,
        "dimensions": dimensions,
        "period": period,
        "theme": theme,
    }

    for spec_key, spec_value in spec_filters.items():
        if spec_value:
            query[f"specs.{spec_key}"] = text_contains(spec_value)

    return [
        decoration_to_frontend(doc)
        for doc in db.decorations.find(query).sort("created_at", -1)
    ]


@router.get("/{decoration_id}")
def get_decoration(
    decoration_id: str,
    _: Dict[str, Any] = Depends(get_current_user),
):
    try:
        oid = ObjectId(decoration_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid decoration id") from exc

    doc = db.decorations.find_one({"_id": oid})

    if not doc:
        raise HTTPException(status_code=404, detail="Decoration not found")

    return decoration_to_frontend(doc)


@router.post("", status_code=201)
def create_decoration(
    payload: DecorationPayload,
    user: Dict[str, Any] = Depends(require_manager_or_admin),
):
    data = payload.model_dump()
    doc = payload_to_db(data, user)

    try:
        result = db.decorations.insert_one(doc)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=400, detail="Duplicate decoration") from exc

    created = db.decorations.find_one({"_id": result.inserted_id})

    return decoration_to_frontend(created)


@router.patch("/{decoration_id}")
def update_decoration(
    decoration_id: str,
    payload: DecorationPatch,
    user: Dict[str, Any] = Depends(require_manager_or_admin),
):
    try:
        oid = ObjectId(decoration_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid decoration id") from exc

    existing = db.decorations.find_one({"_id": oid})

    if not existing:
        raise HTTPException(status_code=404, detail="Decoration not found")

    ensure_can_modify_decoration(user, existing)

    data = {key: value for key, value in payload.model_dump().items() if value is not None}
    doc = payload_to_db(data, user, existing=existing)

    db.decorations.update_one({"_id": oid}, {"$set": doc})

    updated = db.decorations.find_one({"_id": oid})

    return decoration_to_frontend(updated)


@router.patch("/{decoration_id}/status")
def update_decoration_status(
    decoration_id: str,
    payload: DecorationPatch,
    user: Dict[str, Any] = Depends(require_manager_or_admin),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Unknown decoration status")

    try:
        oid = ObjectId(decoration_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid decoration id") from exc

    existing = db.decorations.find_one({"_id": oid})

    if not existing:
        raise HTTPException(status_code=404, detail="Decoration not found")

    ensure_can_modify_decoration(user, existing)

    db.decorations.update_one(
        {"_id": oid},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc)}},
    )

    updated = db.decorations.find_one({"_id": oid})

    return decoration_to_frontend(updated)


@router.delete("/{decoration_id}", status_code=204)
def delete_decoration(
    decoration_id: str,
    user: Dict[str, Any] = Depends(require_manager_or_admin),
):
    try:
        oid = ObjectId(decoration_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid decoration id") from exc

    existing = db.decorations.find_one({"_id": oid})

    if not existing:
        raise HTTPException(status_code=404, detail="Decoration not found")

    ensure_can_modify_decoration(user, existing)

    db.decorations.delete_one({"_id": oid})

    return None
