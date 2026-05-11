from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.admin.models import Kart, KartStatus

class KartRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, kartodrome_id: Optional[int] = None) -> List[Kart]:
        q = self.db.query(Kart)
        if kartodrome_id:
            q = q.filter(Kart.kartodrome_id == kartodrome_id)
        return q.all()

    def get_by_id(self, kart_id: int) -> Optional[Kart]:
        return self.db.query(Kart).filter(Kart.id == kart_id).first()

    def get_available_for_kartodrome(self, kartodrome_id: int) -> Optional[Kart]:
        return self.db.query(Kart).filter(
            Kart.kartodrome_id == kartodrome_id,
            Kart.status == KartStatus.AVAILABLE
        ).first()

    def create(self, **kwargs) -> Kart:
        kart = Kart(**kwargs)
        self.db.add(kart)
        self.db.commit()
        self.db.refresh(kart)
        return kart

    def update(self, kart: Kart, **kwargs) -> Kart:
        for k, v in kwargs.items():
            setattr(kart, k, v)
        self.db.commit()
        self.db.refresh(kart)
        return kart
