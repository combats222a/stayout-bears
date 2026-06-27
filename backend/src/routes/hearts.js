const router = require('express').Router();
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

// GET /api/hearts — список всех сердец клана + статистика по участникам
router.get('/', auth, async (req, res) => {
  if (!req.user.clan_id) return res.json({ hearts: [], stats: [] });
  try {
    const { rows: hearts } = await pool.query(
      `SELECT h.*, COALESCE(u.game_nick, u.nick) as recorder_nick
       FROM hearts h
       LEFT JOIN users u ON h.recorded_by = u.id
       WHERE h.clan_id = $1
       ORDER BY h.recorded_at DESC`,
      [req.user.clan_id]
    );

    // Статистика: кол-во сердец по каждому участнику
    const { rows: stats } = await pool.query(
      `SELECT
         h.found_by_nick as nick,
         h.found_by_user_id as user_id,
         COUNT(*) as heart_count
       FROM hearts h
       WHERE h.clan_id = $1
       GROUP BY h.found_by_nick, h.found_by_user_id
       ORDER BY heart_count DESC`,
      [req.user.clan_id]
    );

    res.json({ hearts, stats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/hearts — добавить сердце
// body: { found_by_user_id?: number, found_by_nick: string, note?: string }
router.post('/', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Ты не в клане' });

  const { found_by_user_id, found_by_nick, note } = req.body;
  if (!found_by_nick || !found_by_nick.trim()) {
    return res.status(400).json({ error: 'Укажи ник игрока' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO hearts (clan_id, found_by_user_id, found_by_nick, recorded_by, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.clan_id,
        found_by_user_id || null,
        found_by_nick.trim(),
        req.user.id,
        note || '',
      ]
    );

    req.getIo().to(`clan:${req.user.clan_id}`).emit('hearts:update');
    res.json({ heart: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/hearts/:id — удалить запись (любой член клана)
router.delete('/:id', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM hearts WHERE id = $1 AND clan_id = $2',
      [req.params.id, req.user.clan_id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Запись не найдена' });
    req.getIo().to(`clan:${req.user.clan_id}`).emit('hearts:update');
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
