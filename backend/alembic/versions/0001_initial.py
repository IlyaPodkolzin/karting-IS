"""Initial schema
 
Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
 
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
 
 
def _create_enum_if_not_exists(name: str, *values: str) -> None:
    """Create a PostgreSQL native enum type only if it does not already exist.
 
    This makes the migration idempotent — safe to run even when Base.metadata
    create_all() has already created the enum types (e.g. during local dev or
    after a partial previous deploy).
    """
    conn = op.get_bind()
    exists = conn.execute(
        sa.text("SELECT 1 FROM pg_type WHERE typname = :name"),
        {"name": name},
    ).scalar()
    if not exists:
        enum_values = ", ".join(f"'{v}'" for v in values)
        conn.execute(sa.text(f"CREATE TYPE {name} AS ENUM ({enum_values})"))
 
 
def upgrade() -> None:
    # ── Enum types (idempotent — skip if already created by create_all) ──────
    _create_enum_if_not_exists('userrole',      'client', 'admin')
    _create_enum_if_not_exists('bookingstatus', 'pending', 'confirmed', 'cancelled', 'completed')
    _create_enum_if_not_exists('sessiontype',   'usual', 'kids')
    _create_enum_if_not_exists('kartstatus',    'available', 'booked', 'maintenance', 'retired')
 
    # ── Tables ────────────────────────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id',            sa.Integer(),    primary_key=True, index=True),
        sa.Column('name',          sa.String(100),  nullable=False),
        sa.Column('email',         sa.String(100),  nullable=False, unique=True, index=True),
        sa.Column('password_hash', sa.String(255),  nullable=False),
        sa.Column('role',          postgresql.ENUM('client', 'admin', name='userrole', create_type=False), nullable=False, server_default='client'),
        sa.Column('avatar_url',    sa.String(500),  nullable=True),
        sa.Column('created_at',    sa.DateTime(),   nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at',    sa.DateTime(),   nullable=False, server_default=sa.func.now()),
    )
 
    op.create_table(
        'client_profiles',
        sa.Column('user_id',        sa.Integer(), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('phone',          sa.String(20)),
        sa.Column('license_number', sa.String(50)),
    )
 
    op.create_table(
        'admin_profiles',
        sa.Column('user_id',    sa.Integer(), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('position',   sa.String(100), nullable=False, server_default='Администратор'),
        sa.Column('hired_at',   sa.Date(),      nullable=False),
        sa.Column('is_active',  sa.Boolean(),   nullable=False, server_default='true'),
        sa.Column('work_phone', sa.String(20)),
    )
 
    op.create_table(
        'kartodromes',
        sa.Column('id',           sa.Integer(),    primary_key=True, index=True),
        sa.Column('name',         sa.String(200),  nullable=False),
        sa.Column('address',      sa.Text(),       nullable=False),
        sa.Column('latitude',     sa.Float()),
        sa.Column('longitude',    sa.Float()),
        sa.Column('description',  sa.Text()),
        sa.Column('image_url',    sa.String(500)),
        sa.Column('phone',        sa.String(20)),
        sa.Column('email',        sa.String(100)),
        sa.Column('working_hours', sa.JSON()),
        sa.Column('created_at',   sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
 
    op.create_table(
        'karts',
        sa.Column('id',               sa.Integer(),   primary_key=True, index=True),
        sa.Column('number',           sa.String(20),  nullable=False),
        sa.Column('type',             sa.String(50),  nullable=False),
        sa.Column('status',           postgresql.ENUM('available', 'booked', 'maintenance', 'retired', name='kartstatus', create_type=False), nullable=False, server_default='available'),
        sa.Column('engine_type',      sa.String(50)),
        sa.Column('last_maintenance', sa.Date()),
        sa.Column('image_url',        sa.String(500)),
        sa.Column('kartodrome_id',    sa.Integer(), sa.ForeignKey('kartodromes.id'), nullable=False, index=True),
    )
 
    op.create_table(
        'sessions',
        sa.Column('id',               sa.Integer(), primary_key=True, index=True),
        sa.Column('kartodrome_id',    sa.Integer(), sa.ForeignKey('kartodromes.id'), nullable=False, index=True),
        sa.Column('session_number',   sa.Integer(), nullable=False),
        sa.Column('session_type',     postgresql.ENUM('usual', 'kids', name='sessiontype', create_type=False), nullable=False, server_default='usual'),
        sa.Column('date',             sa.Date(),    nullable=False, index=True),
        sa.Column('start_time',       sa.Time(),    nullable=False),
        sa.Column('end_time',         sa.Time(),    nullable=False),
        sa.Column('max_participants', sa.Integer(), nullable=False),
        sa.Column('price',            sa.Float(),   nullable=False),
        sa.Column('created_at',       sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
 
    op.create_table(
        'bookings',
        sa.Column('id',          sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id',     sa.Integer(), sa.ForeignKey('users.id'),    nullable=False, index=True),
        sa.Column('session_id',  sa.Integer(), sa.ForeignKey('sessions.id'), nullable=False, index=True),
        sa.Column('kart_id',     sa.Integer(), sa.ForeignKey('karts.id'),    nullable=True),
        sa.Column('status',      postgresql.ENUM('pending', 'confirmed', 'cancelled', 'completed', name='bookingstatus', create_type=False), nullable=False, server_default='confirmed'),
        sa.Column('total_price', sa.Float(),   nullable=False),
        sa.Column('created_at',  sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at',  sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
 
    op.create_table(
        'laps',
        sa.Column('id',         sa.Integer(), primary_key=True, index=True),
        sa.Column('booking_id', sa.Integer(), sa.ForeignKey('bookings.id'), nullable=False, index=True),
        sa.Column('lap_number', sa.Integer(), nullable=False),
        sa.Column('lap_time',   sa.Float(),   nullable=False),
        sa.Column('timestamp',  sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
 
    op.create_table(
        'statistics',
        sa.Column('id',               sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id',          sa.Integer(), sa.ForeignKey('users.id'),         nullable=False, index=True),
        sa.Column('kartodrome_id',    sa.Integer(), sa.ForeignKey('kartodromes.id'),   nullable=False, index=True),
        sa.Column('best_lap_time',    sa.Float()),
        sa.Column('average_lap_time', sa.Float()),
        sa.Column('total_laps',       sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_updated',     sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'kartodrome_id', name='uq_stat_user_kartodrome'),
    )
 
 
def downgrade() -> None:
    op.drop_table('statistics')
    op.drop_table('laps')
    op.drop_table('bookings')
    op.drop_table('sessions')
    op.drop_table('karts')
    op.drop_table('kartodromes')
    op.drop_table('admin_profiles')
    op.drop_table('client_profiles')
    op.drop_table('users')
    op.execute('DROP TYPE IF EXISTS userrole')
    op.execute('DROP TYPE IF EXISTS bookingstatus')
    op.execute('DROP TYPE IF EXISTS sessiontype')
    op.execute('DROP TYPE IF EXISTS kartstatus')
 