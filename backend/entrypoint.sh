#!/bin/bash

# Run migrations with retry logic
echo "Running database migrations..."
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    alembic upgrade head && break
    echo "Migration failed, retrying in 5 seconds... (Attempt $((RETRY_COUNT+1))/$MAX_RETRIES)"
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "WARNING: Migration failed after $MAX_RETRIES attempts, but continuing..."
fi

# Seed the database (idempotent)
echo "Seeding database..."
python scripts/seed.py

# Start the application
echo "Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
