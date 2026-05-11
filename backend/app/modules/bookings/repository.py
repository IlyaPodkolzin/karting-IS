from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.bookings.models import Booking, BookingStatus

class BookingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, booking_id: int) -> Optional[Booking]:
        return self.db.query(Booking).filter(Booking.id == booking_id).first()

    def get_by_user(self, user_id: int) -> List[Booking]:
        return self.db.query(Booking).filter(Booking.user_id == user_id).order_by(Booking.created_at.desc()).all()

    def get_all(self) -> List[Booking]:
        return self.db.query(Booking).order_by(Booking.created_at.desc()).all()

    def get_by_session(self, session_id: int) -> List[Booking]:
        return self.db.query(Booking).filter(
            Booking.session_id == session_id,
            Booking.status != BookingStatus.CANCELLED
        ).all()

    def count_active_for_session(self, session_id: int) -> int:
        return self.db.query(Booking).filter(
            Booking.session_id == session_id,
            Booking.status != BookingStatus.CANCELLED
        ).count()

    def user_already_booked(self, user_id: int, session_id: int) -> bool:
        return self.db.query(Booking).filter(
            Booking.user_id == user_id,
            Booking.session_id == session_id,
            Booking.status != BookingStatus.CANCELLED
        ).first() is not None

    def create(self, user_id: int, session_id: int, total_price: float, kart_id: Optional[int] = None) -> Booking:
        b = Booking(user_id=user_id, session_id=session_id, total_price=total_price, kart_id=kart_id)
        self.db.add(b)
        self.db.commit()
        self.db.refresh(b)
        return b

    def update_status(self, booking: Booking, status: BookingStatus) -> Booking:
        booking.status = status
        self.db.commit()
        self.db.refresh(booking)
        return booking
