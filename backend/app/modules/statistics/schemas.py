from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StatisticOut(BaseModel):
    id: int
    user_id: int
    kartodrome_id: int
    best_lap_time: Optional[float]
    average_lap_time: Optional[float]
    total_laps: int
    last_updated: datetime
    model_config = {"from_attributes": True}
