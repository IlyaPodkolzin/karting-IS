import React, { useEffect, useState } from 'react';
import { analyticsApi } from '@/api/analytics';
import { bookingsApi } from '@/api/bookings';
import type { AnalyticsLoad, Booking } from '@/types';
import { StatCard, Spinner, Card } from '@/components/common';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';

export function AdminAnalyticsPage() {
  const [load, setLoad] = useState<AnalyticsLoad[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.getLoad(), bookingsApi.getAll()])
      .then(([l, bks]) => { setLoad(l); setBookings(bks); })
      .finally(() => setLoading(false));
  }, []);

  const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((a, b) => a + b.total_price, 0);
  const statusCounts = bookings.reduce<Record<string, number>>((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});
  const pieData = [
    { name: 'Подтверждено', value: statusCounts['confirmed'] || 0, fill: '#1D9E75' },
    { name: 'Завершено',    value: statusCounts['completed'] || 0, fill: '#378ADD' },
    { name: 'Ожидание',    value: statusCounts['pending']   || 0, fill: '#BA7517' },
    { name: 'Отменено',    value: statusCounts['cancelled'] || 0, fill: '#E24B4A' },
  ].filter(d => d.value > 0);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 1.25rem', color: '#222' }}>Аналитика</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12, marginBottom: '1.5rem' }}>
        <StatCard label="Всего броней" value={bookings.length} color="blue" />
        <StatCard label="Выручка" value={`${revenue.toLocaleString('ru')} ₽`} color="teal" />
        <StatCard label="Завершено" value={statusCounts['completed'] || 0} color="purple" />
        <StatCard label="Отменено" value={statusCounts['cancelled'] || 0} color="red" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1.5rem' }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: '1rem', color: '#222' }}>Загруженность картодромов</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={load} margin={{ top: 4, right: 8, bottom: 24, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="kartodrome_name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Занято']} />
              <Bar dataKey="occupancy_pct" radius={[4,4,0,0]}>
                {load.map((l, i) => <Cell key={i} fill={l.occupancy_pct > 70 ? '#E24B4A' : l.occupancy_pct > 40 ? '#BA7517' : '#1D9E75'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontWeight: 600, marginBottom: '1rem', color: '#222' }}>Статусы бронирований</div>
          {pieData.length > 0
            ? <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${value}`}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            : <div style={{ color: '#aaa', textAlign: 'center', paddingTop: '3rem', fontSize: 14 }}>Нет данных</div>
          }
        </Card>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 0.75rem', color: '#333' }}>Детальная загруженность</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {load.map(l => (
          <Card key={l.kartodrome_id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: '#333' }}>{l.kartodrome_name}</div>
              <span style={{ fontWeight: 700, fontSize: 14, color: l.occupancy_pct > 70 ? '#A32D2D' : l.occupancy_pct > 40 ? '#854F0B' : '#0F6E56' }}>
                {l.occupancy_pct}%
              </span>
            </div>
            <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${l.occupancy_pct}%`, borderRadius: 4, transition: 'width 0.6s',
                background: l.occupancy_pct > 70 ? '#E24B4A' : l.occupancy_pct > 40 ? '#BA7517' : '#1D9E75' }} />
            </div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>{l.taken_slots} из {l.total_slots} слотов занято</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
