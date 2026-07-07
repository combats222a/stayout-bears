import { useState } from 'react';
import { api } from '../utils/api';

export default function AuthPage({ onAuth, onBack }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ game_nick: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const data = await api.post('/auth/login', { login: form.email, password: form.password });
        localStorage.setItem('token', data.token);
        onAuth(data.user, data.token);
      } else {
        if (!form.game_nick.trim()) { setError('Игровой ник обязателен'); return; }
        const data = await api.post('/auth/register', {
          game_nick: form.game_nick,
          email: form.email,
          password: form.password,
        });
        localStorage.setItem('token', data.token);
        onAuth(data.user, data.token);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {onBack && (
          <button type="button" className="auth-back-link" onClick={onBack}>
            ← На главную
          </button>
        )}
        <div className="auth-logo">🐻‍❄️</div>
        <h1 className="auth-title">Bear Tracker</h1>
        <p className="auth-sub">Stay Out · Новая Земля</p>

        <div className="auth-tabs">
          <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Войти</button>
          <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>Регистрация</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <input className="input" placeholder="Игровой ник (виден другим игрокам)"
              value={form.game_nick} onChange={e => set('game_nick', e.target.value)}
              required minLength={2} maxLength={32} />
          )}

          <input className="input" placeholder="Email" type="email"
            value={form.email} onChange={e => set('email', e.target.value)}
            required autoComplete="email" />

          <input className="input" placeholder="Пароль" type="password"
            value={form.password} onChange={e => set('password', e.target.value)}
            required minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

          {error && <div className="error-msg">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
      </div>
    </div>
  );
}
