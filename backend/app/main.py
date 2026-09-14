from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
from pathlib import Path

from .database import engine, SessionLocal
from . import models
from .auth import ensure_admin_exists
from .routers import auth, products, categories, admin, gallery

load_dotenv()

models.Base.metadata.create_all(bind=engine)

# Carpeta donde se guardan las fotos subidas
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Two Wheels World API", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sirve las fotos subidas en /uploads/nombre-del-archivo
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])
app.include_router(gallery.router, prefix="/gallery", tags=["gallery"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])



@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        ensure_admin_exists(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}
