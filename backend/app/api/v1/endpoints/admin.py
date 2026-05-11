from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import Query
from app.db.session import get_db
from app.core.deps import get_current_admin
from app.modules.admin.repository import KartRepository
from app.modules.admin.schemas import KartOut, KartCreate, KartStatusUpdate
from app.modules.admin.models import KartStatus
from app.modules.users.models import User

router = APIRouter(prefix="/karts", tags=["karts"])

@router.get("/", response_model=List[KartOut])
def list_karts(kartodrome_id: Optional[int] = Query(None), db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return KartRepository(db).get_all(kartodrome_id=kartodrome_id)

@router.post("/", response_model=KartOut)
def create_kart(body: KartCreate, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return KartRepository(db).create(**body.model_dump())

@router.patch("/{kart_id}/status", response_model=KartOut)
def update_kart_status(kart_id: int, body: KartStatusUpdate, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    from fastapi import HTTPException
    repo = KartRepository(db)
    kart = repo.get_by_id(kart_id)
    if not kart:
        raise HTTPException(status_code=404, detail="Kart not found")
    try:
        status = KartStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")
    return repo.update(kart, status=status)
