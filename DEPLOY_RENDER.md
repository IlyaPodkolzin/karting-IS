# Развёртывание KartBook на Render.com

Полная пошаговая инструкция для бесплатного плана Render.com.

---

## Содержание

1. [Подготовка репозитория](#1-подготовка-репозитория)
2. [Создание PostgreSQL базы данных](#2-создание-postgresql-базы-данных)
3. [Развёртывание Backend (Web Service)](#3-развёртывание-backend-web-service)
4. [Развёртывание Frontend (Static Site)](#4-развёртывание-frontend-static-site)
5. [Настройка переменных окружения](#5-настройка-переменных-окружения)
6. [Проверка работоспособности](#6-проверка-работоспособности)
7. [Минимизация холодных стартов](#7-минимизация-холодных-стартов)

---

## 1. Подготовка репозитория

### 1.1 Создайте репозиторий на GitHub

1. Перейдите на https://github.com → **New repository**.
2. Имя: `kartbook` (или любое другое).
3. Видимость: **Public** (бесплатный Render требует публичный репозиторий для Free-плана).
4. Нажмите **Create repository**.

### 1.2 Загрузите код

```bash
cd karting/
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kartbook.git
git push -u origin main
```

> **Важно:** файлы `.env` уже указаны в `.gitignore` — они **не попадут** в репозиторий.
> Никогда не коммитьте файлы с реальными секретами.

---

## 2. Создание PostgreSQL базы данных

Render предоставляет **бесплатный PostgreSQL** (90 дней, затем платный или пересоздание).

1. Войдите на https://dashboard.render.com.
2. Нажмите **New +** → **PostgreSQL**.
3. Заполните форму:
   - **Name:** `kartbook-db`
   - **Database:** `kartbook`
   - **User:** `kartbook_user`
   - **Region:** выберите ближайший к вам (Frankfurt для России)
   - **Plan:** **Free**
4. Нажмите **Create Database**.
5. После создания (≈1 мин) перейдите на страницу БД и скопируйте:
   - **Internal Database URL** — для backend (используется внутри Render)
   - **External Database URL** — для локального доступа (опционально)

Формат Internal URL:
```
postgresql://kartbook_user:PASSWORD@dpg-XXXX.oregon-postgres.render.com/kartbook
```

Сохраните этот URL — он понадобится в шаге 5.

---

## 3. Развёртывание Backend (Web Service)

### 3.1 Создание сервиса

1. В Render Dashboard → **New +** → **Web Service**.
2. Нажмите **Connect a repository** → выберите `kartbook`.
3. Настройте сервис:

| Параметр | Значение |
|---|---|
| **Name** | `kartbook-backend` |
| **Region** | Frankfurt (EU) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `alembic upgrade head && python scripts/seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | **Free** |

> **Примечание про `$PORT`:** Render автоматически назначает порт через переменную окружения `PORT`.
> FastAPI/uvicorn должен слушать именно на этом порту.

### 3.2 Переменные окружения Backend

В разделе **Environment** добавьте следующие переменные:

| Key | Value | Описание |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` (Internal URL из шага 2) | Строка подключения к БД |
| `SECRET_KEY` | Результат `python -c "import secrets; print(secrets.token_hex(32))"` | JWT секрет |
| `ALGORITHM` | `HS256` | Алгоритм JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Время жизни токена |
| `CORS_ORIGINS` | `["https://kartbook-frontend.onrender.com"]` | URL вашего frontend (узнаете после шага 4) |
| `YANDEX_MAPS_API_KEY` | Ваш ключ Яндекс или `YOUR_KEY_HERE` | Опционально |

> **Совет:** кнопка **Add from .env** позволяет загрузить переменные из `.env.example` одним файлом.

### 3.3 Примечание про загрузку файлов

На Free-плане Render файловая система **эфемерна** — файлы в `/app/uploads` удаляются при каждом перезапуске сервиса. Для production используйте:
- **Selectel S3** (как запланировано в коде — замените `_save_file` в `uploads.py`)
- **AWS S3** / **Cloudflare R2**

На Free-плане загрузка изображений технически работает, но файлы не переживут рестарт.

4. Нажмите **Create Web Service** → дождитесь завершения деплоя (3–5 минут).
5. Скопируйте URL вида `https://kartbook-backend.onrender.com`.

---

## 4. Развёртывание Frontend (Static Site)

Frontend — это статические файлы (HTML/JS/CSS) после сборки `npm run build`.
Render раздаёт их через CDN без «засыпания».

### 4.1 Создание Static Site

1. В Render Dashboard → **New +** → **Static Site**.
2. Выберите репозиторий `kartbook`.
3. Настройте:

| Параметр | Значение |
|---|---|
| **Name** | `kartbook-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `frontend/dist` |

### 4.2 Переменные окружения Frontend

> Vite встраивает переменные `VITE_*` **во время сборки**, поэтому их нужно добавить
> в Render **до** первого деплоя (или делать Redeploy после добавления).

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://kartbook-backend.onrender.com` (URL из шага 3) |
| `VITE_YANDEX_MAPS_API_KEY` | Ваш ключ Яндекс.Карт |

### 4.3 Настройка SPA-роутинга

React Router использует HTML5 History API. Без дополнительной настройки прямые URL
(`/kartodromes`, `/admin/bookings`) вернут 404.

Добавьте файл `frontend/public/_redirects`:

```
/*    /index.html   200
```

Или создайте `frontend/render.yaml`:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

Закоммитьте этот файл и сделайте новый push.

4. Нажмите **Create Static Site** → дождитесь сборки (2–4 минуты).
5. Скопируйте URL вида `https://kartbook-frontend.onrender.com`.

---

## 5. Настройка переменных окружения

### 5.1 Обновите CORS_ORIGINS в Backend

После того как frontend развёрнут и вы знаете его URL:

1. Перейдите в сервис `kartbook-backend` → **Environment**.
2. Измените `CORS_ORIGINS`:
   ```
   ["https://kartbook-frontend.onrender.com"]
   ```
3. Нажмите **Save Changes** — сервис перезапустится автоматически.

### 5.2 Итоговый список переменных

**Backend:**
```
DATABASE_URL=postgresql://kartbook_user:...@dpg-....render.com/kartbook
SECRET_KEY=ваш_32_символьный_hex
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=["https://kartbook-frontend.onrender.com"]
YANDEX_MAPS_API_KEY=ваш_ключ_яндекса
```

**Frontend** (встраиваются при сборке):
```
VITE_API_URL=https://kartbook-backend.onrender.com
VITE_YANDEX_MAPS_API_KEY=ваш_ключ_яндекса
```

---

## 6. Проверка работоспособности

После успешного деплоя выполните следующие проверки:

### 6.1 Backend API

Откройте `https://kartbook-backend.onrender.com/health` — должен вернуть:
```json
{"status": "ok"}
```

Откройте `https://kartbook-backend.onrender.com/docs` — должна открыться
Swagger UI с документацией всех эндпоинтов.

### 6.2 Frontend

1. Откройте `https://kartbook-frontend.onrender.com`.
2. Должна открыться страница входа.
3. Войдите с демо-данными:
   - Клиент: `ivan@mail.ru` / `user123`
   - Администратор: `admin@kartbook.ru` / `admin123`
4. Убедитесь, что список картодромов загружается.
5. Проверьте бронирование заезда.
6. Проверьте загрузку аватара в профиле.

### 6.3 Проверка миграций и seed-данных

Если демо-аккаунты не работают:

1. В Render Dashboard → `kartbook-backend` → **Logs**.
2. Найдите строки:
   ```
   INFO [alembic.runtime.migration] Running upgrade -> 0001
   INFO [alembic.runtime.migration] Running upgrade 0001 -> 0002
   ✓ Seed complete.
   ```
3. Если seed завершился ошибкой — проверьте правильность `DATABASE_URL`.

### 6.4 Проверка CORS

Откройте DevTools браузера (F12) → Console. Если есть CORS-ошибки:
- Убедитесь, что `CORS_ORIGINS` в backend содержит точный URL frontend **без** trailing slash.
- Сделайте **Manual Deploy** backend после изменения переменной.

---

## 7. Минимизация холодных стартов

На Free-плане Render **Web Service засыпает** через 15 минут неактивности.
Первый запрос после «сна» обрабатывается с задержкой 30–60 секунд (cold start).

> **Static Site не засыпает** — только Web Service (backend).

### Вариант 1 — UptimeRobot (рекомендуется, бесплатно)

1. Зарегистрируйтесь на https://uptimerobot.com (бесплатно, до 50 мониторов).
2. **New Monitor** → **HTTP(s)**.
3. Настройте:
   - **Friendly Name:** `KartBook Backend`
   - **URL:** `https://kartbook-backend.onrender.com/health`
   - **Monitoring Interval:** `5 minutes`
4. Нажмите **Create Monitor**.

UptimeRobot будет отправлять GET-запрос каждые 5 минут — сервис не успеет заснуть.

### Вариант 2 — cron-job.org

1. Зарегистрируйтесь на https://cron-job.org (бесплатно).
2. **Create cronjob**:
   - **URL:** `https://kartbook-backend.onrender.com/health`
   - **Schedule:** каждые 5 минут (`*/5 * * * *`)

### Вариант 3 — GitHub Actions (keep-alive workflow)

Создайте файл `.github/workflows/keepalive.yml`:

```yaml
name: Keep Render Backend Alive

on:
  schedule:
    - cron: '*/10 6-22 * * *'  # каждые 10 мин с 6 до 22 UTC

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping backend health endpoint
        run: |
          curl -f https://kartbook-backend.onrender.com/health || echo "Service waking up"
```

### Вариант 4 — Переход на платный план

Render **Starter** план ($7/месяц) исключает засыпание полностью.
Это же значение заложено в экономическом обосновании проекта как стоимость хостинга
после ввода в промышленную эксплуатацию.

---

## Ожидаемый результат после деплоя

| Сервис | URL | Статус |
|---|---|---|
| Frontend | `https://kartbook-frontend.onrender.com` | ✅ Всегда доступен (Static Site) |
| Backend API | `https://kartbook-backend.onrender.com/docs` | ⏱ Засыпает (Free) |
| Health check | `https://kartbook-backend.onrender.com/health` | ⏱ Засыпает (Free) |
| PostgreSQL | Внутренний адрес Render | ✅ Работает (90 дней бесплатно) |

---

## Часто встречаемые ошибки

| Ошибка | Причина | Решение |
|---|---|---|
| `relation "users" does not exist` | Миграции не применились | Проверьте `DATABASE_URL` в Render; убедитесь, что команда запуска включает `alembic upgrade head` |
| `CORS error` в браузере | Неверный `CORS_ORIGINS` | Проверьте URL frontend в переменной окружения backend; сделайте Redeploy |
| `invalid input value for enum userrole` | Старая версия кода без `values_callable` | Убедитесь что вы деплоите актуальную версию из репозитория |
| Страница `/kartodromes` возвращает 404 | Нет `_redirects` для SPA | Добавьте файл `frontend/public/_redirects` с содержимым `/* /index.html 200` |
| Backend не отвечает 30–60 сек | Cold start (засыпание) | Настройте keep-alive мониторинг (раздел 7) |
| Загруженные фото исчезают | Эфемерная FS на Free-плане | Подключите Selectel S3 или перейдите на платный план |
