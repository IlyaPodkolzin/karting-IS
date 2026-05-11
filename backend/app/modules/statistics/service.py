"""
Statistics module — CQRS read side.
Writes are triggered by booking completion or lap addition.
Reads are optimized aggregation queries.
"""
from typing import List
from sqlalchemy.orm import Session
from app.modules.statistics.repository import StatisticRepository
from app.modules.statistics.models import Statistic
from app.modules.laps.repository import LapRepository
from app.modules.bookings.repository import BookingRepository

class StatisticService:
    def __init__(self, db: Session):
        self.stat_repo = StatisticRepository(db)
        self.lap_repo = LapRepository(db)
        self.booking_repo = BookingRepository(db)

    def get_my_statistics(self, user_id: int) -> List[Statistic]:
        return self.stat_repo.get_by_user(user_id)

    def get_user_statistics(self, user_id: int) -> List[Statistic]:
        return self.stat_repo.get_by_user_id_for_admin(user_id)

    def recalculate_for_booking(self, booking) -> None:
        """Recalculate (or create) statistics after a booking is completed."""
        session = booking.session
        kartodrome_id = session.kartodrome_id
        user_id = booking.user_id

        # Gather all completed bookings for this user at this kartodrome
        all_bookings = self.booking_repo.get_by_user(user_id)
        relevant_ids = [
            b.id for b in all_bookings
            if b.session and b.session.kartodrome_id == kartodrome_id
        ]
        laps = self.lap_repo.get_by_bookings(relevant_ids)
        if not laps:
            return
        times = [l.lap_time for l in laps]
        self.stat_repo.upsert(
            user_id=user_id,
            kartodrome_id=kartodrome_id,
            best_lap_time=min(times),
            average_lap_time=round(sum(times) / len(times), 3),
            total_laps=len(times)
        )
