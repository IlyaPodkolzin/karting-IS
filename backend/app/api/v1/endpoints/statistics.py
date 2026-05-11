from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.deps import get_current_user, get_current_admin
from app.modules.statistics.service import StatisticService
from app.modules.statistics.schemas import StatisticOut
from app.modules.users.models import User

router = APIRouter(prefix="/statistics", tags=["statistics"])

@router.get("/", response_model=List[StatisticOut])
def get_my_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return StatisticService(db).get_my_statistics(current_user.id)

@router.get("/{user_id}", response_model=List[StatisticOut])
def get_user_stats(user_id: int, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return StatisticService(db).get_user_statistics(user_id)
