from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.modules.users.repository import UserRepository
from app.modules.users.models import User

class UserService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def get_me(self, user_id: int) -> User:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def update_me(self, user: User, name: str) -> User:
        return self.repo.update(user, name=name)

    def get_all(self) -> List[User]:
        return self.repo.get_all()
