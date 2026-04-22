import time
from datetime import datetime, timezone

from bson.objectid import ObjectId
from pymongo import ASCENDING, MongoClient
from pymongo.errors import ConnectionFailure


def get_database():
    for _ in range(15):
        try:
            client = MongoClient("mongodb://db:27017/", serverSelectionTimeoutMS=2000)
            client.admin.command("ping")
            return client["theatre_db"]
        except ConnectionFailure:
            time.sleep(3)
    raise Exception()


def init_db():
    db = get_database()

    db.users.drop()
    db.decorations.drop()

    users_validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["name", "surname", "login", "password", "role"],
            "properties": {
                "name": {"bsonType": "string"},
                "surname": {"bsonType": "string"},
                "login": {"bsonType": "string"},
                "password": {"bsonType": "string"},
                "role": {"bsonType": "string"},
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
                "created_at",
                "updated_at",
                "specs",
            ],
            "properties": {
                "name": {"bsonType": "string"},
                "description": {"bsonType": "string"},
                "category": {"bsonType": "string"},
                "status": {"bsonType": "string"},
                "total_quantity": {"bsonType": ["int", "long"]},
                "available_quantity": {"bsonType": ["int", "long"]},
                "owner_name": {"bsonType": "string"},
                "owner_phone": {"bsonType": "string"},
                "image_url": {"bsonType": "string"},
                "author_id": {"bsonType": "objectId"},
                "created_at": {"bsonType": "date"},
                "updated_at": {"bsonType": "date"},
                "specs": {"bsonType": "object"},
            },
        }
    }

    db.create_collection("users", validator=users_validator)
    db.users.create_index([("login", ASCENDING)], unique=True)

    db.create_collection("decorations", validator=decorations_validator)

    admin_id = ObjectId()
    user_id = ObjectId()

    users_data = [
        {
            "_id": admin_id,
            "name": "Иван",
            "surname": "Иванов",
            "login": "admin",
            "password": "adminpassword",
            "role": "администратор",
        },
        {
            "_id": user_id,
            "name": "Петр",
            "surname": "Петров",
            "login": "user",
            "password": "userpassword",
            "role": "пользователь",
        },
    ]
    db.users.insert_many(users_data)

    now = datetime.now(timezone.utc)

    decorations_data = [
        {
            "name": "Камзол Петра I",
            "description": "Исторический мужской костюм эпохи Петра I, зеленый бархат",
            "category": "Костюм",
            "status": "В наличии",
            "total_quantity": 2,
            "available_quantity": 2,
            "owner_name": "Смирнова Анна",
            "owner_phone": "+7-999-123-45-67",
            "image_url": "/images/kamzol.jpg",
            "author_id": admin_id,
            "created_at": now,
            "updated_at": now,
            "specs": {
                "size": "L",
                "color": "Зеленый",
                "era": "18 век",
                "condition": "Отличное",
            },
        },
        {
            "name": "Платье Екатерины II",
            "description": "Женское бальное платье, красный шелк, корсет",
            "category": "Костюм",
            "status": "В аренде",
            "total_quantity": 1,
            "available_quantity": 0,
            "owner_name": "Смирнова Анна",
            "owner_phone": "+7-999-123-45-67",
            "image_url": "/images/dress_cat.jpg",
            "author_id": admin_id,
            "created_at": now,
            "updated_at": now,
            "specs": {
                "size": "M",
                "color": "Красный",
                "era": "18 век",
                "condition": "Хорошее",
            },
        },
        {
            "name": "Кресло-трон",
            "description": "Деревянное кресло с высокой спинкой и красной обивкой",
            "category": "Мебель и интерьер",
            "status": "В наличии",
            "total_quantity": 3,
            "available_quantity": 3,
            "owner_name": "Сидоров Алексей",
            "owner_phone": "+7-999-765-43-21",
            "image_url": "/images/throne.jpg",
            "author_id": admin_id,
            "created_at": now,
            "updated_at": now,
            "specs": {
                "type": "Кресло",
                "material": "Дерево, бархат",
                "dimensions": "80x80x150",
                "period": "Средневековье",
            },
        },
        {
            "name": "Фон 'Осенний лес'",
            "description": "Тканевый фон с принтом осеннего леса для сцены",
            "category": "Фон",
            "status": "В ремонте",
            "total_quantity": 1,
            "available_quantity": 0,
            "owner_name": "Иванов Сергей",
            "owner_phone": "+7-999-000-11-22",
            "image_url": "/images/forest_bg.jpg",
            "author_id": user_id,
            "created_at": now,
            "updated_at": now,
            "specs": {
                "type": "Тканевый задник",
                "size": "10x5 метров",
                "theme": "Природа",
            },
        },
        {
            "name": "Шпага мушкетера",
            "description": "Бутафорская шпага с гардой, безопасное лезвие",
            "category": "Реквизит",
            "status": "В наличии",
            "total_quantity": 10,
            "available_quantity": 8,
            "owner_name": "Кузнецов Игорь",
            "owner_phone": "+7-999-555-44-33",
            "image_url": "/images/sword.jpg",
            "author_id": user_id,
            "created_at": now,
            "updated_at": now,
            "specs": {"type": "Оружие", "material": "Пластик, сталь", "size": "110 см"},
        },
        {
            "name": "Колонна античная",
            "description": "Пенопластовая колонна для имитации античного храма",
            "category": "Конструкции",
            "status": "В наличии",
            "total_quantity": 6,
            "available_quantity": 4,
            "owner_name": "Кузнецов Игорь",
            "owner_phone": "+7-999-555-44-33",
            "image_url": "/images/column.jpg",
            "author_id": admin_id,
            "created_at": now,
            "updated_at": now,
            "specs": {
                "type": "Опора",
                "dimensions": "50x50x300",
                "material": "Пенопласт",
            },
        },
    ]

    db.decorations.insert_many(decorations_data)


if __name__ == "__main__":
    init_db()
