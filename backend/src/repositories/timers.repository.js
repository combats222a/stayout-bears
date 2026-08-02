const { pool } = require('../db/pool');

const TIMER_FIELDS = 'id, name, period_seconds, last_reset_at, created_at, sort_order, sound_enabled';

async function listTimers(userId) {
  const { rows } = await pool.query(
    `SELECT ${TIMER_FIELDS} FROM user_timers WHERE user_id = $1 ORDER BY sort_order ASC, created_at ASC`,
    [userId]
  );
  return rows;
}

async function getNextSortOrder(userId) {
  const { rows } = await pool.query(
    'SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM user_timers WHERE user_id = $1',
    [userId]
  );
  return (rows[0]?.max_order || 0) + 1;
}

async function createTimer(userId, name, periodSeconds, sortOrder) {
  const { rows } = await pool.query(
    `INSERT INTO user_timers (user_id, name, period_seconds, last_reset_at, sort_order)
     VALUES ($1, $2, $3, NOW(), $4)
     RETURNING ${TIMER_FIELDS}`,
    [userId, name, periodSeconds, sortOrder]
  );
  return rows[0];
}

async function findPeriodSeconds(id, userId) {
  const { rows } = await pool.query(
    'SELECT period_seconds FROM user_timers WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0] || null;
}

// sets/values построены сервисом (те же $i-плейсхолдеры, что были в роуте) —
// репозиторий просто дописывает id/user_id в конец и выполняет запрос.
async function runUpdate(sets, values, id, userId) {
  const i = values.length + 1;
  const { rows } = await pool.query(
    `UPDATE user_timers SET ${sets.join(', ')}
     WHERE id = $${i} AND user_id = $${i + 1}
     RETURNING ${TIMER_FIELDS}`,
    [...values, id, userId]
  );
  return rows[0] || null;
}

// ВНИМАНИЕ: как и в оригинале, здесь BEGIN/COMMIT/ROLLBACK идут через
// pool.query(...), а не через выделенный client — то есть каждый вызов
// может уйти на РАЗНОЕ соединение из пула, и фактической атомарности нет.
// Это существующий баг оригинального кода, перенесён как есть (см.
// ARCHITECTURE.md → «Известные существующие проблемы»), не исправлял.
async function reorderTimers(order, userId) {
  await pool.query('BEGIN');
  try {
    for (let idx = 0; idx < order.length; idx++) {
      await pool.query(
        'UPDATE user_timers SET sort_order = $1 WHERE id = $2 AND user_id = $3',
        [idx + 1, order[idx], userId]
      );
    }
    await pool.query('COMMIT');
  } catch (e) {
    await pool.query('ROLLBACK').catch(() => {});
    throw e;
  }
  return listTimers(userId);
}

async function resetTimer(id, userId) {
  const { rows } = await pool.query(
    `UPDATE user_timers SET last_reset_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING ${TIMER_FIELDS}`,
    [id, userId]
  );
  return rows[0] || null;
}

async function clearTimer(id, userId) {
  const { rows } = await pool.query(
    `UPDATE user_timers SET last_reset_at = NULL
     WHERE id = $1 AND user_id = $2
     RETURNING ${TIMER_FIELDS}`,
    [id, userId]
  );
  return rows[0] || null;
}

async function deleteTimer(id, userId) {
  const { rowCount } = await pool.query(
    'DELETE FROM user_timers WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
}

module.exports = {
  listTimers, getNextSortOrder, createTimer, findPeriodSeconds, runUpdate,
  reorderTimers, resetTimer, clearTimer, deleteTimer,
};
