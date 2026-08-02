const { pool } = require('../db/pool');

async function getAllClansOverview() {
  const { rows: clans } = await pool.query('SELECT * FROM clans ORDER BY created_at DESC');
  const { rows: users } = await pool.query('SELECT id, nick, email, clan_id, is_superadmin, created_at FROM users ORDER BY id');
  const { rows: bears } = await pool.query(`
    SELECT b.*, u.nick as killer_nick FROM bears b
    LEFT JOIN users u ON b.killed_by = u.id
    ORDER BY b.clan_id, b.bear_index
  `);
  return { clans, users, bears };
}

// Как и в оригинале — без транзакции: сначала отвязываем участников,
// потом удаляем клан, двумя отдельными запросами.
async function deleteClanCascade(clanId) {
  await pool.query('UPDATE users SET clan_id = NULL WHERE clan_id = $1', [clanId]);
  await pool.query('DELETE FROM clans WHERE id = $1', [clanId]);
}

async function resetClanBears(clanId) {
  await pool.query(
    'UPDATE bears SET killed_at = NULL, killed_by = NULL, spawn_at = NULL WHERE clan_id = $1',
    [clanId]
  );
}

async function toggleSuperadmin(userId) {
  const { rows } = await pool.query(
    'UPDATE users SET is_superadmin = NOT is_superadmin WHERE id = $1 RETURNING id, nick, is_superadmin',
    [userId]
  );
  return rows[0];
}

module.exports = { getAllClansOverview, deleteClanCascade, resetClanBears, toggleSuperadmin };
