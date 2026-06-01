"""
Lap service.
- add_lap: admin-only (enforced at endpoint level), only during active session window (Moscow time).
- get_laps_for_booking: any authenticated user.
"""
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
import pytz

from app.modules.laps.repository import LapRepository
from app.modules.laps.models import Lap
from app.modules.bookings.repository import BookingRepository
from app.modules.bookings.models import BookingStatus

MOSCOW_TZ = pytz.timezone("Europe/Moscow")


def _moscow_now():
    return datetime.now(tz=MOSCOW_TZ).replace(tzinfo=None)


class LapService:
    def __init__(self, db: Session):
        self.lap_repo = LapRepository(db)
        self.booking_repo = BookingRepository(db)

    def add_lap(self, booking_id: int, lap_number: int, lap_time: float) -> Lap:
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")

        if booking.status != BookingStatus.CONFIRMED:
            raise HTTPException(
                status_code=409,
                detail="Laps can only be added to active (confirmed) bookings",
            )

        # Validate the session window in Moscow time
        s = booking.session
        if s is None:
            raise HTTPException(status_code=404, detail="Session data missing")

        now = _moscow_now()
        session_start = datetime.combine(s.date, s.start_time)
        session_end = datetime.combine(s.date, s.end_time)

        if not (session_start <= now <= session_end):
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Laps can only be recorded during the active session window "
                    f"({s.start_time.strftime('%H:%M')}–{s.end_time.strftime('%H:%M')} MSK)"
                ),
            )

        # Retry logic is built into the repository via tenacity
        return self.lap_repo.create(
            booking_id=booking_id,
            lap_number=lap_number,
            lap_time=lap_time,
        )

    def get_laps_for_booking(self, booking_id: int) -> List[Lap]:
        return self.lap_repo.get_by_booking(booking_id)
