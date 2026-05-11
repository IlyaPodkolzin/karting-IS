from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Kartodrome(Base):
    __tablename__ = "kartodromes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(Text, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    description = Column(Text)
    image_url = Column(String(500))
    phone = Column(String(20))
    email = Column(String(100))
    working_hours = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sessions = relationship("Session", back_populates="kartodrome", cascade="all, delete-orphan")
    karts = relationship("Kart", back_populates="kartodrome", cascade="all, delete-orphan")
    statistics = relationship("Statistic", back_populates="kartodrome")
