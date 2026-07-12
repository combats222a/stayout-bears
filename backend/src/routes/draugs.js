const router = require('express').Router();
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

const DRAUG_RESPAWN_MS = 25 * 60 * 1000;
const MAX_DRAUG_INDEX  = 6;

// POST /draugs/:index/kill
// body: { killed_at? } — если не передан, используется текущее время (кнопка "Сейчас")
// если передан — кнопка "Исчез" (драуг пропал ~5 мин назад)
router.post('/:index/kill', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Ты не в клане' });

  const draugIndex = parseInt(req.params.index);
  if (draugIndex < 1 || draugIndex > MAX_DRAUG_INDEX)
    return res.status(400).json({ error: `Индекс драуга 1-${MAX_DRAUG_INDEX}` });

  try {
    const killedAt = req.body.killed_at ? new Date(req.body.killed_at) : new Date();
    const spawnAt  = new Date(killedAt.getTime() + DRAUG_RESPAWN_MS);

    const { rows } = await pool.query(
      `INSERT INTO draugs (clan_id, draug_index, killed_at, killed_by, spawn_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (clan_id, draug_index)
       DO UPDATE SET killed_at = $3, killed_by = $4, spawn_at = $5
       RETURNING *`,
      [req.user.clan_id, draugIndex, killedAt, req.user.id, spawnAt]
    );

    const draug = { ...rows[0], killer_nick: req.user.game_nick || req.user.nick };
    req.getIo().to(`clan:${req.user.clan_id}`).emit('draug:update', draug);
    res.json({ draug });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /draugs/:index/reset
router.post('/:index/reset', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Ты не в клане' });

  const draugIndex = parseInt(req.params.index);
  if (draugIndex < 1 || draugIndex > MAX_DRAUG_INDEX)
    return res.status(400).json({ error: `Индекс драуга 1-${MAX_DRAUG_INDEX}` });

  try {
    const { rows } = await pool.query(
      `UPDATE draugs SET killed_at = NULL, killed_by = NULL, spawn_at = NULL
       WHERE clan_id = $1 AND draug_index = $2 RETURNING *`,
      [req.user.clan_id, draugIndex]
    );
    if (!rows.length) return res.status(404).json({ error: 'Драуг не найден' });

    const draug = { ...rows[0], killer_nick: null };
    req.getIo().to(`clan:${req.user.clan_id}`).emit('draug:update', draug);
    res.json({ draug });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
