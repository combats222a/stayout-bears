import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { formatTime, getTimeLeft } from '../utils/bears';

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const d = await api.get('/admin/clans');
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function deleteClan(id, name) {
    if (!confirm(`Удалить клан «${name}»? Все таймеры будут сброшены.`)) return;
    try {
      await api.delete(`/admin/clans/${id}`);
      load();
    } catch (e) { setError(e.message); }
  }

  async function resetBears(id) {
    try {
      await api.post(`/admin/clans/${id}/reset-bears`);
      load();
    } catch (e) { setError(e.message); }
  }

  async function toggleAdmin(userId) {
    try {
      await api.post(`/admin/users/${userId}/toggle-admin`);
      load();
    } catch (e) { setError(e.message); }
  }

  if (loading) return <div className="page"><div className="loading">Загрузка...</div></div>;
  if (error) return <div className="page"><div className="error-msg">{error}</div></div>;

  const { clans, users, bears } = data;

  function clanBears(clanId) {
    return bears.filter(b => b.clan_id === clanId);
  }

  function clanMembers(clanId) {
    return users.filter(u => u.clan_id === clanId);
  }

  function clanOwner(clan) {
    return users.find(u => u.id === clan.owner_id);
  }

  return (
    <div className="page">
      <h2 className="page-title">🛡️ Панель суперадмина</h2>

      <div className="admin-section">
        <h3>Кланы ({clans.length})</h3>
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
                  {owner && <span className="label">Владелец: {owner.nick}</span>}
                </div>
                <div className="admin-clan-actions">
                  <button className="btn btn-sm" onClick={() => resetBears(clan.id)}>↺ Сбросить медведей</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteClan(clan.id, clan.name)}>🗑️ Удалить</button>
                </div>
              </div>

              <div className="admin-clan-stats">
                <span>👥 {members.length} участников</span>
                <span>💀 {deadCount}/9 медведей мертвы</span>
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
        <h3>Игроки ({users.length})</h3>
        <div className="admin-users-table">
          <div className="admin-table-header">
            <span>Ник</span><span>Email</span><span>Клан</span><span>Права</span><span></span>
          </div>
          {users.map(u => {
            const userClan = clans.find(c => c.id === u.clan_id);
            return (
              <div key={u.id} className="admin-table-row">
                <span className="admin-nick">{u.nick}</span>
                <span className="admin-email">{u.email}</span>
                <span>{userClan?.name || '—'}</span>
                <span>{u.is_superadmin ? '🛡️ Суперадмин' : 'Игрок'}</span>
                <button className="btn btn-xs" onClick={() => toggleAdmin(u.id)}>
                  {u.is_superadmin ? 'Снять права' : 'Дать права'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
