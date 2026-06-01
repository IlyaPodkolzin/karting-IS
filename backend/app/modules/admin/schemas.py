from pydantic import BaseModel
from typing import Optional
from datetime import date


class KartOut(BaseModel):
    id: int
    number: str
    type: str
    status: str
    engine_type: Optional[str] = None
    last_maintenance: Optional[date] = None
    image_url: Optional[str] = None
    kartodrome_id: int
    model_config = {"from_attributes": True}


class KartCreate(BaseModel):
    number: str
    type: str
    engine_type: Optional[str] = None
    last_maintenance: Optional[date] = None
    kartodrome_id: int


class KartStatusUpdate(BaseModel):
    status: str
