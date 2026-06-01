from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.deps import get_current_user, get_current_admin
from app.modules.bookings.service import BookingService
from app.modules.bookings.schemas import BookingCreate, BookingOut, BookingStatusUpdate
from app.modules.bookings.models import BookingStatus
from app.modules.users.models import User

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.post("/", response_model=BookingOut)
def create_booking(body: BookingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return BookingService(db).create_booking(current_user.id, body.session_id)

@router.get("/", response_model=List[BookingOut])
def get_my_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return BookingService(db).get_user_bookings(current_user.id)

# IMPORTANT: /all must be registered BEFORE /{booking_id} to avoid being matched as an integer path param
@router.get("/all", response_model=List[BookingOut])
def get_all_bookings(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return BookingService(db).get_all_bookings()

@router.patch("/{booking_id}/status", response_model=BookingOut)
def update_booking_status(
    booking_id: int,
    body: BookingStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    try:
        status = BookingStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")
    return BookingService(db).admin_update_status(booking_id, status)

@router.delete("/{booking_id}", status_code=204)
def cancel_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    BookingService(db).cancel_booking(booking_id, current_user.id)
