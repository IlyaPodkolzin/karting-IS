import React, { useEffect, useRef, useState } from 'react';
import { kartsApi } from '@/api/karts';
import { kartodromesApi } from '@/api/kartodromes';
import { uploadsApi } from '@/api/uploads';
import type { Kart, Kartodrome } from '@/types';
import { Card, Badge, Select, Btn, Modal, Input, Spinner, KART_STATUS_LABELS, KART_STATUS_COLORS } from '@/components/common';

const API_BASE = import.meta.env.VITE_API_URL || '';
const STATUS_OPTIONS = Object.entries(KART_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));

interface Props { onToast: (msg: string, type?: 'success'|'error'|'info') => void; }

export function AdminKartsPage({ onToast }: Props) {
  const [karts, setKarts] = useState<Kart[]>([]);
  const [kartodromes, setKartodromes] = useState<Kartodrome[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ number: '', type: 'Взрослый', engine_type: 'Бензин', kartodrome_id: '' });
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([kartsApi.getAll(), kartodromesApi.getAll()])
      .then(([ks, kds]) => { setKarts(ks); setKartodromes(kds); })
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(kart: Kart, status: string) {
    try {
      const updated = await kartsApi.updateStatus(kart.id, status);
      setKarts(prev => prev.map(k => k.id === kart.id ? updated : k));
      onToast('Статус обновлён');
    } catch { onToast('Ошибка', 'error'); }
  }

  async function handleAdd() {
    if (!form.number || !form.kartodrome_id) { onToast('Заполните все поля', 'error'); return; }
    try {
      const created = await kartsApi.create({ ...form, kartodrome_id: Number(form.kartodrome_id) });
      setKarts(prev => [...prev, created]);
      setAddModal(false);
      setForm({ number: '', type: 'Взрослый', engine_type: 'Бензин', kartodrome_id: '' });
      onToast('Карт добавлен');
    } catch { onToast('Ошибка создания', 'error'); }
  }

  function triggerUpload(kartId: number) {
    setUploadTarget(kartId);
    fileRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    setUploadingId(uploadTarget);
    try {
      const { image_url } = await uploadsApi.uploadKartImage(uploadTarget, file);
      setKarts(prev => prev.map(k => k.id === uploadTarget ? { ...k, image_url } : k));
      onToast('Фото обновлено');
    } catch { onToast('Ошибка загрузки', 'error'); }
    finally { setUploadingId(null); e.target.value = ''; }
  }

  const getKartodromeName = (id: number) => kartodromes.find(k => k.id === id)?.name || `#${id}`;

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#222' }}>Управление картами</h1>
        <Btn variant="primary" onClick={() => setAddModal(true)}>+ Добавить карт</Btn>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      <div style={{ display: 'grid', gap: 10 }}>
        {karts.map(k => (
          <Card key={k.id} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 0 }}>
              {/* Kart thumbnail */}
              <div style={{ width: 80, flexShrink: 0, background: '#f0f0f0', position: 'relative', cursor: 'pointer' }}
                onClick={() => triggerUpload(k.id)}>
                {k.image_url
                  ? <img src={`${API_BASE}${k.image_url}`} alt={k.number}
                      style={{ width: 80, height: '100%', objectFit: 'cover', display: 'block', minHeight: 70 }} />
                  : <div style={{ width: 80, minHeight: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏎️</div>
                }
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                  {uploadingId === k.id ? '⏳' : '📷'}
                </div>
              </div>
              <div style={{ flex: 1, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#222' }}>Карт {k.number}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {k.type} · {k.engine_type} · {getKartodromeName(k.kartodrome_id)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge color={KART_STATUS_COLORS[k.status]}>{KART_STATUS_LABELS[k.status]}</Badge>
                  <Select value={k.status} onChange={v => handleStatusChange(k, v)}
                    options={STATUS_OPTIONS} style={{ width: 140 }} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Добавить карт">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Номер карта', key: 'number', placeholder: 'К-05' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 4 }}>{label}</label>
              <Input value={(form as any)[key]} onChange={v => setForm(f => ({ ...f, [key]: v }))} placeholder={placeholder} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 4 }}>Тип</label>
            <Select value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}
              options={[{ value: 'Взрослый', label: 'Взрослый' }, { value: 'Детский', label: 'Детский' }]} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 4 }}>Двигатель</label>
            <Select value={form.engine_type} onChange={v => setForm(f => ({ ...f, engine_type: v }))}
              options={[{ value: 'Бензин', label: 'Бензин' }, { value: 'Электро', label: 'Электро' }]} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 4 }}>Картодром</label>
            <Select value={form.kartodrome_id} onChange={v => setForm(f => ({ ...f, kartodrome_id: v }))}
              options={[{ value: '', label: '— Выберите —' }, ...kartodromes.map(k => ({ value: String(k.id), label: k.name }))]} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Btn onClick={() => setAddModal(false)}>Отмена</Btn>
            <Btn variant="primary" onClick={handleAdd}>Добавить</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
