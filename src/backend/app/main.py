import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import db
from app.routers.auth import router as auth_router
from app.routers.decorations import router as decorations_router
from init_db import init_db

app = FastAPI(title="Theatre Decorations API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_init_database():
    init_db()


@app.get("/api/health")
def health():
    db.command("ping")
    return {"status": "ok"}


app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(decorations_router, prefix="/api/decorations", tags=["decorations"])
