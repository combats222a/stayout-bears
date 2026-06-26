import { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function ClanPage({ user, clan, members, onClanChange }) {
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = clan && clan.owner_id === user.id;

  async function createClan(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { clan } = await api.post('/clans/create', { name: createName });
      onClanChange();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function joinClan(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/clans/join', { code: joinCode.toUpperCase() });
      onClanChange();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function leaveClan() {
    if (!confirm('Выйти из клана?')) return;
    try {
      await api.post('/clans/leave');
      onClanChange();
    } catch (e) { setError(e.message); }
  }

  async function kickMember(memberId, nick) {
    if (!confirm(`Кикнуть ${nick}?`)) return;
    try {
      await api.post(`/clans/kick/${memberId}`);
      onClanChange();
    } catch (e) { setError(e.message); }
  }

  function copyCode() {
    navigator.clipboard.writeText(clan.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!clan) {
    return (
      <div className="page">
        <h2 className="page-title">Клан</h2>
        <div className="clan-actions">
          <div className="card">
            <h3>Создать клан</h3>
            <form onSubmit={createClan} className="form-row">
              <input className="input" placeholder="Название клана" value={createName}
                onChange={e => { setCreateName(e.target.value); setError(''); }}
                required minLength={2} maxLength={64} />
              <button className="btn btn-primary" disabled={loading}>Создать</button>
            </form>
          </div>
          <div className="card">
            <h3>Вступить по коду</h3>
            <form onSubmit={joinClan} className="form-row">
              <input className="input input-mono" placeholder="XXXXXX" value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
                maxLength={6} required />
              <button className="btn btn-primary" disabled={loading}>Вступить</button>
            </form>
          </div>
        </div>
        {error && <div className="error-msg">{error}</div>}
      </div>
    );
  }

  return (
    <div className="page">
      <h2 className="page-title">Клан</h2>
      <div className="card clan-info">
        <div className="clan-header">
          <div>
            <h3 className="clan-name">{clan.name}</h3>
            <div className="clan-code-row">
              <span className="label">Код:</span>
              <span className="clan-code">{clan.code}</span>
              <button className="btn btn-sm" onClick={copyCode}>
                {copied ? '✅ Скопировано' : '📋 Копировать'}
              </button>
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={leaveClan}>
            {isOwner ? '🗑️ Расформировать' : '🚪 Выйти'}
          </button>
        </div>

        <div className="members-list">
          <h4>Участники ({members.length})</h4>
          {members.map(m => (
            <div key={m.id} className="member-row">
              <span className="member-nick">
                {m.id === clan.owner_id && <span className="badge badge-owner">👑</span>}
                {m.nick}
                {m.id === user.id && <span className="badge badge-you">ты</span>}
              </span>
              {isOwner && m.id !== user.id && (
                <button className="btn btn-danger btn-xs" onClick={() => kickMember(m.id, m.nick)}>
                  Кик
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      {error && <div className="error-msg">{error}</div>}
    </div>
  );
}
