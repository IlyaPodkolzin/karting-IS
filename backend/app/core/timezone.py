"""Timezone utilities. All times in the system are Moscow time (UTC+3)."""
from datetime import datetime, timezone, timedelta
import pytz

MOSCOW_TZ = pytz.timezone("Europe/Moscow")


def now_moscow() -> datetime:
    """Current datetime in Moscow timezone (aware)."""
    return datetime.now(tz=MOSCOW_TZ)


def now_moscow_naive() -> datetime:
    """Current Moscow datetime without tzinfo (for DB comparisons)."""
    return datetime.now(tz=MOSCOW_TZ).replace(tzinfo=None)


def to_moscow(dt: datetime) -> datetime:
    """Convert any aware datetime to Moscow time."""
    return dt.astimezone(MOSCOW_TZ)
