from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, kartodromes, sessions, bookings, laps, statistics, analytics, admin

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(kartodromes.router)
api_router.include_router(sessions.router)
api_router.include_router(bookings.router)
api_router.include_router(laps.router)
api_router.include_router(statistics.router)
api_router.include_router(analytics.router)
api_router.include_router(admin.router)
