from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.deps import get_current_user, get_current_admin
from app.modules.users.service import UserService
from app.modules.users.schemas import UserOut, UserUpdateRequest
from app.modules.users.models import User

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserOut)
def update_me(body: UserUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return UserService(db).update_me(current_user, body.name)

@router.get("/", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return UserService(db).get_all()
