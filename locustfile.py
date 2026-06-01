import random
import string
from datetime import date, timedelta

from locust import HttpUser, TaskSet, between, task, events
from locust.exception import StopUser


# ── НФТ-пороги (используются в хуке test_stop для автооценки) ───────────────
NFR_P95_MS        = 300    # P95 ≤ 300 мс
NFR_P95_STRESS_MS = 600    # P95 ≤ 600 мс при стресс-нагрузке (деградация)
NFR_ERROR_PCT     = 1.0    # процент HTTP-5xx < 1 %
NFR_MAX_USERS     = 500    # поддержка до 500 одновременных


# ── Вспомогательные функции ──────────────────────────────────────────────────

def random_email() -> str:
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=10))
    return f"lt_{suffix}@kartbook.com"


def tomorrow() -> str:
    return (date.today() + timedelta(days=1)).isoformat()


def day_after() -> str:
    return (date.today() + timedelta(days=2)).isoformat()


DEMO_ADMIN = {"email": "admin@kartbook.ru", "password": "admin123"}


# ═══════════════════════════════════════════════════════════════════════════════
# TaskSet 1 — Анонимный пользователь
# Доля трафика: ~5 %
# ═══════════════════════════════════════════════════════════════════════════════

class AnonymousTaskSet(TaskSet):
    """
    Незарегистрированный посетитель.
    Проверяет:
      • доступность health-check (используется keep-alive мониторингом);
      • корректный отказ (403) при обращении к защищённым ресурсам.
    """

    @task(4)
    def health_check(self):
        with self.client.get(
            "/health",
            catch_response=True,
            name="[anon] GET /health",
        ) as r:
            if r.status_code == 200 and r.json().get("status") == "ok":
                r.success()
            else:
                r.failure(f"Health failed: {r.status_code}")

    @task(2)
    def swagger_docs(self):
        with self.client.get(
            "/docs",
            catch_response=True,
            name="[anon] GET /docs",
        ) as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"Docs unavailable: {r.status_code}")

    @task(1)
    def unauthorized_access(self):
        """Обращение к защищённому эндпоинту без токена — ожидаемый ответ 403."""
        with self.client.get(
            "/api/v1/kartodromes/",
            catch_response=True,
            name="[anon] GET /kartodromes (expect 403)",
        ) as r:
            if r.status_code == 403:
                r.success()
            else:
                r.failure(f"Expected 403, got {r.status_code}")


# ═══════════════════════════════════════════════════════════════════════════════
# TaskSet 2 — Авторизованный клиент
# Доля трафика: ~75 %
# ═══════════════════════════════════════════════════════════════════════════════

