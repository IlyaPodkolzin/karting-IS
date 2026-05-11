import React, { useEffect, useState } from 'react';
import { bookingsApi } from '@/api/bookings';
import { kartodromesApi } from '@/api/kartodromes';
import { usersApi } from '@/api/users';
import type { Booking, Kartodrome, User } from '@/types';
import { Card, Badge, Btn, Select, Spinner, fmtPrice, formatDate, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/components/common';

interface Props { onToast: (msg: string, type?: 'success'|'error'|'info') => void; }

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидание' },
  { value: 'confirmed', label: 'Подтверждено' },
  { value: 'completed', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
];

export function AdminBookingsPage({ onToast }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [kartodromes, setKartodromes] = useState<Kartodrome[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bookingsApi.getAll(), usersApi.getAll(), kartodromesApi.getAll()])
      .then(([bks, us, kds]) => { setBookings(bks); setUsers(us); setKartodromes(kds); })
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: number, status: string) {
    try {
      const updated = await bookingsApi.updateStatus(id, status);
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
      onToast(`Статус обновлён: ${BOOKING_STATUS_LABELS[status]}`);
    } catch (e: any) {
      onToast(e?.response?.data?.detail || 'Ошибка', 'error');
    }
  }

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);
  const getUserName = (id: number) => users.find(u => u.id === id)?.name || `#${id}`;
  const getKartodromeName = (b: Booking) => {
    const s = b.session;
    if (!s) return '—';
    return kartodromes.find(k => k.id === s.kartodrome_id)?.name || '—';
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 1.25rem', color: '#222' }}>Управление бронированиями</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Select value={filter} onChange={setFilter} options={STATUS_OPTIONS} style={{ width: 180 }} />
        <span style={{ fontSize: 13, color: '#888' }}>{filtered.length} бронирований</span>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.length === 0 && <Card><div style={{ color: '#aaa', textAlign: 'center', padding: '1.5rem', fontSize: 14 }}>Нет бронирований</div></Card>}
        {filtered.map(b => (
          <Card key={b.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#222' }}>
                  {getUserName(b.user_id)} · {getKartodromeName(b)}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {b.session ? `${formatDate(b.session.date)} ${b.session.start_time.slice(0,5)}–${b.session.end_time.slice(0,5)}` : '—'}
                  {' · '}{fmtPrice(b.total_price)}
                  {' · '}Бронь #{b.id}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Badge color={BOOKING_STATUS_COLORS[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
                {b.status === 'pending' && <Btn variant="primary" onClick={() => updateStatus(b.id, 'confirmed')} style={{ fontSize: 12, padding: '5px 10px' }}>Подтвердить</Btn>}
                {b.status === 'confirmed' && <Btn onClick={() => updateStatus(b.id, 'completed')} style={{ fontSize: 12, padding: '5px 10px' }}>Завершить</Btn>}
                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <Btn variant="danger" onClick={() => updateStatus(b.id, 'cancelled')} style={{ fontSize: 12, padding: '5px 10px' }}>Отменить</Btn>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
