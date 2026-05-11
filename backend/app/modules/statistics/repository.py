from typing import List, Optional
from sqlalchemy.orm import Session
from app.modules.statistics.models import Statistic

class StatisticRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user(self, user_id: int) -> List[Statistic]:
        return self.db.query(Statistic).filter(Statistic.user_id == user_id).all()

    def get_by_user_and_kartodrome(self, user_id: int, kartodrome_id: int) -> Optional[Statistic]:
        return self.db.query(Statistic).filter(
            Statistic.user_id == user_id,
            Statistic.kartodrome_id == kartodrome_id
        ).first()

    def get_by_user_id_for_admin(self, user_id: int) -> List[Statistic]:
        return self.db.query(Statistic).filter(Statistic.user_id == user_id).all()

    def upsert(self, user_id: int, kartodrome_id: int,
               best_lap_time: float, average_lap_time: float, total_laps: int) -> Statistic:
        stat = self.get_by_user_and_kartodrome(user_id, kartodrome_id)
        if stat:
            stat.best_lap_time = best_lap_time
            stat.average_lap_time = average_lap_time
            stat.total_laps = total_laps
        else:
            stat = Statistic(user_id=user_id, kartodrome_id=kartodrome_id,
                             best_lap_time=best_lap_time, average_lap_time=average_lap_time,
                             total_laps=total_laps)
            self.db.add(stat)
        self.db.commit()
        self.db.refresh(stat)
        return stat
