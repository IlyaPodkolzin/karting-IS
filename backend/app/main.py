import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.api.v1.router import api_router

# Import all models so Base.metadata knows every table
from app.modules.users.models import User, ClientProfile, AdminProfile  # noqa
from app.modules.kartodromes.models import Kartodrome  # noqa
from app.modules.sessions.models import Session  # noqa
from app.modules.bookings.models import Booking  # noqa
from app.modules.laps.models import Lap  # noqa
from app.modules.statistics.models import Statistic  # noqa
from app.modules.admin.models import Kart  # noqa

from app.db.base import Base
from app.db.session import engine
from app.core.scheduler import start_scheduler

logging.basicConfig(level=logging.INFO)

# Ensure upload directory exists
UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Safety net: create tables if Alembic hasn't run
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KartBook API",
    description="Система бронирования картинговых заездов и учёта статистики",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files at /uploads/<filename>
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(api_router)

# Start background scheduler (auto-complete bookings, delete old sessions)
_scheduler = start_scheduler()


@app.on_event("shutdown")
def shutdown_scheduler():
    _scheduler.shutdown(wait=False)


@app.get("/health")
def health():
    return {"status": "ok"}
