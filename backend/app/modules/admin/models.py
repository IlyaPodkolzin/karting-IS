import enum
from sqlalchemy import Column, Integer, String, Enum, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class KartStatus(str, enum.Enum):
    AVAILABLE = "available"
    BOOKED = "booked"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"


class Kart(Base):
    __tablename__ = "karts"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(20), nullable=False)
    type = Column(String(50), nullable=False)
    status = Column(
        Enum(KartStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=KartStatus.AVAILABLE,
    )
    engine_type = Column(String(50))
    last_maintenance = Column(Date)
    image_url = Column(String(500))
    kartodrome_id = Column(Integer, ForeignKey("kartodromes.id"), nullable=False, index=True)

    kartodrome = relationship("Kartodrome", back_populates="karts")
    bookings = relationship("Booking", back_populates="kart")
