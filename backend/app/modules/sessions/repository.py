from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session as DBSession
from app.modules.sessions.models import Session

class SessionRepository:
    def __init__(self, db: DBSession):
        self.db = db

    def get_all(self, kartodrome_id: Optional[int] = None, date_filter: Optional[date] = None) -> List[Session]:
        q = self.db.query(Session)
        if kartodrome_id:
            q = q.filter(Session.kartodrome_id == kartodrome_id)
        if date_filter:
            q = q.filter(Session.date == date_filter)
        return q.order_by(Session.date, Session.start_time).all()

    def get_by_id(self, session_id: int) -> Optional[Session]:
        return self.db.query(Session).filter(Session.id == session_id).first()

    def create(self, **kwargs) -> Session:
        s = Session(**kwargs)
        self.db.add(s)
        self.db.commit()
        self.db.refresh(s)
        return s

    def update(self, session: Session, **kwargs) -> Session:
        for k, v in kwargs.items():
            setattr(session, k, v)
        self.db.commit()
        self.db.refresh(session)
        return session

    def delete(self, session: Session):
        self.db.delete(session)
        self.db.commit()
