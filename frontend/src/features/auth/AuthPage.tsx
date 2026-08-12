import { useState, FormEvent } from 'react';
import { api } from '../../utils/api';
import type { AuthUser } from '../../types/entities';
import { useI18n } from '../../i18n';

interface AuthPageProps {
  onAuth: (user: AuthUser, token: string) => void;
  onBack?: () => void;
}

export default function AuthPage({ onAuth, onBack }: AuthPageProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ game_nick: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form, val: string) {
    setForm(f => ({ ...f, [field]: val }));
    setError('');
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const data = await api.post('/auth/login', { login: form.email, password: form.password });
        localStorage.setItem('token', data.token);
        onAuth(data.user, data.token);
      } else {
        if (!form.game_nick.trim()) { setError(t('auth.nickRequired')); return; }
        const data = await api.post('/auth/register', {
          game_nick: form.game_nick,
          email: form.email,
          password: form.password,
        });
        localStorage.setItem('token', data.token);
        onAuth(data.user, data.token);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {onBack && (
          <button type="button" className="auth-back-link" onClick={onBack}>
            {t('auth.backToHome')}
          </button>
        )}
        <div className="auth-logo">🐻‍❄️</div>
        <h1 className="auth-title">Bear Tracker</h1>
        <p className="auth-sub">{t('auth.subtitle')}</p>

        <div className="auth-tabs">
          <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>{t('auth.tabLogin')}</button>
          <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>{t('auth.tabRegister')}</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <input className="input" placeholder={t('auth.nickPlaceholder')}
              value={form.game_nick} onChange={e => set('game_nick', e.target.value)}
              required minLength={2} maxLength={32} />
          )}

          <input className="input" placeholder={t('auth.emailPlaceholder')} type="email"
            value={form.email} onChange={e => set('email', e.target.value)}
            required autoComplete="email" />

          <input className="input" placeholder={t('auth.passwordPlaceholder')} type="password"
            value={form.password} onChange={e => set('password', e.target.value)}
            required minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

          {error && <div className="error-msg">{error}</div>}

          <button className="btn btn-primary btn-shiny" type="submit" disabled={loading}>
            {loading ? t('auth.submitLoading') : mode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}
          </button>
        </form>
      </div>
    </div>
  );
}
