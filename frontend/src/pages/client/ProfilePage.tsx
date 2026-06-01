import React, { useRef, useState } from 'react';
import { usersApi } from '@/api/users';
import { uploadsApi } from '@/api/uploads';
import type { User } from '@/types';
import { Card, Btn, Input, Badge } from '@/components/common';
import { Avatar } from '@/components/common';

interface Props {
  user: User;
  onUpdate: (u: User) => void;   // wired to AuthContext.updateUser
  onToast: (msg: string, type?: 'success'|'error'|'info') => void;
}

export function ProfilePage({ user, onUpdate, onToast }: Props) {
  const [name, setName] = useState(user.name);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    if (!name.trim()) { onToast('Имя не может быть пустым', 'error'); return; }
    setSaving(true);
    try {
      const updated = await usersApi.updateMe(name);
      // Preserve avatar_url because the server's UserOut may or may not include it;
      // merge with local user to guarantee avatar isn't lost.
      onUpdate({ ...user, ...updated });
      onToast('Профиль обновлён');
    } catch { onToast('Ошибка сохранения', 'error'); }
    finally { setSaving(false); }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { image_url } = await uploadsApi.uploadUserAvatar(user.id, file);
      // Merge new avatar_url into current user and push to AuthContext + localStorage
      onUpdate({ ...user, avatar_url: image_url });
      onToast('Аватар обновлён');
    } catch { onToast('Ошибка загрузки аватара', 'error'); }
    finally { setUploading(false); e.target.value = ''; }
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 1.25rem', color: '#222' }}>Профиль</h1>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>

          {/* Clickable avatar — shows photo or initials */}
          <div style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => fileRef.current?.click()}>
            <Avatar name={user.name} avatarUrl={user.avatar_url} size={72} />
            {/* Hover/upload overlay */}
            <div
              className="avatar-overlay"
              style={{ position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20, opacity: uploading ? 1 : 0,
                transition: 'opacity 0.15s' }}
              onMouseEnter={e => { if (!uploading) e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={e => { if (!uploading) e.currentTarget.style.opacity = '0'; }}>
              {uploading ? '⏳' : '📷'}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#222' }}>{user.name}</div>
            <div style={{ marginTop: 4 }}>
              <Badge color={user.role === 'admin' ? 'amber' : 'blue'}>
                {user.role === 'admin' ? 'Администратор' : 'Клиент'}
              </Badge>
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>
              Нажмите на фото для загрузки нового
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
