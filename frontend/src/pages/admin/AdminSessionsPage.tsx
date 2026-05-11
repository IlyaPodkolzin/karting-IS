import React, { useEffect, useState } from 'react';
import { sessionsApi } from '@/api/sessions';
import { kartodromesApi } from '@/api/kartodromes';
import type { Session, Kartodrome } from '@/types';
import { Card, Badge, Btn, Modal, Input, Select, Spinner, SESSION_TYPE_LABELS } from '@/components/common';

interface Props { onToast: (msg: string, type?: 'success'|'error'|'info') => void; }

export function AdminSessionsPage({ onToast }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [kartodromes, setKartodromes] = useState<Kartodrome[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [filterKartodrome, setFilterKartodrome] = useState('');
  const [form, setForm] = useState({
    kartodrome_id: '', session_number: '1', session_type: 'usual',
    date: new Date().toISOString().slice(0, 10),
    start_time: '10:00', end_time: '10:20', max_participants: '8', price: '1200'
  });

  useEffect(() => {
    Promise.all([sessionsApi.getAll(), kartodromesApi.getAll()])
      .then(([ss, kds]) => { setSessions(ss); setKartodromes(kds); })
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!form.kartodrome_id) { onToast('Выберите картодром', 'error'); return; }
    try {
      const created = await sessionsApi.create({
        kartodrome_id: Number(form.kartodrome_id),
        session_number: Number(form.session_number),
        session_type: form.session_type as 'usual' | 'kids',
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        max_participants: Number(form.max_participants),
        price: Number(form.price),
      });
      setSessions(prev => [...prev, created]);
      setAddModal(false);
      onToast('Заезд добавлен');
    } catch (e: any) { onToast(e?.response?.data?.detail || 'Ошибка', 'error'); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить заезд?')) return;
    try {
      await sessionsApi.delete(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      onToast('Заезд удалён', 'info');
    } catch (e: any) { onToast(e?.response?.data?.detail || 'Ошибка удаления', 'error'); }
  }

  const getKartodromeName = (id: number) => kartodromes.find(k => k.id === id)?.name || `#${id}`;
  const filtered = filterKartodrome ? sessions.filter(s => s.kartodrome_id === Number(filterKartodrome)) : sessions;

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#222' }}>Управление заездами</h1>
        <Btn variant="primary" onClick={() => setAddModal(true)}>+ Добавить заезд</Btn>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <Select value={filterKartodrome} onChange={setFilterKartodrome}
          options={[{ value: '', label: 'Все картодромы' }, ...kartodromes.map(k => ({ value: String(k.id), label: k.name }))]}
          style={{ width: 260 }} />
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.length === 0 && <Card><div style={{ color: '#aaa', textAlign: 'center', padding: '1.5rem', fontSize: 14 }}>Нет заездов</div></Card>}
        {filtered.map(s => (
          <Card key={s.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#222' }}>
                  {getKartodromeName(s.kartodrome_id)} · Заезд #{s.session_number}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {s.date} · {s.start_time.slice(0,5)}–{s.end_time.slice(0,5)} · {s.max_participants} мест · {s.price.toLocaleString('ru')} ₽
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge color={s.session_type === 'kids' ? 'green' : 'blue'}>{SESSION_TYPE_LABELS[s.session_type]}</Badge>
                <Btn variant="danger" onClick={() => handleDelete(s.id)} style={{ fontSize: 12, padding: '5px 10px' }}>Удалить</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Добавить заезд">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 4 }}>Картодром</label>
            <Select value={form.kartodrome_id} onChange={v => setForm(f => ({...f, kartodrome_id: v}))}
              options={[{ value: '', label: '— Выберите —' }, ...kartodromes.map(k => ({ value: String(k.id), label: k.name }))]} />
          </div>
          {[
            { label: 'Номер заезда', key: 'session_number', type: 'number' },
            { label: 'Дата', key: 'date', type: 'date' },
            { label: 'Начало', key: 'start_time', type: 'time' },
            { label: 'Конец', key: 'end_time', type: 'time' },
            { label: 'Макс. участников', key: 'max_participants', type: 'number' },
            { label: 'Цена (₽)', key: 'price', type: 'number' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 4 }}>{label}</label>
              <Input value={(form as any)[key]} onChange={v => setForm(f => ({...f, [key]: v}))} type={type} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 4 }}>Тип</label>
            <Select value={form.session_type} onChange={v => setForm(f => ({...f, session_type: v}))}
              options={[{ value: 'usual', label: 'Взрослый' }, { value: 'kids', label: 'Детский' }]} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Btn onClick={() => setAddModal(false)}>Отмена</Btn>
          <Btn variant="primary" onClick={handleAdd}>Добавить</Btn>
        </div>
      </Modal>
    </div>
  );
}