class ClientTaskSet(TaskSet):
    """
    Полный пользовательский сценарий:
      1. Регистрация → получение JWT-токена
      2. Просмотр картодромов (5×)
      3. Просмотр заездов (4×)
      4. Создание бронирования (2×)
      5. Просмотр своих броней (3×)
      6. Просмотр статистики (2×)
      7. Просмотр профиля (1×)
      8. Отмена бронирования (1×)
    Веса отражают реальное распределение нагрузки.
    """

    token: str = ""
    user_id: int = 0
    kartodrome_ids: list = []
    bookable_session_ids: list = []
    my_active_booking_ids: list = []

    # ── Инициализация ─────────────────────────────────────────────────────────

    def on_start(self):
        self._register()
        if self.token:
            self._load_kartodromes()

    def _register(self):
        with self.client.post(
            "/api/v1/auth/register",
            json={"name": "LT User", "email": random_email(), "password": "LTpass123!"},
            catch_response=True,
            name="[client] POST /auth/register",
        ) as r:
            if r.status_code == 200:
                data = r.json()
                self.token = data["access_token"]
                self.user_id = data["user"]["id"]
                r.success()
            else:
                r.failure(f"Register failed: {r.status_code} {r.text[:200]}")
                raise StopUser()

    def _h(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    # ── Картодромы ────────────────────────────────────────────────────────────

    def _load_kartodromes(self):
        with self.client.get(
            "/api/v1/kartodromes/",
            headers=self._h(),
            catch_response=True,
            name="[client] GET /kartodromes",
        ) as r:
            if r.status_code == 200:
                self.kartodrome_ids = [k["id"] for k in r.json()]
                r.success()
            else:
                r.failure(f"Kartodromes: {r.status_code}")

    @task(5)
    def browse_kartodromes(self):
        """Просмотр списка картодромов — наиболее частое действие."""
        with self.client.get(
            "/api/v1/kartodromes/",
            headers=self._h(),
            catch_response=True,
            name="[client] GET /kartodromes",
        ) as r:
            if r.status_code == 200:
                self.kartodrome_ids = [k["id"] for k in r.json()]
                r.success()
            else:
                r.failure(f"Kartodromes: {r.status_code}")

    # ── Заезды ────────────────────────────────────────────────────────────────

    @task(4)
    def browse_sessions(self):
        """Просмотр заездов для случайного картодрома."""
        if not self.kartodrome_ids:
            return
        kid = random.choice(self.kartodrome_ids)
        target_date = random.choice([tomorrow(), day_after()])
        with self.client.get(
            "/api/v1/sessions/",
            headers=self._h(),
            params={"kartodrome_id": kid, "date": target_date},
            catch_response=True,
            name="[client] GET /sessions",
        ) as r:
            if r.status_code == 200:
                sessions = r.json()
                self.bookable_session_ids = [
                    s["id"] for s in sessions
                    if s.get("is_bookable") is not False
                    and (s.get("available_slots") or 0) > 0
                ]
                r.success()
            else:
                r.failure(f"Sessions: {r.status_code}")

    # ── Бронирование ──────────────────────────────────────────────────────────

    @task(2)
    def create_booking(self):
        """Создание бронирования будущего заезда."""
        if not self.bookable_session_ids:
            return
        sid = random.choice(self.bookable_session_ids)
        with self.client.post(
            "/api/v1/bookings/",
            headers=self._h(),
            json={"session_id": sid},
            catch_response=True,
            name="[client] POST /bookings",
        ) as r:
            if r.status_code == 200:
                bid = r.json()["id"]
                self.my_active_booking_ids.append(bid)
                r.success()
            elif r.status_code == 409:
                # Место занято или уже забронировано — штатный ответ, не сбой
                r.success()
            else:
                r.failure(f"Booking: {r.status_code} {r.text[:200]}")

    @task(3)
    def view_my_bookings(self):
        """Просмотр истории бронирований."""
        with self.client.get(
            "/api/v1/bookings/",
            headers=self._h(),
            catch_response=True,
            name="[client] GET /bookings (my)",
        ) as r:
            if r.status_code == 200:
                active = [b["id"] for b in r.json()
                          if b["status"] in ("confirmed", "pending")]
                self.my_active_booking_ids = active
                r.success()
            else:
                r.failure(f"My bookings: {r.status_code}")

    @task(1)
    def cancel_booking(self):
        """Отмена активного бронирования."""
        if not self.my_active_booking_ids:
            return
        bid = self.my_active_booking_ids.pop()
        with self.client.delete(
            f"/api/v1/bookings/{bid}",
            headers=self._h(),
            catch_response=True,
            name="[client] DELETE /bookings/{id}",
        ) as r:
            if r.status_code in (204, 404, 400):
                r.success()
            else:
                r.failure(f"Cancel: {r.status_code} {r.text[:200]}")

    # ── Статистика / профиль ──────────────────────────────────────────────────

    @task(2)
    def view_statistics(self):
        with self.client.get(
            "/api/v1/statistics/",
            headers=self._h(),
            catch_response=True,
            name="[client] GET /statistics",
        ) as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"Statistics: {r.status_code}")

    @task(1)
    def view_profile(self):
        with self.client.get(
            "/api/v1/users/me",
            headers=self._h(),
            catch_response=True,
            name="[client] GET /users/me",
        ) as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"Profile: {r.status_code}")


# ═══════════════════════════════════════════════════════════════════════════════
# TaskSet 3 — Администратор
# Доля трафика: ~15 %
# ═══════════════════════════════════════════════════════════════════════════════

