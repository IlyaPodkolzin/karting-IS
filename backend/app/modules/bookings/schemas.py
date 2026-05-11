from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BookingCreate(BaseModel):
    session_id: int

class BookingStatusUpdate(BaseModel):
    status: str

class SessionBrief(BaseModel):
    id: int
    kartodrome_id: int
    date: object
    start_time: object
    end_time: object
    price: float
    model_config = {"from_attributes": True}

class BookingOut(BaseModel):
    id: int
    user_id: int
    session_id: int
    kart_id: Optional[int]
    status: str
    total_price: float
    created_at: datetime
    updated_at: datetime
    session: Optional[SessionBrief] = None
    model_config = {"from_attributes": True}
