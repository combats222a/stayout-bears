import { useState, FormEvent } from 'react';
import { api } from '../../utils/api';
import InfoSpoiler from '../../components/InfoSpoiler';
import GuestLock from '../../components/GuestLock';
import { CLAN_SPOILER } from '../../content/spoilerContent';
import type { AuthUser, Clan, ClanMemberSummary, ClanBanSummary } from '../../types/entities';
import { useI18n, useLocaleDict } from '../../i18n';
import ruClan from '../../i18n/locales/ru/clan';
import enClan from '../../i18n/locales/en/clan';
import type { ClanContent } from '../../i18n/locales/ru/clan';

type Role = 'leader' | 'deputy' | 'member';

// ── Роли ────────────────────────────────────────────────────────────────────
function getRole(member: ClanMemberSummary, clan: Clan): Role {
  if (member.id === clan.owner_id)  return 'leader';
  if (member.id === clan.deputy_id) return 'deputy';
  return 'member';
}

function roleLabel(role: Role, c: ClanContent): { text: string; icon: string; cls: string } {
  if (role === 'leader') return { text: c.roleLeader, icon: '❄️', cls: 'role-leader' };
  if (role === 'deputy') return { text: c.roleDeputy, icon: '🌨️', cls: 'role-deputy' };
  return { text: c.roleMember, icon: '🐻', cls: 'role-member' };
}

// ── Модалка передачи лидерства ───────────────────────────────────────────────
interface TransferModalProps {
  members: ClanMemberSummary[];
  clan: Clan;
  onConfirm: (id: number) => void;
  onClose: () => void;
}