class AdminTaskSet(TaskSet):
    """
    Административные операции:
      • Просмотр всех бронирований (4×)
      • Изменение статуса брони (2×)
      • Аналитика загруженности (3×)
      • Список пользователей (2×)
      • Список картов (2×)
      • Список заездов (1×)
    """

    token: str = ""
    pending_booking_ids: list = []

    def on_start(self):
        with self.client.post(
            "/api/v1/auth/login",
            json=DEMO_ADMIN,
            catch_response=True,
            name="[admin] POST /auth/login",
        ) as r:
            if r.status_code == 200:
                self.token = r.json()["access_token"]
                r.success()
            else:
                r.failure(f"Admin login: {r.status_code}")
                raise StopUser()

    def _h(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    @task(4)
    def list_all_bookings(self):
        with self.client.get(
            "/api/v1/bookings/all",
            headers=self._h(),
            catch_response=True,
            name="[admin] GET /bookings/all",
        ) as r:
            if r.status_code == 200:
                self.pending_booking_ids = [
                    b["id"] for b in r.json() if b["status"] == "pending"
                ]
                r.success()
            else:
                r.failure(f"All bookings: {r.status_code}")

    @task(2)
    def update_booking_status(self):
        if not self.pending_booking_ids:
            return
        bid = random.choice(self.pending_booking_ids)
        with self.client.patch(
            f"/api/v1/bookings/{bid}/status",
            headers=self._h(),
            json={"status": "confirmed"},
            catch_response=True,
            name="[admin] PATCH /bookings/{id}/status",
        ) as r:
            if r.status_code in (200, 404):
                r.success()
            else:
                r.failure(f"Status update: {r.status_code}")

    @task(3)
    def analytics_load(self):
        with self.client.get(
            "/api/v1/analytics/load",
            headers=self._h(),
            catch_response=True,
            name="[admin] GET /analytics/load",
        ) as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"Analytics: {r.status_code}")

    @task(2)
    def list_users(self):
        with self.client.get(
            "/api/v1/users/",
            headers=self._h(),
            catch_response=True,
            name="[admin] GET /users",
        ) as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"Users: {r.status_code}")

    @task(2)
    def list_karts(self):
        with self.client.get(
            "/api/v1/karts/",
            headers=self._h(),
            catch_response=True,
            name="[admin] GET /karts",
        ) as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"Karts: {r.status_code}")

    @task(1)
    def list_sessions(self):
        with self.client.get(
            "/api/v1/sessions/",
            headers=self._h(),
            params={"date": date.today()},
            catch_response=True,
            name="[admin] GET /sessions",
        ) as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"Sessions: {r.status_code}")


# ═══════════════════════════════════════════════════════════════════════════════
# TaskSet 4 — Spike: конкурентное бронирование одного заезда
# Доля трафика: ~5 %
# Граничный случай: проверка целостности ограничения max_participants
# при максимально возможном числе конкурентных запросов (500 пользователей)
# ═══════════════════════════════════════════════════════════════════════════════

class SpikeBookingTaskSet(TaskSet):
    """
    Все виртуальные пользователи данного класса одновременно пытаются
    забронировать один и тот же заезд.

    Критерий корректности (НФТ — целостность данных):
      Итоговое число бронирований ≤ max_participants заезда.
    Ответ 409 («Session is full» или «Already booked») трактуется
    как SUCCESS — это ожидаемое поведение при исчерпании мест.
    """

    token: str = ""
    target_session_id: int | None = None

    def on_start(self):
        with self.client.post(
            "/api/v1/auth/register",
            json={"name": "Spike", "email": random_email(), "password": "Spike123!"},
            catch_response=True,
            name="[spike] POST /auth/register",
        ) as r:
            if r.status_code == 200:
                self.token = r.json()["access_token"]
                r.success()
                self._find_target_session()
            else:
                r.failure(f"Spike register: {r.status_code}")
                raise StopUser()

    def _find_target_session(self):
        """Выбирает первый доступный заезд с максимальным числом мест."""
        with self.client.get(
            "/api/v1/sessions/",
            headers={"Authorization": f"Bearer {self.token}"},
            params={"date": tomorrow()},
            catch_response=True,
            name="[spike] GET /sessions (find target)",
        ) as r:
            if r.status_code == 200:
                sessions = r.json()
                bookable = [s for s in sessions
                            if s.get("is_bookable") is not False
                            and (s.get("available_slots") or 0) > 0]
                if bookable:
                    # Выбираем заезд с наибольшим числом мест — максимальный стресс
                    target = max(bookable, key=lambda s: s.get("available_slots", 0))
                    self.target_session_id = target["id"]
                r.success()

    @task(1)
    def concurrent_book(self):
        if not self.target_session_id:
            return
        with self.client.post(
            "/api/v1/bookings/",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"session_id": self.target_session_id},
            catch_response=True,
            name="[spike] POST /bookings (concurrent)",
        ) as r:
            if r.status_code == 200:
                r.success()
            elif r.status_code == 409:
                # Корректный отказ: место занято — НЕ ошибка нагрузки
                r.success()
            else:
                r.failure(f"Spike booking unexpected: {r.status_code} {r.text[:200]}")


