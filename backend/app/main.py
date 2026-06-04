import logging
import os
 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
 
from app.core.config import settings
from app.api.v1.router import api_router
from app.core.scheduler import start_scheduler
 
# Import all models so Base.metadata is populated (needed by Alembic env.py)
from app.modules.users.models import User, ClientProfile, AdminProfile          # noqa
from app.modules.kartodromes.models import Kartodrome                           # noqa
from app.modules.sessions.models import Session                                 # noqa
from app.modules.bookings.models import Booking                                 # noqa
from app.modules.laps.models import Lap                                         # noqa
from app.modules.statistics.models import Statistic                             # noqa
from app.modules.admin.models import Kart                                       # noqa
 
logging.basicConfig(level=logging.INFO)
 
# Ensure uploads directory exists
UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
 
# NOTE: Base.metadata.create_all() has been intentionally removed.
# Tables are managed exclusively by Alembic migrations (alembic upgrade head),
# which runs before this application starts (see Start Command).
# create_all() conflicts with Alembic on Render because it creates PostgreSQL
# native enum types (userrole, bookingstatus, etc.) before Alembic runs,
# causing "DuplicateObject" errors that prevent the alembic_version row
# from being written — making every subsequent deploy re-attempt migration 0001.
 
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


@app.head("/health")
def health_head():
    return True