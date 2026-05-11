from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.modules.bookings.repository import BookingRepository
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.sessions.repository import SessionRepository
from app.modules.admin.repository import KartRepository
from app.modules.statistics.service import StatisticService

class BookingService:
    def __init__(self, db: Session):
        self.booking_repo = BookingRepository(db)
        self.session_repo = SessionRepository(db)
        self.kart_repo = KartRepository(db)
        self.stat_service = StatisticService(db)

    def create_booking(self, user_id: int, session_id: int) -> Booking:
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if self.booking_repo.user_already_booked(user_id, session_id):
            raise HTTPException(status_code=409, detail="Already booked this session")
        active = self.booking_repo.count_active_for_session(session_id)
        if active >= session.max_participants:
            raise HTTPException(status_code=409, detail="Session is full")
        kart = self.kart_repo.get_available_for_kartodrome(session.kartodrome_id)
        booking = self.booking_repo.create(
            user_id=user_id,
            session_id=session_id,
            total_price=session.price,
            kart_id=kart.id if kart else None
        )
        return booking

    def cancel_booking(self, booking_id: int, user_id: int) -> Booking:
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        if booking.status not in (BookingStatus.PENDING, BookingStatus.CONFIRMED):
            raise HTTPException(status_code=400, detail="Cannot cancel this booking")
        return self.booking_repo.update_status(booking, BookingStatus.CANCELLED)

    def get_user_bookings(self, user_id: int) -> List[Booking]:
        return self.booking_repo.get_by_user(user_id)

    def get_all_bookings(self) -> List[Booking]:
        return self.booking_repo.get_all()

    def admin_update_status(self, booking_id: int, new_status: BookingStatus) -> Booking:
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        updated = self.booking_repo.update_status(booking, new_status)
        if new_status == BookingStatus.COMPLETED:
            self.stat_service.recalculate_for_booking(booking)
        return updated
