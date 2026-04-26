import os

from pymongo import MongoClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://db:27017/")
MONGO_DB = os.getenv("MONGO_DB", "theatre_db")

client = MongoClient(MONGO_URL)
db = client[MONGO_DB]
