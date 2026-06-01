from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session as DBSession
from typing import List, Optional
from datetime import date, datetime, timedelta
import pytz

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_admin
from app.modules.sessions.repository import SessionRepository
from app.modules.bookings.repository import BookingRepository
from app.modules.sessions.schemas import SessionOut, SessionCreate
from app.modules.users.models import User

router = APIRouter(prefix="/sessions", tags=["sessions"])

MOSCOW_TZ = pytz.timezone("Europe/Moscow")


def _moscow_now():
    return datetime.now(tz=MOSCOW_TZ).replace(tzinfo=None)


@router.get("/", response_model=List[SessionOut])
def list_sessions(
    kartodrome_id: Optional[int] = Query(None),
    date: Optional[date] = Query(None),
    db: DBSession = Depends(get_db),
    _u: User = Depends(get_current_user),
):
    repo = SessionRepository(db)
    booking_repo = BookingRepository(db)
    now = _moscow_now()
    today = now.date()

    # Auto-delete sessions from yesterday and earlier (synchronous, lightweight)
    yesterday = today - timedelta(days=1)
    repo.delete_before(yesterday)

    sessions = repo.get_all(kartodrome_id=kartodrome_id, date_filter=date)
    result = []
    for s in sessions:
        taken = booking_repo.count_active_for_session(s.id)
        session_start = datetime.combine(s.date, s.start_time)
        session_end = datetime.combine(s.date, s.end_time)
        out = SessionOut.model_validate({
            "id": s.id,
            "kartodrome_id": s.kartodrome_id,
            "session_number": s.session_number,
            "session_type": s.session_type,
            "date": s.date,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "max_participants": s.max_participants,
            "price": s.price,
            "available_slots": s.max_participants - taken,
            "is_bookable": session_start > now,        # can still be booked
            "is_active": session_start <= now <= session_end,  # currently running
            "is_expired": now > session_end,            # past
        })
        result.append(out)
    return result


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: DBSession = Depends(get_db), _u: User = Depends(get_current_user)):
    s = SessionRepository(db).get_by_id(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    return s


@router.post("/", response_model=SessionOut)
def create_session(body: SessionCreate, db: DBSession = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return SessionRepository(db).create(**body.model_dump())


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: DBSession = Depends(get_db), _admin: User = Depends(get_current_admin)):
    repo = SessionRepository(db)
    s = repo.get_by_id(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    repo.delete(s)
