"""
Analytics module — CQRS read side.
Provides aggregated occupancy and load data for admins.
"""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.modules.kartodromes.repository import KartodromeRepository
from app.modules.sessions.repository import SessionRepository
from app.modules.bookings.repository import BookingRepository

class AnalyticsService:
    def __init__(self, db: Session):
        self.kartodrome_repo = KartodromeRepository(db)
        self.session_repo = SessionRepository(db)
        self.booking_repo = BookingRepository(db)

    def get_club_load(self) -> List[Dict[str, Any]]:
        results = []
        for k in self.kartodrome_repo.get_all():
            sessions = self.session_repo.get_all(kartodrome_id=k.id)
            total_slots = sum(s.max_participants for s in sessions)
            taken = sum(
                self.booking_repo.count_active_for_session(s.id) for s in sessions
            )
            results.append({
                "kartodrome_id": k.id,
                "kartodrome_name": k.name,
                "total_slots": total_slots,
                "taken_slots": taken,
                "occupancy_pct": round(taken / total_slots * 100, 1) if total_slots else 0,
            })
        return results

    def get_kartodrome_load(self, kartodrome_id: int) -> Dict[str, Any]:
        k = self.kartodrome_repo.get_by_id(kartodrome_id)
        if not k:
            return {}
        sessions = self.session_repo.get_all(kartodrome_id=kartodrome_id)
        session_data = []
        for s in sessions:
            taken = self.booking_repo.count_active_for_session(s.id)
            session_data.append({
                "session_id": s.id,
                "date": str(s.date),
                "start_time": str(s.start_time),
                "end_time": str(s.end_time),
                "max_participants": s.max_participants,
                "booked": taken,
                "available": s.max_participants - taken,
            })
        return {"kartodrome": k.name, "sessions": session_data}
