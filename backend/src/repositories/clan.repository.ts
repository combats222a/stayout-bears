import { pool } from '../db/pool';
import type { PoolClient } from 'pg';
import type { Clan, ClanMemberSummary, BearWithKiller, DraugWithKiller, ClanBanSummary, ClanFull } from '../types/entities';

// Транзакция создания клана (INSERT clan + привязка владельца + посев
// bears/draugs) — единственное место в этом роуте, где нужен отдельный
// client вместо pool.query напрямую, поэтому вся транзакция целиком
// живёт здесь, а не размазана между сервисом и репозиторием.
export async function createClanWithSeed(name: string, code: string, ownerId: number): Promise<Clan> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<Clan>(
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

export async function codeExists(code: string): Promise<boolean> {
  const { rows } = await pool.query('SELECT id FROM clans WHERE code = $1', [code]);
  return rows.length > 0;
}

export async function findClanByCode(code: string): Promise<Clan | null> {
  const { rows } = await pool.query<Clan>('SELECT * FROM clans WHERE code = $1', [code]);
  return rows[0] || null;
}

export async function findBan(clanId: number, userId: number): Promise<boolean> {
  const { rows } = await pool.query('SELECT id FROM clan_bans WHERE clan_id = $1 AND user_id = $2', [clanId, userId]);
  return rows.length > 0;
}

export async function setUserClan(userId: number, clanId: number): Promise<void> {
  await pool.query('UPDATE users SET clan_id = $1 WHERE id = $2', [clanId, userId]);
}

export async function findClanById(id: number): Promise<Clan | null> {
  const { rows } = await pool.query<Clan>('SELECT * FROM clans WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function countOtherMembers(clanId: number, excludeUserId: number): Promise<number> {
  const { rows } = await pool.query('SELECT id FROM users WHERE clan_id = $1 AND id != $2', [clanId, excludeUserId]);
  return rows.length;
}

export async function deleteClan(clanId: number): Promise<void> {
  await pool.query('DELETE FROM clans WHERE id = $1', [clanId]);
}

export async function clearUserClan(userId: number): Promise<void> {
  await pool.query('UPDATE users SET clan_id = NULL WHERE id = $1', [userId]);
}

// GET /me — клан + участники + bears + draugs + баны за один заход
export async function getClanFull(clanId: number): Promise<ClanFull | null> {
  const clan = await findClanById(clanId);
  if (!clan) return null;

  const { rows: members } = await pool.query<ClanMemberSummary>(
    'SELECT id, nick, game_nick, email FROM users WHERE clan_id = $1 ORDER BY id',
    [clanId]
  );
  const { rows: bears } = await pool.query<BearWithKiller>(
    `SELECT b.*, COALESCE(u.game_nick, u.nick) as killer_nick FROM bears b
     LEFT JOIN users u ON b.killed_by = u.id
     WHERE b.clan_id = $1 ORDER BY b.bear_index`,
    [clanId]
  );
  const { rows: draugs } = await pool.query<DraugWithKiller>(
    `SELECT d.*, COALESCE(u.game_nick, u.nick) as killer_nick FROM draugs d
     LEFT JOIN users u ON d.killed_by = u.id
     WHERE d.clan_id = $1 ORDER BY d.draug_index`,
    [clanId]
  );
  const { rows: bans } = await pool.query<ClanBanSummary>(
    `SELECT cb.user_id, cb.banned_at, cb.banned_by,
            COALESCE(u.game_nick, u.nick) as nick
     FROM clan_bans cb
     LEFT JOIN users u ON cb.user_id = u.id
     WHERE cb.clan_id = $1 ORDER BY cb.banned_at DESC`,
    [clanId]
  );
  return { clan, members, bears, draugs, bans };
}

export async function getOwnerDeputy(clanId: number): Promise<Pick<Clan, 'owner_id' | 'deputy_id'> | null> {
  const { rows } = await pool.query<Pick<Clan, 'owner_id' | 'deputy_id'>>('SELECT owner_id, deputy_id FROM clans WHERE id = $1', [clanId]);
  return rows[0] || null;
}

export async function clearDeputy(clanId: number): Promise<void> {
  await pool.query('UPDATE clans SET deputy_id = NULL WHERE id = $1', [clanId]);
}

export async function clearUserClanIfMatches(userId: number, clanId: number): Promise<void> {
  await pool.query('UPDATE users SET clan_id = NULL WHERE id = $1 AND clan_id = $2', [userId, clanId]);
}

export async function insertBan(clanId: number, userId: number, bannedBy: number): Promise<void> {
  await pool.query(
    'INSERT INTO clan_bans (clan_id, user_id, banned_by) VALUES ($1, $2, $3) ON CONFLICT (clan_id, user_id) DO NOTHING',
    [clanId, userId, bannedBy]
  );
}

export async function getOwnerId(clanId: number): Promise<Pick<Clan, 'owner_id'> | null> {
  const { rows } = await pool.query<Pick<Clan, 'owner_id'>>('SELECT owner_id FROM clans WHERE id = $1', [clanId]);
  return rows[0] || null;
}

export async function deleteBan(clanId: number, userId: number): Promise<void> {
  await pool.query('DELETE FROM clan_bans WHERE clan_id = $1 AND user_id = $2', [clanId, userId]);
}

export async function findMemberInClan(userId: number, clanId: number): Promise<boolean> {
  const { rows } = await pool.query('SELECT id FROM users WHERE id = $1 AND clan_id = $2', [userId, clanId]);
  return rows.length > 0;
}

export async function transferOwnership(newOwnerId: number, clanId: number): Promise<void> {
  await pool.query(
    'UPDATE clans SET owner_id = $1, deputy_id = CASE WHEN deputy_id = $1 THEN NULL ELSE deputy_id END WHERE id = $2',
    [newOwnerId, clanId]
  );
}

export async function setDeputy(clanId: number, deputyId: number | null): Promise<void> {
  await pool.query('UPDATE clans SET deputy_id = $1 WHERE id = $2', [deputyId, clanId]);
}

export async function renameClan(clanId: number, name: string): Promise<Clan> {
  const { rows } = await pool.query<Clan>('UPDATE clans SET name = $1 WHERE id = $2 RETURNING *', [name, clanId]);
  return rows[0];
}

export async function setCode(clanId: number, code: string): Promise<Clan> {
  const { rows } = await pool.query<Clan>('UPDATE clans SET code = $1 WHERE id = $2 RETURNING *', [code, clanId]);
  return rows[0];
}
