from typing import Optional, List
from sqlalchemy.orm import Session
from app.modules.users.models import User, UserRole, ClientProfile, AdminProfile
from datetime import date

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_all(self) -> List[User]:
        return self.db.query(User).all()

    def create(self, name: str, email: str, password_hash: str, role: UserRole = UserRole.CLIENT) -> User:
        user = User(name=name, email=email, password_hash=password_hash, role=role)
        self.db.add(user)
        self.db.flush()
        if role == UserRole.CLIENT:
            self.db.add(ClientProfile(user_id=user.id))
        else:
            self.db.add(AdminProfile(user_id=user.id, hired_at=date.today()))
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User, **kwargs) -> User:
        for k, v in kwargs.items():
            setattr(user, k, v)
        self.db.commit()
        self.db.refresh(user)
        return user
