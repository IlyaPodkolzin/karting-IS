import React, { useState } from 'react';
import { usersApi } from '@/api/users';
import type { User } from '@/types';
import { Card, Btn, Input, Badge, Avatar } from '@/components/common';

interface Props { user: User; onUpdate: (u: User) => void; onToast: (msg: string, type?: 'success'|'error'|'info') => void; }

export function ProfilePage({ user, onUpdate, onToast }: Props) {
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { onToast('Имя не может быть пустым', 'error'); return; }
    setSaving(true);
    try {
      const updated = await usersApi.updateMe(name);
      onUpdate(updated);
      onToast('Профиль обновлён');
    } catch {
      onToast('Ошибка сохранения', 'error');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 1.25rem', color: '#222' }}>Профиль</h1>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.5rem' }}>
          <Avatar name={user.name} size={52} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 17, color: '#222' }}>{user.name}</div>
            <div style={{ marginTop: 4 }}>
              <Badge color={user.role === 'admin' ? 'amber' : 'blue'}>
                {user.role === 'admin' ? 'Администратор' : 'Клиент'}
              </Badge>
            </div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
              С нами с {new Date(user.created_at).toLocaleDateString('ru')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 4 }}>Имя</label>
            <Input value={name} onChange={setName} placeholder="Ваше имя" />
          </div>
          <div>
            <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 4 }}>Email</label>
            <Input value={user.email} onChange={() => {}} style={{ opacity: 0.6 }} />
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>Email нельзя изменить</div>
          </div>
          <Btn variant="primary" onClick={handleSave} disabled={saving} style={{ marginTop: 4 }}>
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </Btn>
        </div>
      </Card>
    </div>
  );
}
