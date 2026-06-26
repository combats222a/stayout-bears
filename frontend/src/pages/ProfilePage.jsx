import { useState } from 'react';
import { api } from '../utils/api';

export default function ProfilePage({ user, onUserUpdate }) {
  const [nick, setNick] = useState(user.nick);
  const [gameNick, setGameNick] = useState(user.game_nick || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function save(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!nick.trim() || !gameNick.trim()) {
      setError('Оба поля обязательны');
      return;
    }
    setLoading(true);
    try {
      const data = await api.put('/auth/profile', {
        nick: nick.trim(),
        game_nick: gameNick.trim()
      });
      onUserUpdate(data.user);
      setSuccess('Профиль сохранён!');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
      <div className="clan-card" style={{ padding: '28px 28px' }}>
        <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 20, fontWeight: 700 }}>
          👤 Профиль
        </h2>

        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted, #888)', marginBottom: 4 }}>
              Логин (для входа на сайт)
            </label>
            <input
              className="input"
              value={nick}
              onChange={e => { setNick(e.target.value); setError(''); setSuccess(''); }}
              required
              minLength={2}
              maxLength={32}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted, #888)', marginBottom: 4 }}>
              Игровой ник (виден другим игрокам)
            </label>
            <input
              className="input"
              value={gameNick}
              onChange={e => { setGameNick(e.target.value); setError(''); setSuccess(''); }}
              required
              minLength={2}
              maxLength={32}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}
          {success && (
            <div style={{ color: '#4caf50', fontSize: 14, padding: '8px 12px', background: 'rgba(76,175,80,0.1)', borderRadius: 6 }}>
              ✓ {success}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: '#888' }}>
          <span>Email: </span><span style={{ color: '#ccc' }}>{user.email}</span>
        </div>
      </div>
    </div>
  );
}