function TransferModal({ members, clan, onConfirm, onClose }: TransferModalProps) {
  const c = useLocaleDict(ruClan, enClan);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const candidates = members.filter(m => m.id !== clan.owner_id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{c.transferTitle}</div>
        <div className="modal-body">
          <div className="modal-label">{c.transferLabel}</div>
          <div className="transfer-list">
            {candidates.map(m => (
              <div key={m.id}
                className={`transfer-item${selectedId === m.id ? ' selected' : ''}`}
                onClick={() => setSelectedId(m.id)}
              >
                <span className="transfer-icon">{m.id === clan.deputy_id ? '🌨️' : '🐻'}</span>
                <span className="transfer-nick">{m.game_nick || m.nick}</span>
                {m.id === clan.deputy_id && <span className="transfer-role">{c.transferDeputyTag}</span>}
                {selectedId === m.id && <span className="transfer-check">✓</span>}
              </div>
            ))}
            {candidates.length === 0 && (
              <div className="modal-hint">{c.transferNoOthers}</div>
            )}
          </div>
          <div className="modal-hint" style={{marginTop:10}}>
            {c.transferWarn}
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>{c.transferCancel}</button>
          <button className="modal-btn-ok btn-shiny" disabled={!selectedId}
            onClick={() => selectedId && onConfirm(selectedId)}>
            {c.transferConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Страница ─────────────────────────────────────────────────────────────────
interface ClanPageProps {
  user: AuthUser;
  clan: Clan | null;
  members: ClanMemberSummary[];
  bans?: ClanBanSummary[];
  onClanChange: () => void;
  isGuest?: boolean;
  onLoginClick?: () => void;
}

export default function ClanPage({ user, clan, members, bans = [], onClanChange, isGuest, onLoginClick = () => {} }: ClanPageProps) {
  const { locale } = useI18n();
  const c = useLocaleDict(ruClan, enClan);
  const [createName,    setCreateName]    = useState('');
  const [joinCode,      setJoinCode]      = useState('');
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [showTransfer,  setShowTransfer]  = useState(false);
  const [showBans,      setShowBans]      = useState(false);
  const [renaming,      setRenaming]      = useState(false);
  const [renameValue,   setRenameValue]   = useState('');
  const [renameError,   setRenameError]   = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  const isOwner   = !!clan && clan.owner_id  === user.id;
  const isDeputy  = !!clan && clan.deputy_id === user.id;
  const canManage = isOwner || isDeputy;

  async function createClan(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try { await api.post('/clans/create', { name: createName }); onClanChange(); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function joinClan(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try { await api.post('/clans/join', { code: joinCode.toUpperCase() }); onClanChange(); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function leaveClan() {
    if (!confirm(isOwner ? c.disbandConfirm : c.leaveConfirm)) return;
    try { await api.post('/clans/leave'); onClanChange(); }
    catch (e) { setError((e as Error).message); }
  }

  async function kickMember(memberId: number, nick: string) {
    if (!confirm(c.kickConfirm(nick))) return;
    try { await api.post(`/clans/kick/${memberId}`); onClanChange(); }
    catch (e) { setError((e as Error).message); }
  }

  async function banMember(memberId: number, nick: string) {
    if (!confirm(c.banConfirm(nick))) return;
    try { await api.post(`/clans/ban/${memberId}`); onClanChange(); }
    catch (e) { setError((e as Error).message); }
  }

  async function unbanMember(userId: number, nick: string) {
    if (!confirm(c.unbanConfirm(nick))) return;
    try { await api.post(`/clans/unban/${userId}`); onClanChange(); }
    catch (e) { setError((e as Error).message); }
  }

  async function setDeputy(memberId: number) {
    const isAlreadyDeputy = clan!.deputy_id === memberId;
    const nick = members.find(m => m.id === memberId)?.game_nick || '?';
    if (!isAlreadyDeputy && !confirm(c.assignDeputyConfirm(nick))) return;
    if (isAlreadyDeputy && !confirm(c.removeDeputyConfirm(nick))) return;
    try { await api.post(`/clans/deputy/${memberId}`); onClanChange(); }
    catch (e) { setError((e as Error).message); }
  }

  async function transferLeadership(targetId: number) {
    try {
      await api.post(`/clans/transfer/${targetId}`);
      setShowTransfer(false);
      onClanChange();
    } catch (e) { setError((e as Error).message); }
  }

  function startRename() {
    setRenameValue(clan!.name);
    setRenameError('');
    setRenaming(true);
  }

  function cancelRename() {
    setRenaming(false);
    setRenameError('');
  }

  async function saveRename(e: FormEvent) {
    e.preventDefault();
    const trimmed = renameValue.trim();
    if (trimmed === clan!.name) { setRenaming(false); return; }
    setRenameLoading(true); setRenameError('');
    try {
      await api.post('/clans/rename', { name: trimmed });
      setRenaming(false);
      onClanChange();
    } catch (e) { setRenameError((e as Error).message); }
    finally { setRenameLoading(false); }
  }

  async function refreshCode() {
    if (!confirm(c.refreshCodeConfirm)) return;
    try { await api.post('/clans/refresh-code'); onClanChange(); }
    catch (e) { setError((e as Error).message); }
  }

  function copyCode() {
    navigator.clipboard.writeText(clan!.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── No clan ──
  if (!clan) {
    return (
      <div className="page">
        <h2 className="page-title">{c.pageTitle}</h2>
        <InfoSpoiler {...CLAN_SPOILER[locale]} storageKey="spoiler_clan" />
        {isGuest ? (
          <GuestLock
            icon="👥"
            title={c.guestLockTitle}
            text={c.guestLockText}
            onLoginClick={onLoginClick}
          />
        ) : (
        <div className="clan-actions">
          <div className="card">
            <div className="clan-join-title">{c.createTitle}</div>
            <form onSubmit={createClan} className="form-row">
              <input className="input" placeholder={c.createPlaceholder} value={createName}
                onChange={e => { setCreateName(e.target.value); setError(''); }}
                required minLength={2} maxLength={64} />
              <button className="btn btn-primary btn-shiny" disabled={loading}>{c.createBtn}</button>
            </form>
          </div>
          <div className="card">
            <div className="clan-join-title">{c.joinTitle}</div>
            <form onSubmit={joinClan} className="form-row">
              <input className="input input-mono" placeholder="XXXXXX" value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
                maxLength={6} required />
              <button className="btn btn-primary btn-shiny" disabled={loading}>{c.joinBtn}</button>
            </form>
          </div>
        </div>
        )}
        {error && <div className="error-msg">{error}</div>}
      </div>
    );
  }

  // ── In clan ──
  const roleOrder: Record<Role, number> = { leader: 0, deputy: 1, member: 2 };
  const sortedMembers = [...members].sort((a, b) => {
    return roleOrder[getRole(a, clan)] - roleOrder[getRole(b, clan)];
  });

  return (
    <div className="page">
      <h2 className="page-title">{c.pageTitle}</h2>

      <InfoSpoiler {...CLAN_SPOILER[locale]} storageKey="spoiler_clan" />

      {/* Clan card */}
      <div className="clan-card">
        {/* Header */}
        <div className="clan-card-header">
          <div className="clan-card-left">
            <div className="clan-snowflake">❄️</div>
            <div>
              {renaming ? (
                <form className="clan-rename-form" onSubmit={saveRename}>
                  <input
                    className="input clan-rename-input"
                    value={renameValue}
                    onChange={e => { setRenameValue(e.target.value); setRenameError(''); }}
                    minLength={2}
                    maxLength={64}
                    autoFocus
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-shiny btn-sm" disabled={renameLoading}>
                    {c.renameSave}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={cancelRename}>
                    {c.renameCancel}
                  </button>
                </form>
              ) : (
                <div className="clan-name-row">
                  <div className="clan-name-big">{clan.name}</div>
                  {isOwner && (
                    <button
                      className="clan-rename-btn"
                      onClick={startRename}
                      title={c.renameTitle}
                      aria-label={c.renameTitle}
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}
              {renameError && <div className="error-msg clan-rename-error">{renameError}</div>}
              <div className="clan-meta">{c.clanTagline}</div>
            </div>
          </div>
          <div className="clan-card-actions">
            {isOwner && (
              <button className="clan-action-btn transfer-btn" onClick={() => setShowTransfer(true)}>
                {c.transferLeadershipBtn}
              </button>
            )}
            <button className={`clan-action-btn ${isOwner ? 'danger-btn' : 'leave-btn'}`} onClick={leaveClan}>
              {isOwner ? c.disbandBtn : c.leaveBtn}
            </button>
          </div>
        </div>

        {/* Code */}
        <div className="clan-code-block">
          <span className="clan-code-label">{c.inviteCodeLabel}</span>
          <div className="clan-code-row">
            <span className="clan-code">{clan.code}</span>
            <button className="clan-copy-btn" onClick={copyCode}>
              {copied ? c.copiedBtn : c.copyBtn}
            </button>
            {canManage && (
              <button className="clan-copy-btn clan-refresh-btn" onClick={refreshCode} title={c.refreshCodeTitle}>
                {c.refreshCodeBtn}
              </button>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="clan-members-section">
          <div className="clan-members-header">
            <span className="clan-members-title">{c.membersTitle}</span>
            <span className="clan-members-count">{members.length}</span>
            {isOwner && bans.length > 0 && (
              <button
                className="mem-btn mem-btn-bans-toggle"
                onClick={() => setShowBans(v => !v)}
                style={{marginLeft: 'auto'}}
              >
                {c.banListBtn(bans.length)}
              </button>
            )}
          </div>

          <div className="clan-members-list">
            {sortedMembers.map(m => {
              const role = getRole(m, clan);
              const rl   = roleLabel(role, c);
              const isMe = m.id === user.id;
              const nick = m.game_nick || m.nick;

              return (
                <div key={m.id} className={`clan-member-row role-${role}`}>
                  <div className="clan-member-left">
                    <span className="clan-member-icon">{rl.icon}</span>
                    <div className="clan-member-info">
                      <span className="clan-member-nick">
                        {nick}
                        {isMe && <span className="badge-you">{c.youTag}</span>}
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
                        title={role === 'deputy' ? c.removeDeputyTitle : c.assignDeputyTitle}
                      >
                        {role === 'deputy' ? c.removeDeputyBtn : c.assignDeputyBtn}
                      </button>
                    )}
                    {/* Kick */}
                    {canManage && !isMe && role !== 'leader' && !(isDeputy && role === 'deputy') && (
                      <button
                        className="mem-btn mem-btn-kick"
                        onClick={() => kickMember(m.id, nick)}
                        title={c.kickTitle}
                      >
                        {c.kickBtn}
                      </button>
                    )}
                    {/* Ban */}
                    {canManage && !isMe && role !== 'leader' && !(isDeputy && role === 'deputy') && (
                      <button
                        className="mem-btn mem-btn-ban"
                        onClick={() => banMember(m.id, nick)}
                        title={c.banTitle}
                      >
                        {c.banBtn}
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
              <div className="clan-bans-title">{c.bannedTitle}</div>
              {bans.map(b => (
                <div key={b.user_id} className="clan-ban-row">
                  <span className="clan-ban-nick">{b.nick || `#${b.user_id}`}</span>
                  <button
                    className="mem-btn mem-btn-unban"
                    onClick={() => unbanMember(b.user_id, b.nick || `#${b.user_id}`)}
                  >
                    {c.unbanBtn}
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
