import { pool } from '../db/pool';
import type { TimerRow } from '../types/entities';

const TIMER_FIELDS = 'id, name, period_seconds, last_reset_at, created_at, sort_order, sound_enabled';

export async function listTimers(userId: number): Promise<TimerRow[]> {
  const { rows } = await pool.query<TimerRow>(
    `SELECT ${TIMER_FIELDS} FROM user_timers WHERE user_id = $1 ORDER BY sort_order ASC, created_at ASC`,
    [userId]
  );
  return rows;
}

export async function getNextSortOrder(userId: number): Promise<number> {
  const { rows } = await pool.query<{ max_order: number }>(
    'SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM user_timers WHERE user_id = $1',
    [userId]
  );
  return (rows[0]?.max_order || 0) + 1;
}

export async function createTimer(userId: number, name: string, periodSeconds: number, sortOrder: number): Promise<TimerRow> {
  const { rows } = await pool.query<TimerRow>(
    `INSERT INTO user_timers (user_id, name, period_seconds, last_reset_at, sort_order)
     VALUES ($1, $2, $3, NOW(), $4)
     RETURNING ${TIMER_FIELDS}`,
    [userId, name, periodSeconds, sortOrder]
  );
  return rows[0];
}

export async function findPeriodSeconds(id: string | number, userId: number): Promise<Pick<TimerRow, 'period_seconds'> | null> {
  const { rows } = await pool.query<Pick<TimerRow, 'period_seconds'>>(
    'SELECT period_seconds FROM user_timers WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0] || null;
}

// sets/values построены сервисом (те же $i-плейсхолдеры, что были в роуте) —
// репозиторий просто дописывает id/user_id в конец и выполняет запрос.
export async function runUpdate(
  sets: string[],
  values: Array<string | number | boolean | Date>,
  id: string | number,
  userId: number
): Promise<TimerRow | null> {
  const i = values.length + 1;
  const { rows } = await pool.query<TimerRow>(
    `UPDATE user_timers SET ${sets.join(', ')}
     WHERE id = $${i} AND user_id = $${i + 1}
     RETURNING ${TIMER_FIELDS}`,
    [...values, id, userId]
  );
  return rows[0] || null;
}

// ИСПРАВЛЕНО: раньше BEGIN/COMMIT/ROLLBACK шли через pool.query(...), а не
// через выделенный client — каждый вызов мог уйти на РАЗНОЕ соединение из
// пула, и фактической атомарности не было (баг из README → «Известные
// существующие проблемы»). Теперь вся транзакция держится на одном client,
// полученном через pool.connect(), и client гарантированно освобождается
// в finally.
export async function reorderTimers(order: Array<string | number>, userId: number): Promise<TimerRow[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let idx = 0; idx < order.length; idx++) {
      await client.query(
        'UPDATE user_timers SET sort_order = $1 WHERE id = $2 AND user_id = $3',
        [idx + 1, order[idx], userId]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
  return listTimers(userId);
}

export async function resetTimer(id: string | number, userId: number): Promise<TimerRow | null> {
  const { rows } = await pool.query<TimerRow>(
    `UPDATE user_timers SET last_reset_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING ${TIMER_FIELDS}`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function clearTimer(id: string | number, userId: number): Promise<TimerRow | null> {
  const { rows } = await pool.query<TimerRow>(
    `UPDATE user_timers SET last_reset_at = NULL
     WHERE id = $1 AND user_id = $2
     RETURNING ${TIMER_FIELDS}`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function deleteTimer(id: string | number, userId: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    'DELETE FROM user_timers WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return (rowCount ?? 0) > 0;
}
