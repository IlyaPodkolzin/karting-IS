from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    name: str
