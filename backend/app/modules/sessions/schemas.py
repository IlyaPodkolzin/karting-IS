from pydantic import BaseModel
from typing import Optional
from datetime import date, time


class SessionOut(BaseModel):
    id: int
    kartodrome_id: int
    session_number: int
    session_type: str
    date: date
    start_time: time
    end_time: time
    max_participants: int
    price: float
    available_slots: Optional[int] = None
    is_bookable: Optional[bool] = None    # start_time in the future (MSK)
    is_active: Optional[bool] = None     # currently running
    is_expired: Optional[bool] = None    # already finished
    model_config = {"from_attributes": True}


class SessionCreate(BaseModel):
    kartodrome_id: int
    session_number: int
    session_type: str = "usual"
    date: date
    start_time: time
    end_time: time
    max_participants: int
    price: float
