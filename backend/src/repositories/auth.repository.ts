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

// ИСПРАВЛЕНО: раньше эта функция обновляла только game_nick — а фронтенд
// (ProfilePage.tsx) даёт менять оба поля: "Логин (для входа на сайт)"
// (nick) и "Игровой ник" (game_nick), отправляя оба в PUT /auth/profile.
// Пользователь молча не видел изменения логина — оно нигде не терялось
// в БД, а просто никогда не отправлялось в UPDATE (сервис читал только
// game_nick из тела запроса). Теперь обновляем оба поля, если они
// переданы.
export async function updateProfile(userId: number, nick: string, gameNick: string): Promise<AuthUser> {
  const { rows } = await pool.query<AuthUser>(
    'UPDATE users SET nick = $1, game_nick = $2 WHERE id = $3 RETURNING id, nick, game_nick, email, clan_id, is_superadmin',
    [nick, gameNick, userId]
  );
  return rows[0];
}

// ИЗМЕНЕНО: раньше владелец клана с другими участниками не мог удалить
// аккаунт вообще (транзакция откатывалась, сервис возвращал 400 с
// просьбой сначала кикнуть всех/передать лидерство) — по просьбе убрали
// это ограничение. Теперь при удалении аккаунта владельца с другими
// участниками клан не блокируется и не удаляется — лидерство молча
// передаётся дальше (сначала заму, если он назначен и ещё в клане,
// иначе — участнику, раньше всех вступившему), и аккаунт удаляется как
// обычно. Клан удаляется целиком только если участников кроме самого
// владельца не осталось (как и раньше).
export async function deleteAccountTx(userId: number, clanId: number | null): Promise<void> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');

    if (clanId) {
      const { rows: clanRows } = await client.query('SELECT * FROM clans WHERE id = $1', [clanId]);
      const clan = clanRows[0];
      if (clan && clan.owner_id === userId) {
        const { rows: members } = await client.query(
          'SELECT id FROM users WHERE clan_id = $1 AND id != $2 ORDER BY id ASC',
          [clanId, userId]
        );
        if (members.length > 0) {
          const deputyStillMember = clan.deputy_id != null && members.some((m) => m.id === clan.deputy_id);
          const newOwnerId = deputyStillMember ? clan.deputy_id : members[0].id;
          await client.query(
            'UPDATE clans SET owner_id = $1, deputy_id = CASE WHEN deputy_id = $1 THEN NULL ELSE deputy_id END WHERE id = $2',
            [newOwnerId, clan.id]
          );
        } else {
          await client.query('DELETE FROM clans WHERE id = $1', [clan.id]);
        }
      } else {
        await client.query('UPDATE users SET clan_id = NULL WHERE id = $1', [userId]);
      }
    }

    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
