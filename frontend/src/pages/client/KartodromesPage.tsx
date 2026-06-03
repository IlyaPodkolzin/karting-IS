import React, { useEffect, useState, useRef } from 'react';
import { kartodromesApi } from '@/api/kartodromes';
import { sessionsApi } from '@/api/sessions';
import { bookingsApi } from '@/api/bookings';
import { uploadsApi } from '@/api/uploads';
import type { Kartodrome, Session } from '@/types';
import { Card, Badge, Btn, Modal, Spinner, fmtPrice, SESSION_TYPE_LABELS } from '@/components/common';
import { YandexMapWidget } from '@/components/common/YandexMapWidget';
import type { User } from '@/types';
import { computeDistances, type DistanceResult } from '@/hooks/useYandexDistance';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Props { user: User; onToast: (msg: string, type?: 'success'|'error'|'info') => void; }

export function KartodromesPage({ user, onToast }: Props) {
  const [kartodromes, setKartodromes] = useState<Kartodrome[]>([]);
  const [distances, setDistances] = useState<Record<number, DistanceResult>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [bookingModal, setBookingModal] = useState<{ session: Session; kartodrome: Kartodrome } | null>(null);
  const [booking, setBooking] = useState(false);
  const [myBookedSessionIds, setMyBookedSessionIds] = useState<Set<number>>(new Set());
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([kartodromesApi.getAll(), bookingsApi.getMy()])
      .then(([kds, bks]) => {
        setKartodromes(kds);
        setMyBookedSessionIds(new Set(bks.filter(b => b.status !== 'cancelled').map(b => b.session_id)));
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const dists = await computeDistances(kds, pos.coords.latitude, pos.coords.longitude);
              setDistances(dists);
            },
            () => {},
            { timeout: 6000 },
          );
        }
      })
      .finally(() => setLoading(false));
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
      loadSessions(bookingModal.kartodrome.id);
    } catch (e: any) {
      onToast(e?.response?.data?.detail || 'Ошибка бронирования', 'error');
    } finally { setBooking(false); }
  }

  function handleUploadClick(kartodromeId: number, e: React.MouseEvent) {
    e.stopPropagation();
    setUploadTarget(kartodromeId);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    setUploadingId(uploadTarget);
    try {
      const { image_url } = await uploadsApi.uploadKartodromeImage(uploadTarget, file);
      setKartodromes(prev => prev.map(k => k.id === uploadTarget ? { ...k, image_url } : k));
      onToast('Фото обновлено');
    } catch { onToast('Ошибка загрузки фото', 'error'); }
    finally { setUploadingId(null); e.target.value = ''; }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 1.25rem', color: '#222' }}>Картодромы</h1>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      <div style={{ display: 'grid', gap: 12 }}>
        {kartodromes.map(k => {
          const dist = distances[k.id];
          const isExpanded = expandedId === k.id;

          return (
            <Card key={k.id} onClick={() => toggleExpand(k)}
              style={{ cursor: 'pointer', border: isExpanded ? '1.5px solid #378ADD' : '0.5px solid #e5e5e5',
                transition: 'all 0.2s', padding: 0, overflow: 'hidden' }}>

              {/* Banner image */}
              {k.image_url && (
                <div style={{ height: 140, background: '#eee', overflow: 'hidden' }}>
                  <img src={`${API_BASE}${k.image_url}`} alt={k.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ padding: '1rem 1.25rem' }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4, color: '#222' }}>{k.name}</div>
                    <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>📍 {k.address}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{k.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    {dist && (
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#185FA5' }}>
                        {dist.isDriving ? '🚗' : '📏'} {dist.text}
                        {!dist.isDriving && <span style={{ fontSize: 10, color: '#aaa' }}> (по прямой)</span>}
                      </span>
                    )}
                    {k.phone && <div style={{ fontSize: 12, color: '#888' }}>📞 {k.phone}</div>}
                    {k.email && <div style={{ fontSize: 12, color: '#888' }}>✉️ {k.email}</div>}
                    {k.working_hours && (
                      <div style={{ fontSize: 12, color: '#888' }}>
                        🕐 {Object.entries(k.working_hours).map(([d, h]) => `${d}: ${h}`).join(' · ')}
                      </div>
                    )}
                    {user.role === 'admin' && (
                      <Btn onClick={() => handleUploadClick(k.id, e!)}
                        style={{ fontSize: 11, padding: '4px 8px' }}
                        disabled={uploadingId === k.id}>
                        {uploadingId === k.id ? '...' : '📷 Фото'}
                      </Btn>
                    )}
                    <div style={{ marginTop: 2 }}>
                      <span style={{ fontSize: 13, color: '#185FA5' }}>
                        {isExpanded ? '▲ Свернуть' : '▼ Подробнее'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded section */}
                {isExpanded && (
                  <div onClick={e => e.stopPropagation()}
                    style={{ marginTop: '1rem', borderTop: '0.5px solid #eee', paddingTop: '1rem' }}>

                    {/* ── Yandex Map widget ── */}
                    {k.latitude && k.longitude && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                          📍 Расположение
                        </div>
                        <YandexMapWidget
                          lat={k.latitude}
                          lon={k.longitude}
                          name={k.name}
                          height={200}
                        />
                      </div>
                    )}

                    {/* ── Sessions ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Заезды на дату:</span>
                      <input type="date" value={selectedDate} onChange={e => handleDateChange(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd',
                          fontSize: 13, color: '#333', background: '#fff' }} />
                    </div>

                    {sessionsLoading ? <Spinner /> : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {sessions.length === 0 && (
                          <div style={{ fontSize: 14, color: '#aaa', padding: '0.75rem 0' }}>
                            Нет заездов на выбранную дату
                          </div>
                        )}
                        {sessions.map(s => {
                          const alreadyBooked = myBookedSessionIds.has(s.id);
                          const isFull = (s.available_slots ?? 0) <= 0;
                          const isBookable = s.is_bookable !== false;
                          const isActive = s.is_active === true;
                          const isExpired = s.is_expired === true;

                          return (
                            <div key={s.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '10px 14px', borderRadius: 10, flexWrap: 'wrap', gap: 8,
                              background: isActive ? '#EAF3DE' : isExpired ? '#f5f5f5' : '#f9f9f9',
                              border: `0.5px solid ${isActive ? '#639922' : '#eee'}`,
                              opacity: isExpired ? 0.65 : 1,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
                                  Заезд #{s.session_number}
                                </span>
                                <span style={{ fontSize: 13, color: '#888' }}>
                                  {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)} МСК
                                </span>
                                <Badge color={s.session_type === 'kids' ? 'green' : 'blue'}>
                                  {SESSION_TYPE_LABELS[s.session_type]}
                                </Badge>
                                {isActive  && <Badge color="teal">🟢 Идёт сейчас</Badge>}
                                {isExpired && <Badge color="gray">Завершён</Badge>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 13, color: isFull ? '#A32D2D' : '#888' }}>
                                  {isFull ? 'Мест нет' : `${s.available_slots} из ${s.max_participants} мест`}
                                </span>
                                <span style={{ fontWeight: 600, fontSize: 14, color: '#222' }}>
                                  {fmtPrice(s.price)}
                                </span>
                                {user.role !== 'admin' && !alreadyBooked && isBookable && !isFull && (
                                  <Btn variant="primary"
                                    onClick={() => setBookingModal({ session: s, kartodrome: k })}>
                                    Забронировать
                                  </Btn>
                                )}
                                {user.role !== 'admin' && alreadyBooked && (
                                  <Badge color="teal">Забронировано</Badge>
                                )}
                                {user.role !== 'admin' && !alreadyBooked && !isBookable && !isExpired && (
                                  <Badge color="amber">Уже началось</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Booking confirmation modal */}
      <Modal open={!!bookingModal} onClose={() => setBookingModal(null)} title="Подтверждение бронирования">
        {bookingModal && (
          <div>
            <div style={{ display: 'grid', gap: 8, marginBottom: '1.25rem',
              background: '#f9f9f9', borderRadius: 8, padding: '1rem' }}>
              {([
                ['Картодром', bookingModal.kartodrome.name],
                ['Тип', SESSION_TYPE_LABELS[bookingModal.session.session_type]],
                ['Дата', bookingModal.session.date],
                ['Время (МСК)', `${bookingModal.session.start_time.slice(0, 5)} – ${bookingModal.session.end_time.slice(0, 5)}`],
                ['Стоимость', fmtPrice(bookingModal.session.price)],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#888' }}>{label}</span>
                  <span style={{ fontWeight: 500, color: '#222' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn onClick={() => setBookingModal(null)}>Отмена</Btn>
              <Btn variant="primary" onClick={confirmBooking} disabled={booking}>
                {booking ? '...' : 'Подтвердить'}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
