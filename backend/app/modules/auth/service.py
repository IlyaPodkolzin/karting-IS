from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.modules.users.repository import UserRepository
from app.modules.users.models import User
from app.core.security import verify_password, get_password_hash, create_access_token

class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register(self, name: str, email: str, password: str) -> dict:
        existing = self.user_repo.get_by_email(email)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        hashed = get_password_hash(password)
        user = self.user_repo.create(name=name, email=email, password_hash=hashed)
        token = create_access_token({"sub": str(user.id), "role": user.role.value})
        return {"access_token": token, "token_type": "bearer", "user": user}

    def login(self, email: str, password: str) -> dict:
        user = self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        token = create_access_token({"sub": str(user.id), "role": user.role.value})
        return {"access_token": token, "token_type": "bearer", "user": user}
