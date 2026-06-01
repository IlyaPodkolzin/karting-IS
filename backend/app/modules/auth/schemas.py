from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar_url: Optional[str] = None   # ← was missing; caused avatar loss on login/logout cycle
    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut
