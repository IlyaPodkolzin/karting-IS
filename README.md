# KartBook — Система бронирования картинга

Полноценное клиент-серверное приложение: FastAPI backend + React frontend + PostgreSQL.

---

## Требования

| Инструмент | Версия |
|-----------|--------|
| Python | 3.10+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |
| Docker (опционально) | 24+ |

---

## Быстрый старт через Docker (рекомендуется)

```bash
# В корне проекта (папка karting/)
docker-compose up --build
```

Откройте:
- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs

---

## Ручная установка

### 1. PostgreSQL

Создайте базу данных:

```sql
CREATE DATABASE kartbook;
CREATE USER kartbook_user WITH PASSWORD 'kartbook_pass';
GRANT ALL PRIVILEGES ON DATABASE kartbook TO kartbook_user;
```

### 2. Backend

```bash
cd backend

# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Установить зависимости
pip install -r requirements.txt

# Скопировать и настроить .env
cp .env.example .env
# Отредактируйте .env — укажите DATABASE_URL, SECRET_KEY

# Запустить миграции
alembic upgrade head

# Заполнить тестовыми данными (опционально)
python scripts/seed.py

# Запустить сервер
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Скопировать и настроить .env
cp .env.example .env
# Убедитесь что VITE_API_URL=http://localhost:8000

# Запустить dev-сервер
npm run dev
```

Открыть: http://localhost:5173

---

## Демо-пользователи (после seed.py)

| Email | Пароль | Роль |
|-------|--------|------|
| admin@kartbook.ru | admin123 | Администратор |
| ivan@mail.ru | user123 | Клиент |

---

## Структура проекта

```
karting/
├── backend/
│   ├── app/
│   │   ├── main.py              # Точка входа FastAPI
│   │   ├── core/
│   │   │   ├── config.py        # Настройки приложения
│   │   │   ├── security.py      # JWT, хэширование паролей
│   │   │   └── deps.py          # Dependency injection
│   │   ├── db/
│   │   │   ├── base.py          # SQLAlchemy Base
│   │   │   └── session.py       # Сессия БД
│   │   ├── modules/             # DDD-модули (Bounded Contexts)
│   │   │   ├── auth/            # Аутентификация
│   │   │   ├── users/           # Пользователи
│   │   │   ├── kartodromes/     # Картодромы
│   │   │   ├── sessions/        # Заезды
│   │   │   ├── bookings/        # Бронирования
│   │   │   ├── laps/            # Круги
│   │   │   ├── statistics/      # Статистика (CQRS read side)
│   │   │   └── analytics/       # Аналитика (CQRS read side)
│   │   └── api/v1/             # API Gateway / Router
│   ├── alembic/                 # Миграции БД
│   ├── scripts/seed.py          # Тестовые данные
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                 # HTTP клиент + все запросы
│   │   ├── components/          # Переиспользуемые компоненты
│   │   ├── pages/               # Страницы (client + admin)
│   │   ├── hooks/               # Custom React hooks
│   │   └── types/               # TypeScript типы
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── Dockerfile
└── docker-compose.yml
```
