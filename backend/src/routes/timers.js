const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

const TIMER_FIELDS = 'id, name, period_seconds, last_reset_at, created_at, sort_order, sound_enabled';

// GET /api/timers — получить все таймеры текущего пользователя
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${TIMER_FIELDS}
       FROM user_timers
       WHERE user_id = $1
       ORDER BY sort_order ASC, created_at ASC`,
      [req.user.id]
    );
    res.json({ timers: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/timers — создать таймер
router.post('/', auth, async (req, res) => {
  const { name, period_seconds } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Укажите название' });
  if (!period_seconds || period_seconds < 60) return res.status(400).json({ error: 'Период минимум 1 минута' });

  try {
    const { rows: maxRows } = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM user_timers WHERE user_id = $1`,
      [req.user.id]
    );
    const nextOrder = (maxRows[0]?.max_order || 0) + 1;

    const { rows } = await pool.query(
      `INSERT INTO user_timers (user_id, name, period_seconds, last_reset_at, sort_order)
       VALUES ($1, $2, $3, NOW(), $4)
       RETURNING ${TIMER_FIELDS}`,
      [req.user.id, name.trim(), period_seconds, nextOrder]
    );
    res.json({ timer: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PATCH /api/timers/:id — изменить название / период / звук таймера
router.patch('/:id', auth, async (req, res) => {
  const { name, period_seconds, sound_enabled } = req.body;

  const sets = [];
  const values = [];
  let i = 1;

  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: 'Укажите название' });
    sets.push(`name = $${i++}`); values.push(name.trim());
  }
  if (period_seconds !== undefined) {
    if (!period_seconds || period_seconds < 60) return res.status(400).json({ error: 'Период минимум 1 минута' });
    sets.push(`period_seconds = $${i++}`); values.push(period_seconds);

    // Если период реально меняется — сбрасываем точку отсчёта на "сейчас".
    // Иначе оставшееся время считалось бы как (старый last_reset_at + новый
    // период), из-за чего после изменения периода на, скажем, 3 дня, таймер
    // показывал не полные 72 часа, а "72 часа минус время, прошедшее с
    // прошлого сброса" — то есть заметно меньше и как будто "не то" время.
    const { rows: currentRows } = await pool.query(
      `SELECT period_seconds FROM user_timers WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    const currentPeriod = currentRows[0]?.period_seconds;
    if (currentPeriod !== undefined && currentPeriod !== period_seconds) {
      sets.push(`last_reset_at = NOW()`);
    }
  }
  if (sound_enabled !== undefined) {
    sets.push(`sound_enabled = $${i++}`); values.push(!!sound_enabled);
  }
  if (!sets.length) return res.status(400).json({ error: 'Нечего изменять' });

  values.push(req.params.id, req.user.id);
  try {
    const { rows } = await pool.query(
      `UPDATE user_timers SET ${sets.join(', ')}
       WHERE id = $${i++} AND user_id = $${i++}
       RETURNING ${TIMER_FIELDS}`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Таймер не найден' });
    res.json({ timer: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/timers/reorder — сохранить новый порядок таймеров
// body: { order: [id1, id2, id3, ...] } — в новом порядке
router.post('/reorder', auth, async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order) || !order.length) return res.status(400).json({ error: 'Неверный формат' });

  try {
    await pool.query('BEGIN');
    for (let idx = 0; idx < order.length; idx++) {
      await pool.query(
        `UPDATE user_timers SET sort_order = $1 WHERE id = $2 AND user_id = $3`,
        [idx + 1, order[idx], req.user.id]
      );
    }
    await pool.query('COMMIT');

    const { rows } = await pool.query(
      `SELECT ${TIMER_FIELDS} FROM user_timers WHERE user_id = $1 ORDER BY sort_order ASC, created_at ASC`,
      [req.user.id]
    );
    res.json({ timers: rows });
  } catch (e) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/timers/:id/reset — обновить (перезапустить) таймер
router.post('/:id/reset', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE user_timers SET last_reset_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING ${TIMER_FIELDS}`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Таймер не найден' });
    res.json({ timer: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/timers/:id/clear — очистить (сбросить last_reset_at в null)
router.post('/:id/clear', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE user_timers SET last_reset_at = NULL
       WHERE id = $1 AND user_id = $2
       RETURNING ${TIMER_FIELDS}`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Таймер не найден' });
    res.json({ timer: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/timers/:id — удалить таймер
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM user_timers WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Таймер не найден' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
