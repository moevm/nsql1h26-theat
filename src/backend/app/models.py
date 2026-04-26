from typing import Optional

from pydantic import BaseModel

CATEGORY_SPEC_FIELDS = {
    "costume": ["size", "color", "era", "condition"],
    "furniture": ["type", "material", "dimensions", "period"],
    "background": ["type", "size", "theme"],
    "props": ["type", "material", "size"],
    "construction": ["type", "dimensions", "material"],
}

VALID_CATEGORIES = set(CATEGORY_SPEC_FIELDS.keys())
VALID_STATUSES = {"in-stock", "out-of-stock"}


class LoginRequest(BaseModel):
    login: str
    password: str


class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    login: str
    password: str


class DecorationPayload(BaseModel):
    name: str
    description: str
    category: str
    status: str
    totalQuantity: int
    availableQuantity: int
    ownerName: str
    ownerPhone: str
    image: Optional[str] = ""
    createdBy: Optional[str] = ""
    size: Optional[str] = ""
    color: Optional[str] = ""
    era: Optional[str] = ""
    condition: Optional[str] = ""
    type: Optional[str] = ""
    material: Optional[str] = ""
    dimensions: Optional[str] = ""
    period: Optional[str] = ""
    theme: Optional[str] = ""


class DecorationPatch(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    totalQuantity: Optional[int] = None
    availableQuantity: Optional[int] = None
    ownerName: Optional[str] = None
    ownerPhone: Optional[str] = None
    image: Optional[str] = None
    createdBy: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    era: Optional[str] = None
    condition: Optional[str] = None
    type: Optional[str] = None
    material: Optional[str] = None
    dimensions: Optional[str] = None
    period: Optional[str] = None
    theme: Optional[str] = None
