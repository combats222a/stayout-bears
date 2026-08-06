import { pool } from '../db/pool';
import type { PoolClient } from 'pg';
import type { User, AuthUser } from '../types/entities';

export async function createUser(nick: string, gameNick: string, email: string, passwordHash: string): Promise<AuthUser> {
  const { rows } = await pool.query<AuthUser>(
    'INSERT INTO users (nick, game_nick, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, nick, game_nick, email, clan_id, is_superadmin',
    [nick, gameNick, email, passwordHash]
  );
  return rows[0];
}

export async function findByLoginOrEmail(login: string): Promise<User | null> {
  const { rows } = await pool.query<User>('SELECT * FROM users WHERE nick = $1 OR email = $1', [login]);
  return rows[0] || null;
}

export async function updateGameNick(userId: number, gameNick: string): Promise<AuthUser> {
  const { rows } = await pool.query<AuthUser>(
    'UPDATE users SET game_nick = $1 WHERE id = $2 RETURNING id, nick, game_nick, email, clan_id, is_superadmin',
    [gameNick, userId]
  );
  return rows[0];
}

// Транзакция удаления аккаунта — если владелец клана с другими
// участниками, откатываем и сообщаем об этом сервису (blocked: true),
// не бросая ошибку — это ожидаемый бизнес-исход, а не сбой.
export async function deleteAccountTx(userId: number, clanId: number | null): Promise<{ blocked: boolean }> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');

    if (clanId) {
      const { rows: clanRows } = await client.query('SELECT * FROM clans WHERE id = $1', [clanId]);
      const clan = clanRows[0];
      if (clan && clan.owner_id === userId) {
        const { rows: members } = await client.query(
          'SELECT id FROM users WHERE clan_id = $1 AND id != $2',
          [clanId, userId]
        );
        if (members.length > 0) {
          await client.query('ROLLBACK');
          return { blocked: true };
        }
        await client.query('DELETE FROM clans WHERE id = $1', [clan.id]);
      } else {
        await client.query('UPDATE users SET clan_id = NULL WHERE id = $1', [userId]);
      }
    }

    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');
    return { blocked: false };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
