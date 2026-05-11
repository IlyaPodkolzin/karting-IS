from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as DBSession
from typing import List, Optional
from datetime import date
from app.db.session import get_db
from app.core.deps import get_current_user, get_current_admin
from app.modules.sessions.repository import SessionRepository
from app.modules.bookings.repository import BookingRepository
from app.modules.sessions.schemas import SessionOut, SessionCreate
from app.modules.users.models import User

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("/", response_model=List[SessionOut])
def list_sessions(
    kartodrome_id: Optional[int] = Query(None),
    date: Optional[date] = Query(None),
    db: DBSession = Depends(get_db),
    _u: User = Depends(get_current_user)
):
    repo = SessionRepository(db)
    booking_repo = BookingRepository(db)
    sessions = repo.get_all(kartodrome_id=kartodrome_id, date_filter=date)
    result = []
    for s in sessions:
        taken = booking_repo.count_active_for_session(s.id)
        out = SessionOut.model_validate(s)
        out.available_slots = s.max_participants - taken
        result.append(out)
    return result

@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: DBSession = Depends(get_db), _u: User = Depends(get_current_user)):
    from fastapi import HTTPException
    s = SessionRepository(db).get_by_id(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    return s

@router.post("/", response_model=SessionOut)
def create_session(body: SessionCreate, db: DBSession = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return SessionRepository(db).create(**body.model_dump())

@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: DBSession = Depends(get_db), _admin: User = Depends(get_current_admin)):
    from fastapi import HTTPException
    repo = SessionRepository(db)
    s = repo.get_by_id(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    repo.delete(s)
