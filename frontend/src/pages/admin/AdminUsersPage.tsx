import React, { useEffect, useState } from 'react';
import { usersApi } from '@/api/users';
import { statisticsApi } from '@/api/statistics';
import { kartodromesApi } from '@/api/kartodromes';
import type { User, Statistic, Kartodrome } from '@/types';
import { Card, Badge, Btn, Modal, Spinner, Avatar, StatCard, fmtLap } from '@/components/common';

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [kartodromes, setKartodromes] = useState<Kartodrome[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsModal, setStatsModal] = useState<{ user: User; stats: Statistic[] } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    Promise.all([usersApi.getAll(), kartodromesApi.getAll()])
      .then(([us, kds]) => { setUsers(us); setKartodromes(kds); })
      .finally(() => setLoading(false));
  }, []);

  async function openStats(user: User) {
    setStatsLoading(true);
    setStatsModal({ user, stats: [] });
    const stats = await statisticsApi.getByUser(user.id);
    setStatsModal({ user, stats });
    setStatsLoading(false);
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 1.25rem', color: '#222' }}>Пользователи</h1>
      <div style={{ display: 'grid', gap: 8 }}>
        {users.map(u => (
          <Card key={u.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={u.name} avatarUrl={u.avatar_url} size={40} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#222' }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{u.email}</div>
                  <div style={{ fontSize: 11, color: '#bbb' }}>С {new Date(u.created_at).toLocaleDateString('ru')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge color={u.role === 'admin' ? 'amber' : 'blue'}>{u.role === 'admin' ? 'Администратор' : 'Клиент'}</Badge>
                {u.role === 'client' && (
                  <Btn onClick={() => openStats(u)} style={{ fontSize: 12, padding: '5px 10px' }}>Статистика 📊</Btn>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!statsModal} onClose={() => setStatsModal(null)} title={`Статистика: ${statsModal?.user.name}`} width={560}>
        {statsLoading ? <Spinner /> : statsModal && (
          statsModal.stats.length === 0
            ? <div style={{ color: '#aaa', textAlign: 'center', padding: '1.5rem', fontSize: 14 }}>Нет данных о заездах</div>
            : (
              <div style={{ display: 'grid', gap: 12 }}>
                {statsModal.stats.map(s => {
                  const k = kartodromes.find(k => k.id === s.kartodrome_id);
                  return (
                    <div key={s.id} style={{ border: '0.5px solid #eee', borderRadius: 10, padding: '1rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#222' }}>🏁 {k?.name || `Картодром #${s.kartodrome_id}`}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                        <StatCard label="Лучший круг" value={fmtLap(s.best_lap_time)} color="amber" />
                        <StatCard label="Средний круг" value={fmtLap(s.average_lap_time)} color="blue" />
                        <StatCard label="Всего кругов" value={s.total_laps} color="teal" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
        )}
      </Modal>
    </div>
  );
}
