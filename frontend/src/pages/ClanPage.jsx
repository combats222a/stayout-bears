import { useState } from 'react';
import { api } from '../utils/api';

// ── Роли ────────────────────────────────────────────────────────────────────
function getRole(member, clan) {
  if (member.id === clan.owner_id)  return 'leader';
  if (member.id === clan.deputy_id) return 'deputy';
  return 'member';
}

const ROLE_LABEL = {
  leader: { text: 'Лидер',      icon: '❄️',  cls: 'role-leader' },
  deputy: { text: 'Зам лидера', icon: '🌨️', cls: 'role-deputy' },
  member: { text: 'Соклан',     icon: '🐻',  cls: 'role-member' },
};

// ── Модалка передачи лидерства ───────────────────────────────────────────────
function TransferModal({ members, clan, onConfirm, onClose }) {
  const [selectedId, setSelectedId] = useState(null);
  const candidates = members.filter(m => m.id !== clan.owner_id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">❄️ Передать лидерство</div>
        <div className="modal-body">
          <div className="modal-label">Выбери нового лидера группировки</div>
          <div className="transfer-list">
            {candidates.map(m => (
              <div key={m.id}
                className={`transfer-item${selectedId === m.id ? ' selected' : ''}`}
                onClick={() => setSelectedId(m.id)}
              >
                <span className="transfer-icon">{m.id === clan.deputy_id ? '🌨️' : '🐻'}</span>
                <span className="transfer-nick">{m.game_nick || m.nick}</span>
                {m.id === clan.deputy_id && <span className="transfer-role">Зам</span>}
                {selectedId === m.id && <span className="transfer-check">✓</span>}
              </div>
            ))}
            {candidates.length === 0 && (
              <div className="modal-hint">В клане нет других участников</div>
            )}
          </div>
          <div className="modal-hint" style={{marginTop:10}}>
            ⚠️ После передачи ты станешь обычным сокланом
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Отмена</button>
          <button className="modal-btn-ok" disabled={!selectedId}
            onClick={() => selectedId && onConfirm(selectedId)}>
            Передать ❄️
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Страница ─────────────────────────────────────────────────────────────────
export default function ClanPage({ user, clan, members, bans = [], onClanChange }) {
  const [createName,    setCreateName]    = useState('');
  const [joinCode,      setJoinCode]      = useState('');
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [showTransfer,  setShowTransfer]  = useState(false);
  const [showBans,      setShowBans]      = useState(false);

  const isOwner   = clan && clan.owner_id  === user.id;
  const isDeputy  = clan && clan.deputy_id === user.id;
  const canManage = isOwner || isDeputy;

  async function createClan(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try { await api.post('/clans/create', { name: createName }); onClanChange(); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function joinClan(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try { await api.post('/clans/join', { code: joinCode.toUpperCase() }); onClanChange(); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function leaveClan() {
    if (!confirm(isOwner ? 'Расформировать группировку?' : 'Выйти из группировки?')) return;
    try { await api.post('/clans/leave'); onClanChange(); }
    catch (e) { setError(e.message); }
  }

  async function kickMember(memberId, nick) {
    if (!confirm(`Исключить ${nick} из группировки?`)) return;
    try { await api.post(`/clans/kick/${memberId}`); onClanChange(); }
    catch (e) { setError(e.message); }
  }

  async function banMember(memberId, nick) {
    if (!confirm(`Заблокировать ${nick}? Они не смогут снова вступить в группировку.`)) return;
    try { await api.post(`/clans/ban/${memberId}`); onClanChange(); }
    catch (e) { setError(e.message); }
  }

  async function unbanMember(userId, nick) {
    if (!confirm(`Разблокировать ${nick}?`)) return;
    try { await api.post(`/clans/unban/${userId}`); onClanChange(); }
    catch (e) { setError(e.message); }
  }

  async function setDeputy(memberId) {
    const isAlreadyDeputy = clan.deputy_id === memberId;
    const nick = members.find(m => m.id === memberId)?.game_nick || '?';
    if (!isAlreadyDeputy && !confirm(`Назначить ${nick} замом лидера?`)) return;
    if (isAlreadyDeputy && !confirm(`Снять ${nick} с должности зама?`)) return;
    try { await api.post(`/clans/deputy/${memberId}`); onClanChange(); }
    catch (e) { setError(e.message); }
  }

  async function transferLeadership(targetId) {
    try {
      await api.post(`/clans/transfer/${targetId}`);
      setShowTransfer(false);
      onClanChange();
    } catch (e) { setError(e.message); }
  }

  async function refreshCode() {
    if (!confirm('Сменить код приглашения? Старый код перестанет работать.')) return;
    try { await api.post('/clans/refresh-code'); onClanChange(); }
    catch (e) { setError(e.message); }
  }

  function copyCode() {
    navigator.clipboard.writeText(clan.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── No clan ──
  if (!clan) {
    return (
      <div className="page">
        <h2 className="page-title">🐻 Группировка</h2>
        <div className="clan-actions">
          <div className="card">
            <div className="clan-join-title">🏔️ Создать группировку</div>
            <form onSubmit={createClan} className="form-row">
              <input className="input" placeholder="Название группировки" value={createName}
                onChange={e => { setCreateName(e.target.value); setError(''); }}
                required minLength={2} maxLength={64} />
              <button className="btn btn-primary" disabled={loading}>Создать</button>
            </form>
          </div>
          <div className="card">
            <div className="clan-join-title">❄️ Вступить по коду</div>
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

  // ── In clan ──
  const sortedMembers = [...members].sort((a, b) => {
    const order = { leader: 0, deputy: 1, member: 2 };
    return order[getRole(a, clan)] - order[getRole(b, clan)];
  });

  return (
    <div className="page">
      <h2 className="page-title">🐻 Группировка</h2>

      {/* Clan card */}
      <div className="clan-card">
        {/* Header */}
        <div className="clan-card-header">
          <div className="clan-card-left">
            <div className="clan-snowflake">❄️</div>
            <div>
              <div className="clan-name-big">{clan.name}</div>
              <div className="clan-meta">Группировка охотников на медведей</div>
            </div>
          </div>
          <div className="clan-card-actions">
            {isOwner && (
              <button className="clan-action-btn transfer-btn" onClick={() => setShowTransfer(true)}>
                ❄️ Передать лидерство
              </button>
            )}
            <button className={`clan-action-btn ${isOwner ? 'danger-btn' : 'leave-btn'}`} onClick={leaveClan}>
              {isOwner ? '🗑️ Расформировать' : '🚪 Покинуть'}
            </button>
          </div>
        </div>

        {/* Code */}
        <div className="clan-code-block">
          <span className="clan-code-label">❄ КОД ПРИГЛАШЕНИЯ</span>
          <div className="clan-code-row">
            <span className="clan-code">{clan.code}</span>
            <button className="clan-copy-btn" onClick={copyCode}>
              {copied ? '✅ Скопировано' : '📋 Копировать'}
            </button>
            {canManage && (
              <button className="clan-copy-btn clan-refresh-btn" onClick={refreshCode} title="Обновить код приглашения">
                🔄 Сменить
              </button>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="clan-members-section">
          <div className="clan-members-header">
            <span className="clan-members-title">🌨️ Участники</span>
            <span className="clan-members-count">{members.length}</span>
            {isOwner && bans.length > 0 && (
              <button
                className="mem-btn mem-btn-bans-toggle"
                onClick={() => setShowBans(v => !v)}
                style={{marginLeft: 'auto'}}
              >
                🚫 Бан-лист ({bans.length})
              </button>
            )}
          </div>

          <div className="clan-members-list">
            {sortedMembers.map(m => {
              const role = getRole(m, clan);
              const rl   = ROLE_LABEL[role];
              const isMe = m.id === user.id;
              const nick = m.game_nick || m.nick;

              return (
                <div key={m.id} className={`clan-member-row role-${role}`}>
                  <div className="clan-member-left">
                    <span className="clan-member-icon">{rl.icon}</span>
                    <div className="clan-member-info">
                      <span className="clan-member-nick">
                        {nick}
                        {isMe && <span className="badge-you">ты</span>}
                      </span>
                      <span className={`clan-member-role ${rl.cls}`}>{rl.text}</span>
                    </div>
                  </div>

                  <div className="clan-member-actions">
                    {/* Owner: appoint/remove deputy */}
                    {isOwner && !isMe && role !== 'leader' && (
                      <button
                        className={`mem-btn ${role === 'deputy' ? 'mem-btn-remove-deputy' : 'mem-btn-deputy'}`}
                        onClick={() => setDeputy(m.id)}
                        title={role === 'deputy' ? 'Снять зама' : 'Назначить замом'}
                      >
                        {role === 'deputy' ? '🌨️ Снять зама' : '🌨️ Зам'}
                      </button>
                    )}
                    {/* Kick */}
                    {canManage && !isMe && role !== 'leader' && !(isDeputy && role === 'deputy') && (
                      <button
                        className="mem-btn mem-btn-kick"
                        onClick={() => kickMember(m.id, nick)}
                        title="Исключить из группировки"
                      >
                        ✕ Кик
                      </button>
                    )}
                    {/* Ban */}
                    {canManage && !isMe && role !== 'leader' && !(isDeputy && role === 'deputy') && (
                      <button
                        className="mem-btn mem-btn-ban"
                        onClick={() => banMember(m.id, nick)}
                        title="Заблокировать (кик + бан)"
                      >
                        🚫 Блок
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ban list (owner only) */}
          {isOwner && showBans && bans.length > 0 && (
            <div className="clan-bans-section">
              <div className="clan-bans-title">🚫 Заблокированные</div>
              {bans.map(b => (
                <div key={b.user_id} className="clan-ban-row">
                  <span className="clan-ban-nick">{b.nick || `#${b.user_id}`}</span>
                  <button
                    className="mem-btn mem-btn-unban"
                    onClick={() => unbanMember(b.user_id, b.nick || `#${b.user_id}`)}
                  >
                    ✅ Разбанить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showTransfer && (
        <TransferModal
          members={members}
          clan={clan}
          onConfirm={transferLeadership}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </div>
  );
}
