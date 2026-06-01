"""
Image upload endpoint — mock Selectel S3.
Files are stored in /app/uploads/ and served at /uploads/<filename>.
In production, swap the save logic for Selectel S3 SDK calls.
"""
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.modules.users.models import User
from app.modules.kartodromes.repository import KartodromeRepository
from app.modules.admin.repository import KartRepository
from app.modules.users.repository import UserRepository

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = "/app/uploads"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 5


def _save_file(file: UploadFile) -> str:
    """Save uploaded file, return public URL path."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}. Allowed: jpg, png, webp, gif")

    data = file.file.read()
    if len(data) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_SIZE_MB} MB.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(data)

    # TODO (production): upload `data` to Selectel S3, return CDN URL
    return f"/uploads/{filename}"


@router.post("/kartodrome/{kartodrome_id}")
def upload_kartodrome_image(
    kartodrome_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _u: User = Depends(get_current_user),
):
    repo = KartodromeRepository(db)
    k = repo.get_by_id(kartodrome_id)
    if not k:
        raise HTTPException(status_code=404, detail="Kartodrome not found")
    url = _save_file(file)
    repo.update(k, image_url=url)
    return {"image_url": url}


@router.post("/kart/{kart_id}")
def upload_kart_image(
    kart_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _u: User = Depends(get_current_user),
):
    repo = KartRepository(db)
    kart = repo.get_by_id(kart_id)
    if not kart:
        raise HTTPException(status_code=404, detail="Kart not found")
    url = _save_file(file)
    repo.update(kart, image_url=url)
    return {"image_url": url}


@router.post("/user/{user_id}")
def upload_user_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Users can only update their own avatar; admins can update anyone's
    if current_user.id != user_id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    url = _save_file(file)
    repo.update(user, avatar_url=url)
    return {"image_url": url}
