from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.kartodromes.models import Kartodrome

class KartodromeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[Kartodrome]:
        return self.db.query(Kartodrome).all()

    def get_by_id(self, kartodrome_id: int) -> Optional[Kartodrome]:
        return self.db.query(Kartodrome).filter(Kartodrome.id == kartodrome_id).first()

    def create(self, **kwargs) -> Kartodrome:
        k = Kartodrome(**kwargs)
        self.db.add(k)
        self.db.commit()
        self.db.refresh(k)
        return k

    def update(self, kartodrome: Kartodrome, **kwargs) -> Kartodrome:
        for key, val in kwargs.items():
            setattr(kartodrome, key, val)
        self.db.commit()
        self.db.refresh(kartodrome)
        return kartodrome

    def delete(self, kartodrome: Kartodrome):
        self.db.delete(kartodrome)
        self.db.commit()
