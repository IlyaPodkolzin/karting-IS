#!/bin/bash

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Seed the database (idempotent - safe to run multiple times)
echo "Seeding database..."
python scripts/seed.py

# Start the application
echo "Starting FastAPI application..."
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}