from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_admin
from app.modules.analytics.service import AnalyticsService
from app.modules.users.models import User

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/load")
def get_club_load(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return AnalyticsService(db).get_club_load()

@router.get("/kartodrome/{kartodrome_id}")
def get_kartodrome_load(kartodrome_id: int, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return AnalyticsService(db).get_kartodrome_load(kartodrome_id)
