import React, { useEffect, useState } from 'react';
import { bookingsApi } from '@/api/bookings';
import { lapsApi } from '@/api/laps';
import { kartodromesApi } from '@/api/kartodromes';
import type { Booking, Kartodrome, Lap } from '@/types';
import { Card, Badge, Btn, Modal, Spinner, fmtPrice, fmtLap, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS, formatDate } from '@/components/common';

interface Props { onToast: (msg: string, type?: 'success'|'error'|'info') => void; }

export function BookingsPage({ onToast }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [kartodromes, setKartodromes] = useState<Kartodrome[]>([]);
  const [loading, setLoading] = useState(true);
  const [lapModal, setLapModal] = useState<{ booking: Booking; laps: Lap[] } | null>(null);
  const [lapLoading, setLapLoading] = useState(false);

  useEffect(() => {
    Promise.all([bookingsApi.getMy(), kartodromesApi.getAll()])
      .then(([bks, kds]) => { setBookings(bks); setKartodromes(kds); })
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(id: number) {
    try {
      await bookingsApi.cancel(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      onToast('Бронирование отменено', 'info');
    } catch (e: any) {
      onToast(e?.response?.data?.detail || 'Ошибка отмены', 'error');
    }
  }

  async function openLaps(booking: Booking) {
    setLapLoading(true);
    setLapModal({ booking, laps: [] });
    const laps = await lapsApi.getByBooking(booking.id);
    setLapModal({ booking, laps });
    setLapLoading(false);
  }

  function getKartodromeForBooking(b: Booking): string {
    const s = b.session;
    if (!s) return '—';
    const k = kartodromes.find(k => k.id === s.kartodrome_id);
    return k?.name || '—';
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 1.25rem', color: '#222' }}>Мои бронирования</h1>
      {bookings.length === 0 && (
        <Card><div style={{ color: '#aaa', fontSize: 14, textAlign: 'center', padding: '2rem' }}>
          У вас нет бронирований. Перейдите в раздел «Картодромы» чтобы записаться!
        </div></Card>
      )}
      <div style={{ display: 'grid', gap: 10 }}>
        {bookings.map(b => (
          <Card key={b.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#222' }}>{getKartodromeForBooking(b)}</div>
                {b.session && (
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
                    📅 {formatDate(b.session.date)} · {b.session.start_time.slice(0,5)} – {b.session.end_time.slice(0,5)}
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#bbb' }}>Бронь #{b.id} · {new Date(b.created_at).toLocaleDateString('ru')}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <Badge color={BOOKING_STATUS_COLORS[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#185FA5' }}>{fmtPrice(b.total_price)}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {b.status === 'completed' && (
                    <Btn onClick={() => openLaps(b)} style={{ fontSize: 12, padding: '5px 10px' }}>Круги 🏎️</Btn>
                  )}
                  {(b.status === 'confirmed' || b.status === 'pending') && (
                    <Btn variant="danger" onClick={() => handleCancel(b.id)} style={{ fontSize: 12, padding: '5px 10px' }}>Отменить</Btn>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!lapModal} onClose={() => setLapModal(null)} title={`Результаты заезда #${lapModal?.booking.id}`}>
        {lapLoading ? <Spinner /> : lapModal && (
          <div>
            {lapModal.laps.length === 0
              ? <div style={{ color: '#aaa', fontSize: 14, textAlign: 'center', padding: '1rem' }}>Данные о кругах не записаны</div>
              : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '1rem' }}>
                    <SummaryBox label="Кругов" value={lapModal.laps.length} />
                    <SummaryBox label="Лучший" value={fmtLap(Math.min(...lapModal.laps.map(l => l.lap_time)))} />
                    <SummaryBox label="Средний" value={fmtLap(lapModal.laps.reduce((a, l) => a + l.lap_time, 0) / lapModal.laps.length)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {lapModal.laps.map(l => {
                      const best = Math.min(...lapModal.laps.map(x => x.lap_time));
                      const isBest = l.lap_time === best;
                      return (
                        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 12px', borderRadius: 8,
                          background: isBest ? '#FAEEDA' : '#f9f9f9', border: `0.5px solid ${isBest ? '#BA7517' : '#eee'}` }}>
                          <span style={{ fontSize: 13, color: '#888' }}>Круг #{l.lap_number}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: isBest ? '#854F0B' : '#333' }}>
                            {l.lap_time.toFixed(2)} с {isBest ? '🏆' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            }
          </div>
        )}
      </Modal>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#185FA5' }}>{value}</div>
    </div>
  );
}
