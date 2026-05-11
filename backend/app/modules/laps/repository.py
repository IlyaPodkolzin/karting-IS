from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.laps.models import Lap
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

logger = logging.getLogger(__name__)

class LapRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_booking(self, booking_id: int) -> List[Lap]:
        return self.db.query(Lap).filter(Lap.booking_id == booking_id).order_by(Lap.lap_number).all()

    def get_by_bookings(self, booking_ids: List[int]) -> List[Lap]:
        return self.db.query(Lap).filter(Lap.booking_id.in_(booking_ids)).order_by(Lap.lap_number).all()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8),
           reraise=True)
    def create(self, booking_id: int, lap_number: int, lap_time: float) -> Lap:
        lap = Lap(booking_id=booking_id, lap_number=lap_number, lap_time=lap_time)
        self.db.add(lap)
        self.db.commit()
        self.db.refresh(lap)
        return lap
