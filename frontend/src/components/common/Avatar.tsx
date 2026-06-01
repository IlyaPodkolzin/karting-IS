import React from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Props {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}

export function Avatar({ name, avatarUrl, size = 36 }: Props) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (avatarUrl) {
    const src = avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE}${avatarUrl}`;
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '2px solid #378ADD',
        }}
      />
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: '#E6F1FB',
      color: '#185FA5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.35,
      fontWeight: 600,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}
