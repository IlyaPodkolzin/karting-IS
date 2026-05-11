from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

# Import all models so Alembic can discover them
from app.modules.users.models import User, ClientProfile, AdminProfile  # noqa
from app.modules.kartodromes.models import Kartodrome  # noqa
from app.modules.sessions.models import Session  # noqa
from app.modules.bookings.models import Booking  # noqa
from app.modules.laps.models import Lap  # noqa
from app.modules.statistics.models import Statistic  # noqa
from app.modules.admin.models import Kart  # noqa

app = FastAPI(
    title="KartBook API",
    description="Система бронирования картинговых заездов и учета статистики",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/health")
def health():
    return {"status": "ok"}
