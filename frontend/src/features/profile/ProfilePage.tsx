import { useState, FormEvent } from 'react';
import { api } from '../../utils/api';
import type { AuthUser } from '../../types/entities';
import { useLocaleDict } from '../../i18n';
import ruProfile from '../../i18n/locales/ru/profile';
import enProfile from '../../i18n/locales/en/profile';

interface ProfilePageProps {
  user: AuthUser;
  onUserUpdate: (user: AuthUser) => void;
  onLogout: () => void;
}

export default function ProfilePage({ user, onUserUpdate, onLogout }: ProfilePageProps) {
  const c = useLocaleDict(ruProfile, enProfile);
  const [nick, setNick] = useState(user.nick);
  const [gameNick, setGameNick] = useState(user.game_nick || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!nick.trim() || !gameNick.trim()) {
      setError(c.bothFieldsRequired);
      return;
    }
    setLoading(true);
    try {
      const data = await api.put('/auth/profile', {
        nick: nick.trim(),
        game_nick: gameNick.trim()
      });
      onUserUpdate(data.user);
      setSuccess(c.saved);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount() {
    if (deleteInput !== user.nick) {
      setDeleteError(c.wrongLogin);
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete('/auth/account');
      localStorage.removeItem('token');
      onLogout();
    } catch (e) {
      setDeleteError((e as Error).message);
      setDeleteLoading(false);
    }
  }

  return (
    <div className="profile-page">
      {/* Profile card */}
      <div className="settings-card">
        <h2 className="settings-title">{c.title}</h2>

        <form onSubmit={save} className="settings-form">
          <div className="settings-field">
            <label className="settings-label">{c.loginLabel}</label>
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
            <label className="settings-label">{c.gameNickLabel}</label>
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
            {loading ? c.saving : c.save}
          </button>
        </form>

        <div className="settings-email-row">
          {c.emailPrefix} <span className="settings-email-value">{user.email}</span>
        </div>
      </div>

      {/* Delete account section */}
      <div className="settings-card settings-card-danger">
        <h3 className="settings-title-danger">{c.deleteTitle}</h3>
        <p className="settings-desc">{c.deleteDesc}</p>

        {!showDeleteConfirm ? (
          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            {c.deleteBtn}
          </button>
        ) : (
          <div className="settings-delete-confirm">
            <label className="settings-delete-label">
              {c.deleteConfirmPrefix} <strong>{user.nick}</strong> {c.deleteConfirmSuffix}
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
                {deleteLoading ? c.deleting : c.confirmDeleteBtn}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(''); }}
                disabled={deleteLoading}
              >
                {c.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
