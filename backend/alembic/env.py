from logging.config import fileConfig
from sqlalchemy import create_engine, pool
from alembic import context
from app.db.base import Base
from app.core.config import settings

# Import ALL models so Alembic sees every table
from app.modules.users.models import User, ClientProfile, AdminProfile  # noqa
from app.modules.kartodromes.models import Kartodrome  # noqa
from app.modules.sessions.models import Session  # noqa
from app.modules.bookings.models import Booking  # noqa
from app.modules.laps.models import Lap  # noqa
from app.modules.statistics.models import Statistic  # noqa
from app.modules.admin.models import Kart  # noqa

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Always use DATABASE_URL from environment / pydantic-settings, never the ini file
DATABASE_URL = settings.DATABASE_URL


def run_migrations_offline() -> None:
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Create engine directly from settings — NOT from engine_from_config which reads alembic.ini
    connectable = create_engine(DATABASE_URL, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
