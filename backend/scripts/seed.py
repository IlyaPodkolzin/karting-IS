"""Seed database with demo data."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import date, time, datetime, timedelta
from app.db.session import SessionLocal
from app.modules.users.models import User, UserRole, ClientProfile, AdminProfile
from app.modules.kartodromes.models import Kartodrome
from app.modules.sessions.models import Session, SessionType
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.laps.models import Lap
from app.modules.statistics.models import Statistic
from app.modules.admin.models import Kart, KartStatus
from app.core.security import get_password_hash

def seed():
    db = SessionLocal()
    try:
        if db.query(User).first():
            print("Database already seeded, skipping.")
            return

        # Users
        admin = User(name="Алексей Смирнов", email="admin@kartbook.ru",
                     password_hash=get_password_hash("admin123"), role=UserRole.ADMIN)
        client = User(name="Иван Петров", email="ivan@mail.ru",
                      password_hash=get_password_hash("user123"), role=UserRole.CLIENT)
        db.add_all([admin, client])
        db.flush()

        db.add(AdminProfile(user_id=admin.id, position="Управляющий", hired_at=date(2023, 1, 1)))
        db.add(ClientProfile(user_id=client.id, phone="+7 999 123-45-67"))

        # Kartodromes
        k1 = Kartodrome(name="Трасса «Красный Октябрь»", address="Москва, ул. Промышленная, 12",
                        latitude=55.751, longitude=37.618, phone="+7 495 123-45-67",
                        email="red@kartbook.ru", description="Профессиональная трасса длиной 650 м с 12 поворотами.",
                        working_hours={"weekdays": "10:00–22:00", "weekends": "09:00–23:00"})
        k2 = Kartodrome(name="«Скорость» Indoor", address="Москва, Ленинградский пр-т, 45",
                        latitude=55.793, longitude=37.530, phone="+7 499 987-65-43",
                        email="speed@kartbook.ru", description="Крытая трасса 400 м. Работаем круглый год.",
                        working_hours={"weekdays": "11:00–23:00", "weekends": "10:00–00:00"})
        k3 = Kartodrome(name="Картинг-центр «Пит-Стоп»", address="МО, г. Химки, Спортивная, 3",
                        latitude=55.889, longitude=37.412, phone="+7 498 765-43-21",
                        email="pitstop@kartbook.ru", description="Самая длинная трасса Подмосковья — 800 м.",
                        working_hours={"weekdays": "10:00–21:00", "weekends": "09:00–22:00"})
        db.add_all([k1, k2, k3])
        db.flush()

        # Karts
        karts_data = [
            ("K-01", "Взрослый", KartStatus.AVAILABLE, "Бензин", k1.id),
            ("K-02", "Взрослый", KartStatus.AVAILABLE, "Бензин", k1.id),
            ("K-03", "Взрослый", KartStatus.MAINTENANCE, "Бензин", k1.id),
            ("K-04", "Детский", KartStatus.AVAILABLE, "Электро", k1.id),
            ("S-01", "Взрослый", KartStatus.AVAILABLE, "Бензин", k2.id),
            ("S-02", "Взрослый", KartStatus.AVAILABLE, "Бензин", k2.id),
            ("P-01", "Взрослый", KartStatus.AVAILABLE, "Бензин", k3.id),
        ]
        kart_objs = [Kart(number=n, type=t, status=s, engine_type=e, kartodrome_id=kid)
                     for n, t, s, e, kid in karts_data]
        db.add_all(kart_objs)
        db.flush()

        # Sessions
        today = date.today()
        tomorrow = today + timedelta(days=1)
        sessions = [
            Session(kartodrome_id=k1.id, session_number=1, session_type=SessionType.USUAL,
                    date=today, start_time=time(10, 0), end_time=time(10, 20), max_participants=8, price=1200),
            Session(kartodrome_id=k1.id, session_number=2, session_type=SessionType.USUAL,
                    date=today, start_time=time(10, 30), end_time=time(10, 50), max_participants=8, price=1200),
            Session(kartodrome_id=k1.id, session_number=3, session_type=SessionType.USUAL,
                    date=today, start_time=time(11, 0), end_time=time(11, 20), max_participants=8, price=1200),
            Session(kartodrome_id=k1.id, session_number=4, session_type=SessionType.KIDS,
                    date=today, start_time=time(12, 0), end_time=time(12, 20), max_participants=6, price=800),
            Session(kartodrome_id=k1.id, session_number=5, session_type=SessionType.USUAL,
                    date=today, start_time=time(14, 0), end_time=time(14, 20), max_participants=8, price=1200),
            Session(kartodrome_id=k1.id, session_number=1, session_type=SessionType.USUAL,
                    date=tomorrow, start_time=time(10, 0), end_time=time(10, 20), max_participants=8, price=1200),
            Session(kartodrome_id=k2.id, session_number=1, session_type=SessionType.USUAL,
                    date=today, start_time=time(11, 0), end_time=time(11, 20), max_participants=6, price=1500),
            Session(kartodrome_id=k2.id, session_number=2, session_type=SessionType.USUAL,
                    date=today, start_time=time(12, 0), end_time=time(12, 20), max_participants=6, price=1500),
            Session(kartodrome_id=k3.id, session_number=1, session_type=SessionType.USUAL,
                    date=today, start_time=time(10, 0), end_time=time(10, 20), max_participants=10, price=1000),
        ]
        db.add_all(sessions)
        db.flush()

        # A completed booking with laps for demo stats
        b1 = Booking(user_id=client.id, session_id=sessions[0].id, kart_id=kart_objs[0].id,
                     status=BookingStatus.COMPLETED, total_price=1200)
        b2 = Booking(user_id=client.id, session_id=sessions[6].id, kart_id=kart_objs[4].id,
                     status=BookingStatus.COMPLETED, total_price=1500)
        b3 = Booking(user_id=client.id, session_id=sessions[1].id, kart_id=kart_objs[1].id,
                     status=BookingStatus.CONFIRMED, total_price=1200)
        db.add_all([b1, b2, b3])
        db.flush()

        lap_data = [
            (b1.id, 1, 42.3), (b1.id, 2, 40.1), (b1.id, 3, 39.8),
            (b1.id, 4, 38.9), (b1.id, 5, 38.2),
            (b2.id, 1, 55.1), (b2.id, 2, 52.4), (b2.id, 3, 51.0),
        ]
        for bid, num, lt in lap_data:
            db.add(Lap(booking_id=bid, lap_number=num, lap_time=lt))
        db.flush()

        # Pre-calculated statistics
        db.add(Statistic(user_id=client.id, kartodrome_id=k1.id,
                         best_lap_time=38.2, average_lap_time=39.86, total_laps=5))
        db.add(Statistic(user_id=client.id, kartodrome_id=k2.id,
                         best_lap_time=51.0, average_lap_time=52.83, total_laps=3))
        db.commit()
        print("Seed complete.")
    except Exception as e:
        db.rollback()
        print(f"Seed error (may already be seeded): {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
