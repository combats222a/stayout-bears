import { useState } from 'react';
import { api } from '../utils/api';

export default function ProfilePage({ user, onUserUpdate, onLogout }) {
  const [nick, setNick] = useState(user.nick);
  const [gameNick, setGameNick] = useState(user.game_nick || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  async function deleteAccount() {
    if (deleteInput !== user.nick) {
      setDeleteError('Логин введён неверно');
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete('/auth/account');
      localStorage.removeItem('token');
      onLogout();
    } catch (e) {
      setDeleteError(e.message);
      setDeleteLoading(false);
    }
  }

  return (
    <div className="profile-page">
      {/* Profile card */}
      <div className="settings-card">
        <h2 className="settings-title">👤 Профиль</h2>

        <form onSubmit={save} className="settings-form">
          <div className="settings-field">
            <label className="settings-label">Логин (для входа на сайт)</label>
            <input
              className="input"
              value={nick}
              onChange={e => { setNick(e.target.value); setError(''); setSuccess(''); }}
              required
              minLength={2}
              maxLength={32}
            />
          </div>

          <div className="settings-field">
            <label className="settings-label">Игровой ник (виден другим игрокам)</label>
            <input
              className="input"
              value={gameNick}
              onChange={e => { setGameNick(e.target.value); setError(''); setSuccess(''); }}
              required
              minLength={2}
              maxLength={32}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">✓ {success}</div>}

          <button className="btn btn-primary btn-shiny" type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>

        <div className="settings-email-row">
          Email: <span className="settings-email-value">{user.email}</span>
        </div>
      </div>

      {/* Delete account section */}
      <div className="settings-card settings-card-danger">
        <h3 className="settings-title-danger">🗑️ Удалить аккаунт</h3>
        <p className="settings-desc">
          После удаления все данные аккаунта будут стёрты. Ты сможешь зарегистрироваться заново с тем же логином.
        </p>

        {!showDeleteConfirm ? (
          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            Удалить аккаунт
          </button>
        ) : (
          <div className="settings-delete-confirm">
            <label className="settings-delete-label">
              Введи свой логин <strong>{user.nick}</strong> для подтверждения:
            </label>
            <input
              className="input"
              placeholder={user.nick}
              value={deleteInput}
              onChange={e => { setDeleteInput(e.target.value); setDeleteError(''); }}
            />
            {deleteError && <div className="error-msg">{deleteError}</div>}
            <div className="settings-delete-actions">
              <button className="btn btn-danger" onClick={deleteAccount} disabled={deleteLoading}>
                {deleteLoading ? 'Удаление...' : '✓ Да, удалить'}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(''); }}
                disabled={deleteLoading}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
