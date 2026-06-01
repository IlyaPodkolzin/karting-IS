from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, time


class BookingCreate(BaseModel):
    session_id: int


class BookingStatusUpdate(BaseModel):
    status: str


class SessionBrief(BaseModel):
    id: int
    kartodrome_id: int
    date: date          # proper type — Pydantic serialises date correctly
    start_time: time    # proper type — Pydantic serialises time correctly
    end_time: time
    price: float
    model_config = {"from_attributes": True}


class BookingOut(BaseModel):
    id: int
    user_id: int
    session_id: int
    kart_id: Optional[int] = None
    status: str
    total_price: float
    created_at: datetime
    updated_at: datetime
    session: Optional[SessionBrief] = None
    model_config = {"from_attributes": True}
