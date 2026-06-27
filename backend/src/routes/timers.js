const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

// GET /api/timers — получить все таймеры текущего пользователя
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, period_seconds, last_reset_at, created_at
       FROM user_timers
       WHERE user_id = $1
       ORDER BY created_at ASC`,
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
    const { rows } = await pool.query(
      `INSERT INTO user_timers (user_id, name, period_seconds, last_reset_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, name, period_seconds, last_reset_at, created_at`,
      [req.user.id, name.trim(), period_seconds]
    );
    res.json({ timer: rows[0] });
  } catch (e) {
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
       RETURNING id, name, period_seconds, last_reset_at, created_at`,
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
       RETURNING id, name, period_seconds, last_reset_at, created_at`,
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
