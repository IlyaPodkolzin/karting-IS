import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, Date, Time, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class SessionType(str, enum.Enum):
    USUAL = "usual"
    KIDS = "kids"

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    kartodrome_id = Column(Integer, ForeignKey("kartodromes.id"), nullable=False, index=True)
    session_number = Column(Integer, nullable=False)
    session_type = Column(Enum(SessionType), nullable=False, default=SessionType.USUAL)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    max_participants = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    kartodrome = relationship("Kartodrome", back_populates="sessions")
    bookings = relationship("Booking", back_populates="session")
