import React, { useEffect, useState } from 'react';
import { kartodromesApi } from '@/api/kartodromes';
import { sessionsApi } from '@/api/sessions';
import { bookingsApi } from '@/api/bookings';
import type { Kartodrome, Session } from '@/types';
import { Card, Badge, Btn, Modal, Spinner, ErrorMsg, fmtPrice, SESSION_TYPE_LABELS } from '@/components/common';
import type { User } from '@/types';

interface Props { user: User; onToast: (msg: string, type?: 'success'|'error'|'info') => void; }

export function KartodromesPage({ user, onToast }: Props) {
  const [kartodromes, setKartodromes] = useState<Kartodrome[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [bookingModal, setBookingModal] = useState<{ session: Session; kartodrome: Kartodrome } | null>(null);
  const [booking, setBooking] = useState(false);
  const [myBookedSessionIds, setMyBookedSessionIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    kartodromesApi.getAll().then(setKartodromes).finally(() => setLoading(false));
    bookingsApi.getMy().then(bks => {
      setMyBookedSessionIds(new Set(bks.filter(b => b.status !== 'cancelled').map(b => b.session_id)));
    });
  }, []);

  async function loadSessions(kartodromeId: number) {
    setSessionsLoading(true);
    try {
      const data = await sessionsApi.getAll({ kartodrome_id: kartodromeId, date: selectedDate });
      setSessions(data);
    } finally { setSessionsLoading(false); }
  }

  function toggleExpand(k: Kartodrome) {
    if (expandedId === k.id) { setExpandedId(null); return; }
    setExpandedId(k.id);
    loadSessions(k.id);
  }

  async function handleDateChange(date: string) {
    setSelectedDate(date);
    if (expandedId) {
      setSessionsLoading(true);
      const data = await sessionsApi.getAll({ kartodrome_id: expandedId, date });
      setSessions(data);
      setSessionsLoading(false);
    }
  }

  async function confirmBooking() {
    if (!bookingModal) return;
    setBooking(true);
    try {
      await bookingsApi.create(bookingModal.session.id);
      setMyBookedSessionIds(prev => new Set([...prev, bookingModal.session.id]));
      onToast('Бронирование успешно создано!');
      setBookingModal(null);
    } catch (e: any) {
      onToast(e?.response?.data?.detail || 'Ошибка бронирования', 'error');
    } finally { setBooking(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 1.25rem', color: '#222' }}>Картодромы</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {kartodromes.map(k => (
          <Card key={k.id} onClick={() => toggleExpand(k)}
            style={{ cursor: 'pointer', border: expandedId === k.id ? '1.5px solid #378ADD' : '0.5px solid #e5e5e5', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4, color: '#222' }}>{k.name}</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>📍 {k.address}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{k.description}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {k.phone && <div style={{ fontSize: 12, color: '#888' }}>📞 {k.phone}</div>}
                {k.working_hours && (
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    🕐 {k.working_hours.weekdays || Object.values(k.working_hours)[0]}
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 13, color: '#185FA5' }}>{expandedId === k.id ? '▲ Скрыть' : '▼ Заезды'}</span>
                </div>
              </div>
            </div>

            {expandedId === k.id && (
              <div onClick={e => e.stopPropagation()} style={{ marginTop: '1rem', borderTop: '0.5px solid #eee', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Дата:</span>
                  <input type="date" value={selectedDate} onChange={e => handleDateChange(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, color: '#333', background: '#fff' }} />
                </div>
                {sessionsLoading ? <Spinner /> : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {sessions.length === 0 && <div style={{ fontSize: 14, color: '#aaa', padding: '1rem 0' }}>Нет заездов на выбранную дату</div>}
                    {sessions.map(s => {
                      const slots = s.available_slots ?? 0;
                      const alreadyBooked = myBookedSessionIds.has(s.id);
                      const isFull = slots <= 0;
                      return (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: 10, background: '#f9f9f9', flexWrap: 'wrap', gap: 8, border: '0.5px solid #eee' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>Заезд #{s.session_number}</span>
                            <span style={{ fontSize: 13, color: '#888' }}>{s.start_time.slice(0,5)} – {s.end_time.slice(0,5)}</span>
                            <Badge color={s.session_type === 'kids' ? 'green' : 'blue'}>{SESSION_TYPE_LABELS[s.session_type]}</Badge>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 13, color: isFull ? '#A32D2D' : '#888' }}>
                              {isFull ? 'Мест нет' : `${slots} из ${s.max_participants} мест`}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: 14, color: '#222' }}>{fmtPrice(s.price)}</span>
                            {user.role !== 'admin' && (
                              alreadyBooked
                                ? <Badge color="teal">Забронировано</Badge>
                                : <Btn variant="primary" disabled={isFull} onClick={() => setBookingModal({ session: s, kartodrome: k })}>Забронировать</Btn>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal open={!!bookingModal} onClose={() => setBookingModal(null)} title="Подтверждение бронирования">
        {bookingModal && (
          <div>
            <div style={{ display: 'grid', gap: 8, marginBottom: '1.25rem', background: '#f9f9f9', borderRadius: 8, padding: '1rem' }}>
              <Row label="Картодром" value={bookingModal.kartodrome.name} />
              <Row label="Тип" value={SESSION_TYPE_LABELS[bookingModal.session.session_type]} />
              <Row label="Дата" value={bookingModal.session.date} />
              <Row label="Время" value={`${bookingModal.session.start_time.slice(0,5)} – ${bookingModal.session.end_time.slice(0,5)}`} />
              <Row label="Стоимость" value={fmtPrice(bookingModal.session.price)} bold />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn onClick={() => setBookingModal(null)}>Отмена</Btn>
              <Btn variant="primary" onClick={confirmBooking} disabled={booking}>{booking ? '...' : 'Подтвердить'}</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: '#222' }}>{value}</span>
    </div>
  );
}
