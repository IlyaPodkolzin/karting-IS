import React from 'react';
import type { Toast } from '@/hooks/useToast';

const COLORS = {
  success: { bg: '#E1F5EE', text: '#0F6E56', border: '#1D9E75' },
  error:   { bg: '#FCEBEB', text: '#A32D2D', border: '#E24B4A' },
  info:    { bg: '#E6F1FB', text: '#185FA5', border: '#378ADD' },
};

export function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999 }}>
      {toasts.map(t => {
        const c = COLORS[t.type];
        return (
          <div key={t.id} onClick={() => onDismiss(t.id)} style={{
            padding: '10px 18px', borderRadius: 10, background: c.bg, color: c.text,
            border: `0.5px solid ${c.border}`, fontSize: 14, fontWeight: 500,
            cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', animation: 'fadeIn 0.2s ease',
          }}>
            {t.message}
          </div>
        );
      })}
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  );
}
