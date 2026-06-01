import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User } from '@/types';
import { Avatar } from '@/components/common';

interface Props { user: User; onLogout: () => void; }

const CLIENT_NAV = [
  { path: '/kartodromes', icon: '🏁', label: 'Картодромы' },
  { path: '/bookings',    icon: '📋', label: 'Мои брони' },
  { path: '/statistics',  icon: '📊', label: 'Статистика' },
  { path: '/profile',     icon: '👤', label: 'Профиль' },
];
const ADMIN_NAV = [
  { path: '/kartodromes',      icon: '🏁',  label: 'Картодромы' },
  { path: '/admin/bookings',   icon: '📋',  label: 'Бронирования' },
  { path: '/admin/users',      icon: '👥',  label: 'Пользователи' },
  { path: '/admin/analytics',  icon: '📊',  label: 'Аналитика' },
  { path: '/admin/karts',      icon: '🏎️', label: 'Карты' },
  { path: '/admin/sessions',   icon: '🗓️', label: 'Заезды' },
];

export function Sidebar({ user, onLogout }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const nav = user.role === 'admin' ? ADMIN_NAV : CLIENT_NAV;

  return (
    <div style={{ width: 220, background: '#fff', borderRight: '0.5px solid #e5e5e5',
      display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>

      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '0.5px solid #e5e5e5' }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, color: '#185FA5' }}>⚡ KartBook</div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Система бронирования</div>
      </div>

      {/* Nav links */}
      <div style={{ padding: '0.5rem 0', flex: 1 }}>
        {nav.map(item => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <div key={item.path} onClick={() => navigate(item.path)} style={{
              padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              background: active ? '#E6F1FB' : 'transparent',
              color: active ? '#185FA5' : '#444',
              fontSize: 14, fontWeight: active ? 600 : 400,
              borderRight: active ? '2.5px solid #185FA5' : '2.5px solid transparent',
              transition: 'all 0.15s',
            }}>
              <span>{item.icon}</span> {item.label}
            </div>
          );
        })}
      </div>

      {/* User footer — now shows avatar photo if available */}
      <div style={{ padding: '1rem', borderTop: '0.5px solid #e5e5e5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {/* avatarUrl prop enables photo display; falls back to initials */}
          <Avatar name={user.name} avatarUrl={user.avatar_url} size={36} />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: '#888' }}>
              {user.role === 'admin' ? 'Администратор' : 'Клиент'}
            </div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: '100%', padding: '7px', borderRadius: 8,
          border: '0.5px solid #ddd', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#666' }}>
          Выйти
        </button>
      </div>
    </div>
  );
}
