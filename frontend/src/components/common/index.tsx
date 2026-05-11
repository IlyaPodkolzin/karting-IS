import React, { ReactNode } from 'react';

// ── Colors ──────────────────────────────────────────────────────────────────
const C = {
  teal:   { bg: '#E1F5EE', text: '#0F6E56', border: '#1D9E75' },
  blue:   { bg: '#E6F1FB', text: '#185FA5', border: '#378ADD' },
  amber:  { bg: '#FAEEDA', text: '#854F0B', border: '#BA7517' },
  red:    { bg: '#FCEBEB', text: '#A32D2D', border: '#E24B4A' },
  green:  { bg: '#EAF3DE', text: '#3B6D11', border: '#639922' },
  gray:   { bg: '#F1EFE8', text: '#5F5E5A', border: '#888780' },
  purple: { bg: '#EEEDFE', text: '#3C3489', border: '#534AB7' },
} as const;

export type ColorKey = keyof typeof C;

// ── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ color = 'gray', children }: { color?: ColorKey; children: ReactNode }) {
  const c = C[color];
  return (
    <span style={{ background: c.bg, color: c.text, border: `0.5px solid ${c.border}`,
      borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', display: 'inline-block' }}>
      {children}
    </span>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'default' | 'primary' | 'danger' | 'ghost';

const BTN_STYLES: Record<BtnVariant, React.CSSProperties> = {
  default: { background: 'var(--color-background-secondary,#f5f5f5)', color: '#333', borderColor: '#ccc' },
  primary: { background: '#185FA5', color: '#fff', borderColor: '#185FA5' },
  danger:  { background: '#FCEBEB', color: '#A32D2D', borderColor: '#E24B4A' },
  ghost:   { background: 'transparent', color: '#888', borderColor: 'transparent' },
};

export function Btn({ onClick, variant = 'default', disabled, children, style = {}, type = 'button' }:
  { onClick?: () => void; variant?: BtnVariant; disabled?: boolean; children: ReactNode; style?: React.CSSProperties; type?: 'button'|'submit' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer', border: '0.5px solid',
      transition: 'all 0.15s', opacity: disabled ? 0.5 : 1, ...BTN_STYLES[variant], ...style }}>
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, type = 'text', style = {}, required }:
  { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; style?: React.CSSProperties; required?: boolean }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff',
        color: '#333', fontSize: 14, width: '100%', boxSizing: 'border-box', ...style }} />
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ value, onChange, options, style = {} }:
  { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; style?: React.CSSProperties }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff',
        color: '#333', fontSize: 14, width: '100%', boxSizing: 'border-box', ...style }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }:
  { children: ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', border: '0.5px solid #e5e5e5',
      borderRadius: 12, padding: '1rem 1.25rem', cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 480 }:
  { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', width: '100%',
        maxWidth: width, maxHeight: '85vh', overflowY: 'auto', border: '0.5px solid #ddd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: '#888', lineHeight: 1, padding: '0 4px' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: C.blue.bg, color: C.blue.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35,
      fontWeight: 600, flexShrink: 0 }}>{initials}</div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color = 'blue' }: { label: string; value: string | number; color?: ColorKey }) {
  const c = C[color];
  return (
    <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '1rem', textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: c.text }}>{value}</div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e5e5e5',
        borderTop: '3px solid #185FA5', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── ErrorMessage ──────────────────────────────────────────────────────────────
export function ErrorMsg({ msg }: { msg: string }) {
  return <div style={{ color: '#A32D2D', background: '#FCEBEB', border: '0.5px solid #E24B4A',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 8 }}>{msg}</div>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидание', confirmed: 'Подтверждено', cancelled: 'Отменено', completed: 'Завершено'
};
export const BOOKING_STATUS_COLORS: Record<string, ColorKey> = {
  pending: 'amber', confirmed: 'teal', cancelled: 'red', completed: 'blue'
};
export const SESSION_TYPE_LABELS: Record<string, string> = { usual: 'Взрослый', kids: 'Детский' };
export const KART_STATUS_LABELS: Record<string, string> = {
  available: 'Доступен', booked: 'Занят', maintenance: 'ТО', retired: 'Списан'
};
export const KART_STATUS_COLORS: Record<string, ColorKey> = {
  available: 'teal', booked: 'amber', maintenance: 'red', retired: 'gray'
};

export function formatDate(d: string) {
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const dt = new Date(d);
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}
export function fmtLap(t: number | null | undefined) { return t != null ? `${t.toFixed(2)} с` : '—'; }
export function fmtPrice(p: number) { return `${p.toLocaleString('ru')} ₽`; }