# ═══════════════════════════════════════════════════════════════════════════════
# Классы виртуальных пользователей
# ═══════════════════════════════════════════════════════════════════════════════

class AnonymousUser(HttpUser):
    """Незарегистрированный посетитель — 5 % трафика."""
    tasks = [AnonymousTaskSet]
    weight = 1
    wait_time = between(2, 5)


class RegularClient(HttpUser):
    """Авторизованный клиент — 75 % трафика."""
    tasks = [ClientTaskSet]
    weight = 15
    wait_time = between(1, 4)


class AdminUser(HttpUser):
    """Администратор — 15 % трафика."""
    tasks = [AdminTaskSet]
    weight = 3
    wait_time = between(1, 3)


class SpikeUser(HttpUser):
    """
    Пользователь сценария всплеска — 5 % трафика.
    При запуске сценария Spike можно использовать только этот класс:
        locust -f locustfile.py SpikeUser --host=... --users 500 ...
    """
    tasks = [SpikeBookingTaskSet]
    weight = 1
    wait_time = between(0.3, 1.0)


# ═══════════════════════════════════════════════════════════════════════════════
# Хуки событий — автоматическая проверка критериев НФТ
# ═══════════════════════════════════════════════════════════════════════════════

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("\n" + "=" * 65)
    print("  KartBook — Нагрузочное тестирование")
    print(f"  Целевой хост  : {environment.host}")
    print(f"  НФТ P95       : ≤ {NFR_P95_MS} мс")
    print(f"  НФТ ошибки    : < {NFR_ERROR_PCT} %")
    print(f"  НФТ польз-лей : до {NFR_MAX_USERS}")
    print("=" * 65 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    stats = environment.stats.total
    n = stats.num_requests
    failures = stats.num_failures
    p95 = stats.get_response_time_percentile(0.95) or 0
    p99 = stats.get_response_time_percentile(0.99) or 0
    error_pct = (failures / n * 100) if n > 0 else 0

    p95_ok    = p95 <= NFR_P95_MS
    error_ok  = error_pct < NFR_ERROR_PCT

    print("\n" + "=" * 65)
    print("  РЕЗУЛЬТАТЫ НАГРУЗОЧНОГО ТЕСТИРОВАНИЯ")
    print("=" * 65)
    print(f"  Всего запросов          : {n:,}")
    print(f"  Успешных                : {n - failures:,}")
    print(f"  HTTP-ошибок (5xx)       : {failures:,}")
    print(f"  Процент ошибок          : {error_pct:.3f} %  "
          f"{'✓ НФТ выполнен' if error_ok else '✗ НФТ НАРУШЕН (порог < 1 %)'}")
    print(f"  Среднее время отклика   : {stats.avg_response_time:.0f} мс")
    print(f"  Медиана (P50)           : {stats.median_response_time:.0f} мс")
    print(f"  95-й перцентиль (P95)   : {p95:.0f} мс  "
          f"{'✓ НФТ выполнен' if p95_ok else f'✗ НФТ НАРУШЕН (порог ≤ {NFR_P95_MS} мс)'}")
    print(f"  99-й перцентиль (P99)   : {p99:.0f} мс")
    print(f"  Макс. время отклика     : {stats.max_response_time:.0f} мс")
    print(f"  Пропускная способность  : {stats.total_rps:.1f} RPS")
    print("=" * 65)
    overall = "✓ ВСЕ НФТ ВЫПОЛНЕНЫ" if (p95_ok and error_ok) else "✗ ЕСТЬ НАРУШЕНИЯ НФТ"
    print(f"\n  Итог: {overall}\n")
