import { pool } from '../db/pool';
import type { Clan, AdminUserSummary, BearWithKiller } from '../types/entities';

export async function getAllClansOverview(): Promise<{
  clans: Clan[];
  users: AdminUserSummary[];
  bears: BearWithKiller[];
}> {
  const { rows: clans } = await pool.query<Clan>('SELECT * FROM clans ORDER BY created_at DESC');
  const { rows: users } = await pool.query<AdminUserSummary>(
    'SELECT id, nick, email, clan_id, is_superadmin, created_at FROM users ORDER BY id'
  );
  const { rows: bears } = await pool.query<BearWithKiller>(`
    SELECT b.*, u.nick as killer_nick FROM bears b
    LEFT JOIN users u ON b.killed_by = u.id
    ORDER BY b.clan_id, b.bear_index
  `);
  return { clans, users, bears };
}

// ИСПРАВЛЕНО: раньше отвязка участников и удаление клана шли двумя
// отдельными pool.query(...) без общей транзакции (задокументировано в
// ARCHITECTURE.md как известная проблема, унаследованная от оригинала).
// Если второй запрос падал (сетевой сбой, ограничение БД и т.п.) после
// того как первый уже прошёл, участники оставались отвязанными от уже
// несуществующего по сути, но формально ещё живого клана — рассинхрон,
// требующий ручного вмешательства. Теперь оба запроса — на одном client
// в транзакции (тот же паттерн, что и в timers.repository.ts →
// reorderTimers): либо применяются оба, либо ни одного.
export async function deleteClanCascade(clanId: string | number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE users SET clan_id = NULL WHERE clan_id = $1', [clanId]);
    await client.query('DELETE FROM clans WHERE id = $1', [clanId]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function resetClanBears(clanId: string | number): Promise<void> {
  await pool.query(
    'UPDATE bears SET killed_at = NULL, killed_by = NULL, spawn_at = NULL WHERE clan_id = $1',
    [clanId]
  );
}

export async function toggleSuperadmin(userId: string | number): Promise<Pick<AdminUserSummary, 'id' | 'nick' | 'is_superadmin'>> {
  const { rows } = await pool.query<Pick<AdminUserSummary, 'id' | 'nick' | 'is_superadmin'>>(
    'UPDATE users SET is_superadmin = NOT is_superadmin WHERE id = $1 RETURNING id, nick, is_superadmin',
    [userId]
  );
  return rows[0];
}
