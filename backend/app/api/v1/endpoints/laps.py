from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.core.deps import get_current_user
from app.modules.laps.service import LapService
from app.modules.laps.schemas import LapCreate, LapOut
from app.modules.users.models import User

router = APIRouter(prefix="/laps", tags=["laps"])

@router.post("/", response_model=LapOut, status_code=201)
def add_lap(body: LapCreate, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    return LapService(db).add_lap(body.booking_id, body.lap_number, body.lap_time)

@router.get("/", response_model=List[LapOut])
def get_laps(booking_id: int = Query(...), db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    return LapService(db).get_laps_for_booking(booking_id)
