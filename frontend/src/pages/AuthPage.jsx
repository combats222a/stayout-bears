import { useState } from 'react';
import { api } from '../utils/api';

// ── Режимы: login | register | forgot | reset ────────────────────────────────
export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ game_nick: '', email: '', password: '', code: '', newPassword: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState(''); // сохраняем email для шага 2

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setError('');
    setInfo('');
  }

  function switchMode(m) {
    setMode(m);
    setError('');
    setInfo('');
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      if (mode === 'login') {
        const data = await api.post('/auth/login', { login: form.email, password: form.password });
        localStorage.setItem('token', data.token);
        onAuth(data.user, data.token);

      } else if (mode === 'register') {
        if (!form.game_nick.trim()) { setError('Игровой ник обязателен'); return; }
        const data = await api.post('/auth/register', {
          game_nick: form.game_nick,
          email: form.email,
          password: form.password,
        });
        localStorage.setItem('token', data.token);
        onAuth(data.user, data.token);

      } else if (mode === 'forgot') {
        await api.post('/auth/forgot-password', { email: form.email });
        setResetEmail(form.email);
        setInfo(`Код отправлен на ${form.email}. Проверь почту.`);
        setMode('reset');

      } else if (mode === 'reset') {
        await api.post('/auth/reset-password', {
          email: resetEmail,
          code: form.code,
          newPassword: form.newPassword,
        });
        setInfo('Пароль изменён! Теперь можешь войти.');
        setMode('login');
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
        <div className="auth-logo">🐻‍❄️</div>
        <h1 className="auth-title">Bear Tracker</h1>
        <p className="auth-sub">Stay Out · Новая Земля</p>

        {/* Tabs: только для login/register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="auth-tabs">
            <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>Войти</button>
            <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>Регистрация</button>
          </div>
        )}

        {/* Forgot / reset header */}
        {mode === 'forgot' && (
          <div className="auth-tabs">
            <div className="auth-mode-title">🔑 Восстановление пароля</div>
          </div>
        )}
        {mode === 'reset' && (
          <div className="auth-tabs">
            <div className="auth-mode-title">🔑 Новый пароль</div>
          </div>
        )}

        <form onSubmit={submit} className="auth-form">

          {/* LOGIN */}
          {mode === 'login' && (
            <>
              <input className="input" placeholder="Email" type="email"
                value={form.email} onChange={e => set('email', e.target.value)}
                required autoComplete="email" />
              <input className="input" placeholder="Пароль" type="password"
                value={form.password} onChange={e => set('password', e.target.value)}
                required minLength={6} autoComplete="current-password" />
            </>
          )}

          {/* REGISTER */}
          {mode === 'register' && (
            <>
              <input className="input" placeholder="Игровой ник (виден другим игрокам)"
                value={form.game_nick} onChange={e => set('game_nick', e.target.value)}
                required minLength={2} maxLength={32} />
              <input className="input" placeholder="Email" type="email"
                value={form.email} onChange={e => set('email', e.target.value)}
                required autoComplete="email" />
              <input className="input" placeholder="Пароль" type="password"
                value={form.password} onChange={e => set('password', e.target.value)}
                required minLength={6} autoComplete="new-password" />
            </>
          )}

          {/* FORGOT PASSWORD — step 1 */}
          {mode === 'forgot' && (
            <input className="input" placeholder="Твой email" type="email"
              value={form.email} onChange={e => set('email', e.target.value)}
              required autoComplete="email" />
          )}

          {/* RESET PASSWORD — step 2 */}
          {mode === 'reset' && (
            <>
              <input className="input input-mono" placeholder="Код из письма (6 цифр)"
                value={form.code} onChange={e => set('code', e.target.value)}
                required maxLength={6} />
              <input className="input" placeholder="Новый пароль" type="password"
                value={form.newPassword} onChange={e => set('newPassword', e.target.value)}
                required minLength={6} />
            </>
          )}

          {error && <div className="error-msg">{error}</div>}
          {info  && <div className="info-msg">{info}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Загрузка...' :
              mode === 'login'    ? 'Войти' :
              mode === 'register' ? 'Создать аккаунт' :
              mode === 'forgot'   ? 'Отправить код' :
              'Сохранить пароль'}
          </button>
        </form>

        {/* Forgot password link */}
        {mode === 'login' && (
          <button className="auth-forgot-link" onClick={() => switchMode('forgot')}>
            Забыл пароль?
          </button>
        )}

        {/* Back to login */}
        {(mode === 'forgot' || mode === 'reset') && (
          <button className="auth-forgot-link" onClick={() => switchMode('login')}>
            ← Назад к входу
          </button>
        )}
      </div>
    </div>
  );
}
