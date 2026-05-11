import React, { useEffect, useState } from 'react';
import { statisticsApi } from '@/api/statistics';
import { lapsApi } from '@/api/laps';
import { bookingsApi } from '@/api/bookings';
import { kartodromesApi } from '@/api/kartodromes';
import type { Statistic, Kartodrome, Lap, Booking } from '@/types';
import { Card, StatCard, Spinner, fmtLap } from '@/components/common';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { User } from '@/types';

interface Props { user: User; }

export function StatisticsPage({ user }: Props) {
  const [stats, setStats] = useState<Statistic[]>([]);
  const [kartodromes, setKartodromes] = useState<Kartodrome[]>([]);
  const [lapsByKartodrome, setLapsByKartodrome] = useState<Record<number, Lap[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([statisticsApi.getMy(), kartodromesApi.getAll(), bookingsApi.getMy()])
      .then(async ([stats, kds, bookings]) => {
        setStats(stats);
        setKartodromes(kds);
        // Load laps for each completed booking
        const completed = bookings.filter(b => b.status === 'completed');
        const lapMap: Record<number, Lap[]> = {};
        for (const bk of completed) {
          const s = bk.session;
          if (!s) continue;
          const laps = await lapsApi.getByBooking(bk.id);
          const kid = s.kartodrome_id;
          lapMap[kid] = [...(lapMap[kid] || []), ...laps];
        }
        setLapsByKartodrome(lapMap);
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
        <StatCard label="Заездов" value={stats.reduce((a,s) => a + (s.total_laps > 0 ? 1 : 0), 0)} color="purple" />
      </div>

      {stats.length === 0 && (
        <Card><div style={{ color: '#aaa', fontSize: 14, textAlign: 'center', padding: '2rem' }}>
          Нет данных. Завершите заезд, чтобы увидеть статистику.
        </div></Card>
      )}

      {stats.map(s => {
        const k = kartodromes.find(kk => kk.id === s.kartodrome_id);
        const laps = lapsByKartodrome[s.kartodrome_id] || [];
        const chartData = laps.map((l, i) => ({ name: `#${l.lap_number}`, time: l.lap_time }));
        return (
          <Card key={s.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: '1rem', color: '#222' }}>🏁 {k?.name || `Картодром #${s.kartodrome_id}`}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: '1.25rem' }}>
              <StatCard label="Лучший круг" value={fmtLap(s.best_lap_time)} color="amber" />
              <StatCard label="Средний круг" value={fmtLap(s.average_lap_time)} color="blue" />
              <StatCard label="Всего кругов" value={s.total_laps} color="teal" />
            </div>
            {chartData.length > 1 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 8 }}>Динамика времён кругов</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={['auto','auto']} tick={{ fontSize: 11 }} unit=" с" />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(2)} с`, 'Время']} />
                    <Line type="monotone" dataKey="time" stroke="#185FA5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {laps.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 8 }}>Все круги</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {laps.map(l => {
                    const isBest = l.lap_time === s.best_lap_time;
                    return (
                      <span key={l.id} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                        background: isBest ? '#FAEEDA' : '#f5f5f5',
                        color: isBest ? '#854F0B' : '#555',
                        border: `0.5px solid ${isBest ? '#BA7517' : '#e5e5e5'}` }}>
                        #{l.lap_number} · {l.lap_time.toFixed(2)} с {isBest ? '🏆' : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
