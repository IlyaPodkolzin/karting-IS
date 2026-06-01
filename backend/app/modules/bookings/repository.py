from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.modules.bookings.models import Booking, BookingStatus


class BookingRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        # Always eagerly load the related session so BookingOut.session is populated
        return self.db.query(Booking).options(joinedload(Booking.session))

    def get_by_id(self, booking_id: int) -> Optional[Booking]:
        return self._base_query().filter(Booking.id == booking_id).first()

    def get_by_user(self, user_id: int) -> List[Booking]:
        return (
            self._base_query()
            .filter(Booking.user_id == user_id)
            .order_by(Booking.created_at.desc())
            .all()
        )

    def get_all(self) -> List[Booking]:
        return self._base_query().order_by(Booking.created_at.desc()).all()

    def get_by_session(self, session_id: int) -> List[Booking]:
        return (
            self.db.query(Booking)
            .filter(Booking.session_id == session_id, Booking.status != BookingStatus.CANCELLED)
            .all()
        )

    def count_active_for_session(self, session_id: int) -> int:
        return (
            self.db.query(Booking)
            .filter(Booking.session_id == session_id, Booking.status != BookingStatus.CANCELLED)
            .count()
        )

    def user_already_booked(self, user_id: int, session_id: int) -> bool:
        return (
            self.db.query(Booking)
            .filter(
                Booking.user_id == user_id,
                Booking.session_id == session_id,
                Booking.status != BookingStatus.CANCELLED,
            )
            .first()
            is not None
        )

    def create(self, user_id: int, session_id: int, total_price: float, kart_id: Optional[int] = None) -> Booking:
        b = Booking(user_id=user_id, session_id=session_id, total_price=total_price, kart_id=kart_id)
        self.db.add(b)
        self.db.commit()
        self.db.refresh(b)
        # Re-fetch with session eager-loaded
        return self.get_by_id(b.id)  # type: ignore[return-value]

    def update_status(self, booking: Booking, status: BookingStatus) -> Booking:
        booking.status = status
        self.db.commit()
        self.db.refresh(booking)
        return self.get_by_id(booking.id)  # type: ignore[return-value]
