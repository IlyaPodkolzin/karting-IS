import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Btn, Input, Card, ErrorMsg } from '@/components/common';

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Введите имя'); setLoading(false); return; }
        await register(name, email, password);
      }
      navigate('/kartodromes');
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Ошибка входа. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #dbeeff 0%, #f0f4ff 100%)' }}>
      <Card style={{ width: 380, maxWidth: '95vw' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#185FA5' }}>KartBook</h1>
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>Система бронирования картинга</p>
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', background: '#f5f5f5', borderRadius: 8, padding: 4 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
              flex: 1, padding: '7px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#333' : '#888',
              boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s',
            }}>{m === 'login' ? 'Войти' : 'Регистрация'}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'register' && <Input value={name} onChange={setName} placeholder="Ваше имя" />}
          <Input value={email} onChange={setEmail} placeholder="Email" type="email" />
          <Input value={password} onChange={setPassword} placeholder="Пароль" type="password" />
          {error && <ErrorMsg msg={error} />}
          <Btn variant="primary" onClick={handleSubmit} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </Btn>
          {mode === 'login' && (
            <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 1.8, marginTop: 4 }}>
              Демо: <b>admin@kartbook.ru</b> / admin123<br />
              Клиент: <b>ivan@mail.ru</b> / user123
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
