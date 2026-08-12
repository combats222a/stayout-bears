import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { BEARS_LIST } from '../../utils/bears';
import type { Clan, AdminUserSummary, BearWithKiller } from '../../types/entities';
import { useLocaleDict } from '../../i18n';
import ruAdmin from '../../i18n/locales/ru/admin';
import enAdmin from '../../i18n/locales/en/admin';

interface AdminData {
  clans: Clan[];
  users: AdminUserSummary[];
  bears: BearWithKiller[];
}

export default function AdminPage() {
  const c = useLocaleDict(ruAdmin, enAdmin);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const d = await api.get('/admin/clans');
      setData(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function deleteClan(id: number, name: string) {
    if (!confirm(c.confirmDeleteClan(name))) return;
    try {
      await api.delete(`/admin/clans/${id}`);
      load();
    } catch (e) { setError((e as Error).message); }
  }

  async function resetBears(id: number) {
    try {
      await api.post(`/admin/clans/${id}/reset-bears`);
      load();
    } catch (e) { setError((e as Error).message); }
  }

  async function toggleAdmin(userId: number) {
    try {
      await api.post(`/admin/users/${userId}/toggle-admin`);
      load();
    } catch (e) { setError((e as Error).message); }
  }

  if (loading) return <div className="page"><div className="loading">{c.loading}</div></div>;
  if (error) return <div className="page"><div className="error-msg">{error}</div></div>;
  if (!data) return null;

  const { clans, users, bears } = data;

  function clanBears(clanId: number): BearWithKiller[] {
    return bears.filter(b => b.clan_id === clanId);
  }

  function clanMembers(clanId: number): AdminUserSummary[] {
    return users.filter(u => u.clan_id === clanId);
  }

  function clanOwner(clan: Clan): AdminUserSummary | undefined {
    return users.find(u => u.id === clan.owner_id);
  }

  return (
    <div className="page">
      <h2 className="page-title">{c.title}</h2>

      <div className="admin-section">
        <h3>{c.clansHeading(clans.length)}</h3>
        {clans.map(clan => {
          const members = clanMembers(clan.id);
          const clanBearsData = clanBears(clan.id);
          const deadCount = clanBearsData.filter(b => b.spawn_at && new Date(b.spawn_at) > new Date()).length;
          const owner = clanOwner(clan);

          return (
            <div key={clan.id} className="admin-clan-card card">
              <div className="admin-clan-header">
                <div>
                  <span className="admin-clan-name">{clan.name}</span>
                  <span className="admin-clan-code input-mono">{clan.code}</span>
                  {owner && <span className="label">{c.ownerLabel(owner.nick)}</span>}
                </div>
                <div className="admin-clan-actions">
                  <button className="btn btn-sm" onClick={() => resetBears(clan.id)}>{c.resetBears}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteClan(clan.id, clan.name)}>{c.deleteBtn}</button>
                </div>
              </div>

              <div className="admin-clan-stats">
                <span>{c.membersCount(members.length)}</span>
                <span>{c.bearsDeadCount(deadCount, BEARS_LIST.length)}</span>
              </div>

              <div className="admin-members">
                {members.map(m => (
                  <span key={m.id} className="admin-member-tag">
                    {m.id === clan.owner_id ? '👑' : ''}{m.nick}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-section">
        <h3>{c.usersHeading(users.length)}</h3>
        <div className="admin-users-table">
          <div className="admin-table-header">
            <span>{c.colNick}</span><span>{c.colEmail}</span><span>{c.colClan}</span><span>{c.colRights}</span><span></span>
          </div>
          {users.map(u => {
            const userClan = clans.find(cl => cl.id === u.clan_id);
            return (
              <div key={u.id} className="admin-table-row">
                <span className="admin-nick">{u.nick}</span>
                <span className="admin-email">{u.email}</span>
                <span>{userClan?.name || c.noClan}</span>
                <span>{u.is_superadmin ? c.superadminBadge : c.playerBadge}</span>
                <button className="btn btn-xs" onClick={() => toggleAdmin(u.id)}>
                  {u.is_superadmin ? c.revokeRights : c.grantRights}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
