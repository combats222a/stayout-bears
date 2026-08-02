const { pool } = require('../db/pool');

// Транзакция создания клана (INSERT clan + привязка владельца + посев
// bears/draugs) — единственное место в этом роуте, где нужен отдельный
// client вместо pool.query напрямую, поэтому вся транзакция целиком
// живёт здесь, а не размазана между сервисом и репозиторием.
async function createClanWithSeed(name, code, ownerId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO clans (name, code, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, code, ownerId]
    );
    const clan = rows[0];
    await client.query('UPDATE users SET clan_id = $1 WHERE id = $2', [clan.id, ownerId]);
    for (let i = 1; i <= 11; i++) {
      await client.query('INSERT INTO bears (clan_id, bear_index) VALUES ($1, $2) ON CONFLICT DO NOTHING', [clan.id, i]);
    }
    for (let i = 1; i <= 6; i++) {
      await client.query('INSERT INTO draugs (clan_id, draug_index) VALUES ($1, $2) ON CONFLICT DO NOTHING', [clan.id, i]);
    }
    await client.query('COMMIT');
    return clan;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function codeExists(code) {
  const { rows } = await pool.query('SELECT id FROM clans WHERE code = $1', [code]);
  return rows.length > 0;
}

async function findClanByCode(code) {
  const { rows } = await pool.query('SELECT * FROM clans WHERE code = $1', [code]);
  return rows[0] || null;
}

async function findBan(clanId, userId) {
  const { rows } = await pool.query('SELECT id FROM clan_bans WHERE clan_id = $1 AND user_id = $2', [clanId, userId]);
  return rows.length > 0;
}

async function setUserClan(userId, clanId) {
  await pool.query('UPDATE users SET clan_id = $1 WHERE id = $2', [clanId, userId]);
}

async function findClanById(id) {
  const { rows } = await pool.query('SELECT * FROM clans WHERE id = $1', [id]);
  return rows[0] || null;
}

async function countOtherMembers(clanId, excludeUserId) {
  const { rows } = await pool.query('SELECT id FROM users WHERE clan_id = $1 AND id != $2', [clanId, excludeUserId]);
  return rows.length;
}

async function deleteClan(clanId) {
  await pool.query('DELETE FROM clans WHERE id = $1', [clanId]);
}

async function clearUserClan(userId) {
  await pool.query('UPDATE users SET clan_id = NULL WHERE id = $1', [userId]);
}

// GET /me — клан + участники + bears + draugs + баны за один заход
async function getClanFull(clanId) {
  const clan = await findClanById(clanId);
  if (!clan) return null;

  const { rows: members } = await pool.query(
    'SELECT id, nick, game_nick, email FROM users WHERE clan_id = $1 ORDER BY id',
    [clanId]
  );
  const { rows: bears } = await pool.query(
    `SELECT b.*, COALESCE(u.game_nick, u.nick) as killer_nick FROM bears b
     LEFT JOIN users u ON b.killed_by = u.id
     WHERE b.clan_id = $1 ORDER BY b.bear_index`,
    [clanId]
  );
  const { rows: draugs } = await pool.query(
    `SELECT d.*, COALESCE(u.game_nick, u.nick) as killer_nick FROM draugs d
     LEFT JOIN users u ON d.killed_by = u.id
     WHERE d.clan_id = $1 ORDER BY d.draug_index`,
    [clanId]
  );
  const { rows: bans } = await pool.query(
    `SELECT cb.user_id, cb.banned_at, cb.banned_by,
            COALESCE(u.game_nick, u.nick) as nick
     FROM clan_bans cb
     LEFT JOIN users u ON cb.user_id = u.id
     WHERE cb.clan_id = $1 ORDER BY cb.banned_at DESC`,
    [clanId]
  );
  return { clan, members, bears, draugs, bans };
}

async function getOwnerDeputy(clanId) {
  const { rows } = await pool.query('SELECT owner_id, deputy_id FROM clans WHERE id = $1', [clanId]);
  return rows[0] || null;
}

async function clearDeputy(clanId) {
  await pool.query('UPDATE clans SET deputy_id = NULL WHERE id = $1', [clanId]);
}

async function clearUserClanIfMatches(userId, clanId) {
  await pool.query('UPDATE users SET clan_id = NULL WHERE id = $1 AND clan_id = $2', [userId, clanId]);
}

async function insertBan(clanId, userId, bannedBy) {
  await pool.query(
    'INSERT INTO clan_bans (clan_id, user_id, banned_by) VALUES ($1, $2, $3) ON CONFLICT (clan_id, user_id) DO NOTHING',
    [clanId, userId, bannedBy]
  );
}

async function getOwnerId(clanId) {
  const { rows } = await pool.query('SELECT owner_id FROM clans WHERE id = $1', [clanId]);
  return rows[0] || null;
}

async function deleteBan(clanId, userId) {
  await pool.query('DELETE FROM clan_bans WHERE clan_id = $1 AND user_id = $2', [clanId, userId]);
}

async function findMemberInClan(userId, clanId) {
  const { rows } = await pool.query('SELECT id FROM users WHERE id = $1 AND clan_id = $2', [userId, clanId]);
  return rows.length > 0;
}

async function transferOwnership(newOwnerId, clanId) {
  await pool.query(
    'UPDATE clans SET owner_id = $1, deputy_id = CASE WHEN deputy_id = $1 THEN NULL ELSE deputy_id END WHERE id = $2',
    [newOwnerId, clanId]
  );
}

async function setDeputy(clanId, deputyId) {
  await pool.query('UPDATE clans SET deputy_id = $1 WHERE id = $2', [deputyId, clanId]);
}

async function renameClan(clanId, name) {
  const { rows } = await pool.query('UPDATE clans SET name = $1 WHERE id = $2 RETURNING *', [name, clanId]);
  return rows[0];
}

async function setCode(clanId, code) {
  const { rows } = await pool.query('UPDATE clans SET code = $1 WHERE id = $2 RETURNING *', [code, clanId]);
  return rows[0];
}

module.exports = {
  createClanWithSeed, codeExists, findClanByCode, findBan, setUserClan,
  findClanById, countOtherMembers, deleteClan, clearUserClan, getClanFull,
  getOwnerDeputy, clearDeputy, clearUserClanIfMatches, insertBan, getOwnerId,
  deleteBan, findMemberInClan, transferOwnership, setDeputy, renameClan, setCode,
};
