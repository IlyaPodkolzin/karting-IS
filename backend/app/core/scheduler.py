"""
Background scheduler — runs periodic tasks:
- Every minute: auto-complete bookings whose session end_time has passed (Moscow time).
- Every day at 03:00 MSK: delete sessions older than today.
"""
from datetime import datetime, date, timedelta
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
import pytz

from app.db.session import SessionLocal
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.sessions.models import Session
from app.modules.statistics.service import StatisticService

logger = logging.getLogger(__name__)
MOSCOW_TZ = pytz.timezone("Europe/Moscow")


def _auto_complete_bookings() -> None:
    """Mark confirmed bookings as completed when their session end_time has passed."""
    db = SessionLocal()
    try:
        now_msk = datetime.now(tz=MOSCOW_TZ).replace(tzinfo=None)
        today = now_msk.date()
        current_time = now_msk.time()

        # Find all confirmed bookings where session date+end_time <= now
        bookings = (
            db.query(Booking)
            .join(Booking.session)
            .filter(
                Booking.status == BookingStatus.CONFIRMED,
                Session.date <= today,
            )
            .all()
        )

        completed_count = 0
        for booking in bookings:
            s = booking.session
            if s is None:
                continue
            # Build full datetime for the session end
            session_end = datetime.combine(s.date, s.end_time)
            if session_end <= now_msk.replace(tzinfo=None):
                booking.status = BookingStatus.COMPLETED
                booking.updated_at = datetime.utcnow()
                db.add(booking)
                completed_count += 1
                # Recalculate statistics
                try:
                    StatisticService(db).recalculate_for_booking(booking)
                except Exception as e:
                    logger.warning(f"Stats recalculate failed for booking {booking.id}: {e}")

        if completed_count:
            db.commit()
            logger.info(f"Auto-completed {completed_count} booking(s).")
    except Exception as e:
        db.rollback()
        logger.error(f"Auto-complete job error: {e}")
    finally:
        db.close()


def _delete_old_sessions() -> None:
    """Delete sessions from yesterday and earlier."""
    db = SessionLocal()
    try:
        now_msk = datetime.now(tz=MOSCOW_TZ).replace(tzinfo=None)
        yesterday = now_msk.date() - timedelta(days=1)
        deleted = db.query(Session).filter(Session.date <= yesterday).delete(synchronize_session=False)
        db.commit()
        if deleted:
            logger.info(f"Deleted {deleted} expired session(s).")
    except Exception as e:
        db.rollback()
        logger.error(f"Delete old sessions error: {e}")
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone=MOSCOW_TZ)

    # Check every 60 seconds for bookings to auto-complete
    scheduler.add_job(
        _auto_complete_bookings,
        trigger=IntervalTrigger(seconds=60),
        id="auto_complete_bookings",
        replace_existing=True,
    )

    # Clean up old sessions every day at 03:00 MSK
    scheduler.add_job(
        _delete_old_sessions,
        trigger=CronTrigger(hour=3, minute=0, timezone=MOSCOW_TZ),
        id="delete_old_sessions",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Scheduler started.")
    return scheduler
