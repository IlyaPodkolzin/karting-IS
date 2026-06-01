import React, { useEffect, useState } from 'react';
import { statisticsApi } from '@/api/statistics';
import { lapsApi } from '@/api/laps';
import { bookingsApi } from '@/api/bookings';
import { kartodromesApi } from '@/api/kartodromes';
import type { Statistic, Kartodrome, Lap, Booking } from '@/types';
import { Card, StatCard, Spinner, fmtLap, Select } from '@/components/common';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import type { User } from '@/types';

interface Props { user: User; }

interface BookingWithLaps extends Booking { laps: Lap[]; }

export function StatisticsPage({ user }: Props) {
  const [stats, setStats] = useState<Statistic[]>([]);
  const [kartodromes, setKartodromes] = useState<Kartodrome[]>([]);
  const [completedBookings, setCompletedBookings] = useState<BookingWithLaps[]>([]);
  // Per-kartodrome selected booking id (null = show aggregate)
  const [selectedBookingId, setSelectedBookingId] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([statisticsApi.getMy(), kartodromesApi.getAll(), bookingsApi.getMy()])
      .then(async ([stats, kds, bookings]) => {
        setStats(stats);
        setKartodromes(kds);
        const completed = bookings.filter(b => b.status === 'completed');
        const withLaps: BookingWithLaps[] = await Promise.all(
          completed.map(async bk => {
            const laps = await lapsApi.getByBooking(bk.id);
            return { ...bk, laps };
          })
        );
        setCompletedBookings(withLaps);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalLaps = stats.reduce((a, s) => a + s.total_laps, 0);
  const bestOverall = stats.length ? Math.min(...stats.map(s => s.best_lap_time ?? Infinity)) : null;

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 860 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 1.25rem', color: '#222' }}>Моя статистика</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12, marginBottom: '1.5rem' }}>
        <StatCard label="Всего кругов" value={totalLaps} color="blue" />
        <StatCard label="Картодромов" value={stats.length} color="teal" />
        <StatCard label="Лучший круг" value={bestOverall && isFinite(bestOverall) ? fmtLap(bestOverall) : '—'} color="amber" />
        <StatCard label="Заездов" value={completedBookings.length} color="purple" />
      </div>

      {stats.length === 0 && (
        <Card><div style={{ color: '#aaa', fontSize: 14, textAlign: 'center', padding: '2rem' }}>
          Нет данных. Завершите заезд чтобы увидеть статистику.
        </div></Card>
      )}

      {stats.map(s => {
        const k = kartodromes.find(kk => kk.id === s.kartodrome_id);
        // All completed bookings for this kartodrome
        const kartoBookings = completedBookings.filter(
          b => b.session?.kartodrome_id === s.kartodrome_id
        );
        const selectedId = selectedBookingId[s.kartodrome_id] ?? 'all';
        const selectedBooking = selectedId !== 'all'
          ? kartoBookings.find(b => String(b.id) === selectedId)
          : null;

        // Laps to display
        const displayLaps: Lap[] = selectedBooking
          ? selectedBooking.laps
          : kartoBookings.flatMap(b => b.laps);

        // Best lap in current view
        const viewBest = displayLaps.length ? Math.min(...displayLaps.map(l => l.lap_time)) : null;
        const viewAvg = displayLaps.length
          ? displayLaps.reduce((a, l) => a + l.lap_time, 0) / displayLaps.length
          : null;

        const chartData = displayLaps.map(l => ({ name: `#${l.lap_number}`, time: l.lap_time }));

        const bookingOptions = [
          { value: 'all', label: 'Все заезды (агрегировано)' },
          ...kartoBookings.map(b => ({
            value: String(b.id),
            label: `Заезд #${b.id}${b.session ? ` — ${b.session.date} ${b.session.start_time.slice(0,5)}` : ''}`,
          })),
        ];

        return (
          <Card key={s.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: '0.75rem', color: '#222' }}>
              🏁 {k?.name || `Картодром #${s.kartodrome_id}`}
            </div>

            {/* Booking selector */}
            {kartoBookings.length > 1 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Выберите заезд для графика:</div>
                <Select
                  value={selectedId}
                  onChange={v => setSelectedBookingId(prev => ({ ...prev, [s.kartodrome_id]: v }))}
                  options={bookingOptions}
                  style={{ maxWidth: 420 }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: '1.25rem' }}>
              <StatCard label="Лучший (общий)" value={fmtLap(s.best_lap_time)} color="amber" />
              <StatCard label="Средний (общий)" value={fmtLap(s.average_lap_time)} color="blue" />
              <StatCard label="Всего кругов" value={s.total_laps} color="teal" />
              {selectedId !== 'all' && viewBest !== null && (
                <StatCard label={`Лучший (заезд)`} value={fmtLap(viewBest)} color="purple" />
              )}
            </div>

            {chartData.length > 1 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 8 }}>
                  {selectedId === 'all' ? 'Все круги' : `Круги заезда #${selectedId}`}
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} unit=" с" />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)} с`, 'Время']} />
                    {viewBest !== null && (
                      <ReferenceLine y={viewBest} stroke="#BA7517" strokeDasharray="4 2"
                        label={{ value: `Лучший: ${viewBest.toFixed(2)} с`, position: 'insideTopRight', fontSize: 10, fill: '#BA7517' }} />
                    )}
                    <Line type="monotone" dataKey="time" stroke="#185FA5" strokeWidth={2}
                      dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {displayLaps.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 8 }}>Детализация кругов</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {displayLaps.map(l => {
                    const isBest = l.lap_time === viewBest;
                    return (
                      <span key={l.id} style={{
                        padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                        background: isBest ? '#FAEEDA' : '#f5f5f5',
                        color: isBest ? '#854F0B' : '#555',
                        border: `0.5px solid ${isBest ? '#BA7517' : '#e5e5e5'}`,
                      }}>
                        #{l.lap_number} · {l.lap_time.toFixed(2)} с {isBest ? '🏆' : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {displayLaps.length === 0 && (
              <div style={{ fontSize: 13, color: '#aaa', padding: '0.5rem 0' }}>
                {selectedId === 'all' ? 'Нет данных о кругах' : 'Нет кругов для этого заезда'}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
