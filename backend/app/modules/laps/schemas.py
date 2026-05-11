from pydantic import BaseModel
from datetime import datetime

class LapCreate(BaseModel):
    booking_id: int
    lap_number: int
    lap_time: float

class LapOut(BaseModel):
    id: int
    booking_id: int
    lap_number: int
    lap_time: float
    timestamp: datetime
    model_config = {"from_attributes": True}
