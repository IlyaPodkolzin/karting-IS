import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class UserRole(str, enum.Enum):
    CLIENT = "client"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CLIENT)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    client_profile = relationship("ClientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    admin_profile = relationship("AdminProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user")
    statistics = relationship("Statistic", back_populates="user")

class ClientProfile(Base):
    __tablename__ = "client_profiles"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    phone = Column(String(20))
    license_number = Column(String(50))
    user = relationship("User", back_populates="client_profile")

class AdminProfile(Base):
    __tablename__ = "admin_profiles"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    position = Column(String(100), nullable=False, default="Администратор")
    hired_at = Column(Date, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    work_phone = Column(String(20))
    user = relationship("User", back_populates="admin_profile")
