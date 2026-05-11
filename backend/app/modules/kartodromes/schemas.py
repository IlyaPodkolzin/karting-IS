from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class KartodromeOut(BaseModel):
    id: int
    name: str
    address: str
    latitude: Optional[float]
    longitude: Optional[float]
    description: Optional[str]
    image_url: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    working_hours: Optional[Any]
    created_at: datetime
    model_config = {"from_attributes": True}

class KartodromeCreate(BaseModel):
    name: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    working_hours: Optional[Any] = None
