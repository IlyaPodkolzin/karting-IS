from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.db.session import get_db
from app.core.deps import get_current_user, get_current_admin
from app.modules.kartodromes.repository import KartodromeRepository
from app.modules.sessions.repository import SessionRepository
from app.modules.bookings.repository import BookingRepository
from app.modules.kartodromes.schemas import KartodromeOut, KartodromeCreate
from app.modules.sessions.schemas import SessionOut, SessionCreate
from app.modules.users.models import User

router = APIRouter(prefix="/kartodromes", tags=["kartodromes"])

@router.get("/", response_model=List[KartodromeOut])
def list_kartodromes(db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    return KartodromeRepository(db).get_all()

@router.get("/{kartodrome_id}", response_model=KartodromeOut)
def get_kartodrome(kartodrome_id: int, db: Session = Depends(get_db), _u: User = Depends(get_current_user)):
    from fastapi import HTTPException
    k = KartodromeRepository(db).get_by_id(kartodrome_id)
    if not k:
        raise HTTPException(status_code=404, detail="Not found")
    return k

@router.post("/", response_model=KartodromeOut)
def create_kartodrome(body: KartodromeCreate, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return KartodromeRepository(db).create(**body.model_dump())

@router.put("/{kartodrome_id}", response_model=KartodromeOut)
def update_kartodrome(kartodrome_id: int, body: KartodromeCreate, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    from fastapi import HTTPException
    repo = KartodromeRepository(db)
    k = repo.get_by_id(kartodrome_id)
    if not k:
        raise HTTPException(status_code=404, detail="Not found")
    return repo.update(k, **body.model_dump())
