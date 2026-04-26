import os
import time
from datetime import datetime, timezone
from typing import Any, Dict

from bson import ObjectId
from pymongo import ASCENDING, MongoClient
from pymongo.errors import CollectionInvalid, ConnectionFailure, OperationFailure

MONGO_URL = os.getenv("MONGO_URL", "mongodb://db:27017/")
DB_NAME = os.getenv("MONGO_DB", "theatre_db")
def get_database():
    last_error = None
    for _ in range(30):
        try:
            client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=2000)
            client.admin.command("ping")
            return client[DB_NAME]
        except ConnectionFailure as exc:
            last_error = exc
            time.sleep(2)
    raise RuntimeError(f"MongoDB is unavailable: {last_error}")


def ensure_collection(db, name: str, validator: Dict[str, Any]):
    if name not in db.list_collection_names():
        try:
            db.create_collection(name, validator=validator)
            return
        except CollectionInvalid:
            return
    try:
        db.command({"collMod": name, "validator": validator})
    except OperationFailure:
        pass


def init_db():
    db = get_database()

    users_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["first_name", "last_name", "login", "password", "role"],
            "properties": {
                "first_name": {"bsonType": "string"},
                "last_name": {"bsonType": "string"},
                "login": {"bsonType": "string"},
                "password": {"bsonType": "string"},
                "role": {"enum": ["user", "manager", "admin"]},
            },
        }
    }

    decorations_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": [
                "name",
                "description",
                "category",
                "status",
                "total_quantity",
                "available_quantity",
                "owner_name",
                "owner_phone",
                "image_url",
                "author_id",
                "created_by",
                "created_at",
                "updated_at",
                "specs",
            ],
            "properties": {
                "name": {"bsonType": "string"},
                "description": {"bsonType": "string"},
                "category": {"enum": ["costume", "furniture", "background", "props", "construction"]},
                "status": {"enum": ["in-stock", "out-of-stock"]},
                "total_quantity": {"bsonType": ["int", "long", "double"]},
                "available_quantity": {"bsonType": ["int", "long", "double"]},
                "owner_name": {"bsonType": "string"},
                "owner_phone": {"bsonType": "string"},
                "image_url": {"bsonType": "string"},
                "author_id": {"bsonType": "objectId"},
                "created_by": {"bsonType": "string"},
                "created_at": {"bsonType": "date"},
                "updated_at": {"bsonType": "date"},
                "specs": {"bsonType": "object"},
            },
        }
    }

    ensure_collection(db, "users", users_validator)
    ensure_collection(db, "decorations", decorations_validator)

    db.users.create_index([("login", ASCENDING)], unique=True)
    db.decorations.create_index([("name", ASCENDING)])
    db.decorations.create_index([("category", ASCENDING)])
    db.decorations.create_index([("status", ASCENDING)])
    db.decorations.create_index([("specs.size", ASCENDING)])
    db.decorations.create_index([("specs.color", ASCENDING)])
    db.decorations.create_index([("specs.era", ASCENDING)])
    db.decorations.create_index([("specs.condition", ASCENDING)])
    db.decorations.create_index([("specs.type", ASCENDING)])
    db.decorations.create_index([("specs.material", ASCENDING)])
    db.decorations.create_index([("specs.dimensions", ASCENDING)])
    db.decorations.create_index([("specs.period", ASCENDING)])
    db.decorations.create_index([("specs.theme", ASCENDING)])

    users_data = [
        {
            "first_name": "Администратор",
            "last_name": "Системы",
            "login": "admin",
            "password": "admin",
            "role": "admin",
        },
        {
            "first_name": "Мария",
            "last_name": "Заведующая",
            "login": "manager",
            "password": "manager",
            "role": "manager",
        },
        {
            "first_name": "Петр",
            "last_name": "Пользователь",
            "login": "user",
            "password": "user",
            "role": "user",
        },
    ]

    for user in users_data:
        db.users.update_one(
            {"login": user["login"]},
            {"$setOnInsert": {"_id": ObjectId(), **user}},
            upsert=True,
        )

    admin_id = db.users.find_one({"login": "admin"})["_id"]
    manager_id = db.users.find_one({"login": "manager"})["_id"]
    user_id = db.users.find_one({"login": "user"})["_id"]

    if db.decorations.count_documents({}) > 0:
        print("MongoDB theatre_db already initialized")
        return

    now = datetime.now(timezone.utc)

    decorations_data = [
        {
            "name": "Камзол Петра I",
            "description": "Исторический мужской костюм эпохи Петра I, зеленый бархат",
            "category": "costume",
            "status": "in-stock",
            "total_quantity": 2,
            "available_quantity": 2,
            "owner_name": "Смирнова Анна",
            "owner_phone": "+7-999-123-45-67",
            "image_url": "https://www.museikino.ru/upload/resize_cache/iblock/85b/610_10000_1/85b41e026344ce824baa1fbb17a9d287.jpg",
            "author_id": admin_id,
            "created_by": "Администратор Системы",
            "created_at": now,
            "updated_at": now,
            "specs": {"size": "L", "color": "Зеленый", "era": "18 век", "condition": "Отличное"},
        },
        {
            "name": "Платье Екатерины II",
            "description": "Женское бальное платье, красный шелк, корсет",
            "category": "costume",
            "status": "out-of-stock",
            "total_quantity": 1,
            "available_quantity": 0,
            "owner_name": "Смирнова Анна",
            "owner_phone": "+7-999-123-45-67",
            "image_url": "https://avatars.mds.yandex.net/i?id=e21a2a9fd73b92832477debabfda296e_l-10385057-images-thumbs&n=13",
            "author_id": manager_id,
            "created_by": "Мария Заведующая",
            "created_at": now,
            "updated_at": now,
            "specs": {"size": "M", "color": "Красный", "era": "18 век", "condition": "Хорошее"},
        },
        {
            "name": "Кресло-трон",
            "description": "Деревянное кресло с высокой спинкой и красной обивкой",
            "category": "furniture",
            "status": "in-stock",
            "total_quantity": 3,
            "available_quantity": 3,
            "owner_name": "Сидоров Алексей",
            "owner_phone": "+7-999-765-43-21",
            "image_url": "https://avatars.mds.yandex.net/i?id=c706dfed0031478883892488ef56b34b567f34c3-4429719-images-thumbs&n=13",
            "author_id": admin_id,
            "created_by": "Администратор Системы",
            "created_at": now,
            "updated_at": now,
            "specs": {"type": "Кресло", "material": "Дерево, бархат", "dimensions": "80x80x150", "period": "Средневековье"},
        },
        {
            "name": "Фон 'Осенний лес'",
            "description": "Тканевый фон с принтом осеннего леса для сцены",
            "category": "background",
            "status": "out-of-stock",
            "total_quantity": 1,
            "available_quantity": 0,
            "owner_name": "Иванов Сергей",
            "owner_phone": "+7-999-000-11-22",
            "image_url": "https://png.pngtree.com/thumb_back/fh260/background/20240528/pngtree-autumn-park-forest-fall-foliage-image_15733304.jpg",
            "author_id": manager_id,
            "created_by": "Мария Заведующая",
            "created_at": now,
            "updated_at": now,
            "specs": {"type": "Тканевый задник", "size": "10x5 метров", "theme": "Природа"},
        },
        {
            "name": "Шпага мушкетера",
            "description": "Бутафорская шпага с гардой, безопасное лезвие",
            "category": "props",
            "status": "in-stock",
            "total_quantity": 10,
            "available_quantity": 8,
            "owner_name": "Кузнецов Игорь",
            "owner_phone": "+7-999-555-44-33",
            "image_url": "https://avatars.mds.yandex.net/get-mpic/4937511/img_id1685990242772626980.jpeg/orig",
            "author_id": admin_id,
            "created_by": "Администратор Системы",
            "created_at": now,
            "updated_at": now,
            "specs": {"type": "Оружие", "material": "Пластик, сталь", "size": "110 см"},
        },
        {
            "name": "Колонна античная",
            "description": "Пенопластовая колонна для имитации античного храма",
            "category": "construction",
            "status": "in-stock",
            "total_quantity": 6,
            "available_quantity": 4,
            "owner_name": "Кузнецов Игорь",
            "owner_phone": "+7-999-555-44-33",
            "image_url": "https://sc03.alicdn.com/kf/HLB155CMSHrpK1RjSZTE763WAVXaS.png",
            "author_id": admin_id,
            "created_by": "Администратор Системы",
            "created_at": now,
            "updated_at": now,
            "specs": {"type": "Опора", "dimensions": "50x50x300", "material": "Пенопласт"},
        },
        {
            "name": "Антикварный стол",
            "description": "Деревянный стол с резными ножками для интерьерных сцен",
            "category": "furniture",
            "status": "out-of-stock",
            "total_quantity": 2,
            "available_quantity": 0,
            "owner_name": "Сидоров Алексей",
            "owner_phone": "+7-999-765-43-21",
            "image_url": "https://i.pinimg.com/originals/64/55/86/64558603de91b69c4d7d3b19035e4849.jpg",
            "author_id": manager_id,
            "created_by": "Мария Заведующая",
            "created_at": now,
            "updated_at": now,
            "specs": {"type": "Стол", "material": "Дерево", "dimensions": "160x80x75", "period": "19 век"},
        },
        {
            "name": "Фон 'Звездная ночь'",
            "description": "Темный сценический фон со звездами для вечерних постановок",
            "category": "background",
            "status": "in-stock",
            "total_quantity": 2,
            "available_quantity": 2,
            "owner_name": "Иванов Сергей",
            "owner_phone": "+7-999-000-11-22",
            "image_url": "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=900&q=80",
            "author_id": admin_id,
            "created_by": "Администратор Системы",
            "created_at": now,
            "updated_at": now,
            "specs": {"type": "Печатный задник", "size": "8x4 метра", "theme": "Ночь"},
        },
        {
            "name": "Старинный подсвечник",
            "description": "Бутафорский металлический подсвечник для исторических сцен",
            "category": "props",
            "status": "out-of-stock",
            "total_quantity": 4,
            "available_quantity": 0,
            "owner_name": "Кузнецов Игорь",
            "owner_phone": "+7-999-555-44-33",
            "image_url": "https://avatars.mds.yandex.net/get-mpic/14720780/2a00000195808f6dd80986920149e201fe0a/orig",
            "author_id": manager_id,
            "created_by": "Мария Заведующая",
            "created_at": now,
            "updated_at": now,
            "specs": {"type": "Аксессуар", "material": "Металл", "size": "45 см"},
        },
        {
            "name": "Арка дворцовая",
            "description": "Разборная арка для оформления входа во дворец",
            "category": "construction",
            "status": "out-of-stock",
            "total_quantity": 1,
            "available_quantity": 0,
            "owner_name": "Кузнецов Игорь",
            "owner_phone": "+7-999-555-44-33",
            "image_url": "https://i.archi.ru/i/825_550/383276.png",
            "author_id": manager_id,
            "created_by": "Мария Заведующая",
            "created_at": now,
            "updated_at": now,
            "specs": {"type": "Арка", "dimensions": "300x60x260", "material": "Фанера, пенопласт"},
        },
    ]

    db.decorations.insert_many(decorations_data)
    print("MongoDB theatre_db initialized")


if __name__ == "__main__":
    init_db()
