"""
Statistics module — CQRS read side.
Writes are triggered by booking completion.
Reads serve aggregated lap-time data.
"""
from typing import List
from sqlalchemy.orm import Session
from app.modules.statistics.repository import StatisticRepository
from app.modules.statistics.models import Statistic
from app.modules.laps.repository import LapRepository
from app.modules.bookings.repository import BookingRepository
from app.modules.sessions.repository import SessionRepository


class StatisticService:
    def __init__(self, db: Session):
        self.stat_repo = StatisticRepository(db)
        self.lap_repo = LapRepository(db)
        self.booking_repo = BookingRepository(db)
        self.session_repo = SessionRepository(db)

    def get_my_statistics(self, user_id: int) -> List[Statistic]:
        return self.stat_repo.get_by_user(user_id)

    def get_user_statistics(self, user_id: int) -> List[Statistic]:
        return self.stat_repo.get_by_user_id_for_admin(user_id)

    def recalculate_for_booking(self, booking) -> None:
        """Recalculate statistics after a booking is completed.

        We re-fetch the booking to ensure the session relationship is loaded
        (the booking object passed from update_status may have an expired session).
        """
        fresh = self.booking_repo.get_by_id(booking.id)
        if fresh is None or fresh.session is None:
            return

        kartodrome_id = fresh.session.kartodrome_id
        user_id = fresh.user_id

        # Find all bookings for this user at this kartodrome
        all_bookings = self.booking_repo.get_by_user(user_id)
        relevant_ids = [
            b.id for b in all_bookings
            if b.session is not None and b.session.kartodrome_id == kartodrome_id
        ]

        laps = self.lap_repo.get_by_bookings(relevant_ids)
        if not laps:
            return

        times = [lap.lap_time for lap in laps]
        self.stat_repo.upsert(
            user_id=user_id,
            kartodrome_id=kartodrome_id,
            best_lap_time=min(times),
            average_lap_time=round(sum(times) / len(times), 3),
            total_laps=len(times),
        )
