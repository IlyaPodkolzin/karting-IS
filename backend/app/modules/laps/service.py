from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.modules.laps.repository import LapRepository
from app.modules.laps.models import Lap
from app.modules.bookings.repository import BookingRepository
from app.modules.statistics.service import StatisticService

class LapService:
    def __init__(self, db: Session):
        self.lap_repo = LapRepository(db)
        self.booking_repo = BookingRepository(db)
        self.stat_service = StatisticService(db)

    def add_lap(self, booking_id: int, lap_number: int, lap_time: float) -> Lap:
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        # retry logic is built into the repository via tenacity
        lap = self.lap_repo.create(booking_id=booking_id, lap_number=lap_number, lap_time=lap_time)
        return lap

    def get_laps_for_booking(self, booking_id: int) -> List[Lap]:
        return self.lap_repo.get_by_booking(booking_id)
