import re
from typing import Optional

from pydantic import BaseModel, field_validator

CATEGORY_SPEC_FIELDS = {
    "costume": ["size", "color", "era", "condition"],
    "furniture": ["type", "material", "dimensions", "period"],
    "background": ["type", "size", "theme"],
    "props": ["type", "material", "size"],
    "construction": ["type", "dimensions", "material"],
}

VALID_CATEGORIES = set(CATEGORY_SPEC_FIELDS.keys())
VALID_STATUSES = {"in-stock", "out-of-stock"}

COSTUME_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]
COSTUME_CONDITIONS = ["Отличное", "Хорошее", "Удовлетворительное", "Требует ремонта"]
FURNITURE_TYPES = [
    "Стул",
    "Кресло",
    "Диван",
    "Стол",
    "Шкаф",
    "Комод",
    "Трон",
    "Скамья",
    "Прочее",
]
BACKGROUND_TYPES = [
    "Тканевый задник",
    "Печатный задник",
    "Живописный",
    "Проекционный",
    "Прочее",
]
PROPS_TYPES = ["Оружие", "Аксессуар", "Посуда", "Книга/свиток", "Украшение", "Прочее"]
CONSTRUCTION_TYPES = [
    "Арка",
    "Колонна",
    "Опора",
    "Ступени",
    "Подиум",
    "Стена",
    "Прочее",
]
SHARED_MATERIALS = [
    "Дерево",
    "Металл",
    "Пластик",
    "Ткань",
    "Пенопласт",
    "Фанера",
    "Смешанный",
    "Прочее",
]

PHONE_RE = re.compile(r"^[\d\s\+\-\(\)]{7,20}$")
NAME_RE = re.compile(r"^[А-ЯЁа-яёA-Za-z\s\-]{2,100}$")


def _validate_phone(v):
    if v and not PHONE_RE.match(v):
        raise ValueError("Invalid phone number format")
    return v


def _validate_name(v):
    if v and not NAME_RE.match(v):
        raise ValueError("Owner name must contain only letters, spaces and hyphens")
    return v


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

    @field_validator("ownerPhone")
    @classmethod
    def validate_phone(cls, v):
        return _validate_phone(v)

    @field_validator("ownerName")
    @classmethod
    def validate_owner_name(cls, v):
        return _validate_name(v)


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

    @field_validator("ownerPhone")
    @classmethod
    def validate_phone(cls, v):
        return _validate_phone(v)

    @field_validator("ownerName")
    @classmethod
    def validate_owner_name(cls, v):
        return _validate_name(v)
