from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.simple_db


@app.get("/test")
async def test():
    await db.items.insert_one({"status": "working"})

    total = await db.items.count_documents({})

    return {"count": total}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
