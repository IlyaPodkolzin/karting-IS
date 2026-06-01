"""Initial schema

Revision ID: 0001
Revises: 
Create Date: 2026-01-01 00:00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(100), nullable=False, unique=True, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', sa.Enum('client', 'admin', name='userrole'), nullable=False, server_default='client'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'client_profiles',
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('phone', sa.String(20)),
        sa.Column('license_number', sa.String(50)),
    )

    op.create_table(
        'admin_profiles',
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('position', sa.String(100), nullable=False, server_default='Администратор'),
        sa.Column('hired_at', sa.Date(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('work_phone', sa.String(20)),
    )

    op.create_table(
        'kartodromes',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('latitude', sa.Float()),
        sa.Column('longitude', sa.Float()),
        sa.Column('description', sa.Text()),
        sa.Column('image_url', sa.String(500)),
        sa.Column('phone', sa.String(20)),
        sa.Column('email', sa.String(100)),
        sa.Column('working_hours', sa.JSON()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'karts',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('number', sa.String(20), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('status', sa.Enum('available', 'booked', 'maintenance', 'retired', name='kartstatus'), nullable=False, server_default='available'),
        sa.Column('engine_type', sa.String(50)),
        sa.Column('last_maintenance', sa.Date()),
        sa.Column('kartodrome_id', sa.Integer(), sa.ForeignKey('kartodromes.id'), nullable=False, index=True),
    )

    op.create_table(
        'sessions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('kartodrome_id', sa.Integer(), sa.ForeignKey('kartodromes.id'), nullable=False, index=True),
        sa.Column('session_number', sa.Integer(), nullable=False),
        sa.Column('session_type', sa.Enum('usual', 'kids', name='sessiontype'), nullable=False, server_default='usual'),
        sa.Column('date', sa.Date(), nullable=False, index=True),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('max_participants', sa.Integer(), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'bookings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('session_id', sa.Integer(), sa.ForeignKey('sessions.id'), nullable=False, index=True),
        sa.Column('kart_id', sa.Integer(), sa.ForeignKey('karts.id'), nullable=True),
        sa.Column('status', sa.Enum('pending', 'confirmed', 'cancelled', 'completed', name='bookingstatus'), nullable=False, server_default='confirmed'),
        sa.Column('total_price', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'laps',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('booking_id', sa.Integer(), sa.ForeignKey('bookings.id'), nullable=False, index=True),
        sa.Column('lap_number', sa.Integer(), nullable=False),
        sa.Column('lap_time', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        'statistics',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('kartodrome_id', sa.Integer(), sa.ForeignKey('kartodromes.id'), nullable=False, index=True),
        sa.Column('best_lap_time', sa.Float()),
        sa.Column('average_lap_time', sa.Float()),
        sa.Column('total_laps', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_updated', sa.DateTime(), nullable=False, server_default=sa.func.now()),
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
    op.execute('DROP TYPE IF EXISTS kartstatus')
    op.execute('DROP TYPE IF EXISTS sessiontype')
    op.execute('DROP TYPE IF EXISTS bookingstatus')
