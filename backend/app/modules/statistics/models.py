from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Statistic(Base):
    __tablename__ = "statistics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    kartodrome_id = Column(Integer, ForeignKey("kartodromes.id"), nullable=False, index=True)
    best_lap_time = Column(Float)
    average_lap_time = Column(Float)
    total_laps = Column(Integer, nullable=False, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "kartodrome_id", name="uq_stat_user_kartodrome"),)

    user = relationship("User", back_populates="statistics")
    kartodrome = relationship("Kartodrome", back_populates="statistics")
