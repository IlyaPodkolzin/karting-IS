import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False, index=True)
    kart_id = Column(Integer, ForeignKey("karts.id"), nullable=True)
    status = Column(Enum(BookingStatus, values_callable=lambda x: [e.value for e in x]), nullable=False, default=BookingStatus.CONFIRMED)
    total_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="bookings")
    session = relationship("Session", back_populates="bookings")
    kart = relationship("Kart", back_populates="bookings")
    laps = relationship("Lap", back_populates="booking", cascade="all, delete-orphan")
