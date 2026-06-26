const router = require('express').Router();
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

const BEAR_RESPAWN_MS = 35 * 60 * 1000;
const MAX_BEAR_INDEX  = 11;

// POST /bears/:index/kill
// body: { killed_at? } — если не передан, используется текущее время (кнопка "Сейчас")
// если передан — кнопка "Исчез" (медведь пропал ~5 мин назад)
router.post('/:index/kill', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Ты не в клане' });

  const bearIndex = parseInt(req.params.index);
  if (bearIndex < 1 || bearIndex > MAX_BEAR_INDEX)
    return res.status(400).json({ error: `Индекс медведя 1-${MAX_BEAR_INDEX}` });

  try {
    const killedAt = req.body.killed_at ? new Date(req.body.killed_at) : new Date();
    const spawnAt  = new Date(killedAt.getTime() + BEAR_RESPAWN_MS);

    const { rows } = await pool.query(
      `INSERT INTO bears (clan_id, bear_index, killed_at, killed_by, spawn_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (clan_id, bear_index)
       DO UPDATE SET killed_at = $3, killed_by = $4, spawn_at = $5
       RETURNING *`,
      [req.user.clan_id, bearIndex, killedAt, req.user.id, spawnAt]
    );

    const bear = { ...rows[0], killer_nick: req.user.game_nick || req.user.nick };
    req.getIo().to(`clan:${req.user.clan_id}`).emit('bear:update', bear);
    res.json({ bear });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /bears/:index/reset
router.post('/:index/reset', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Ты не в клане' });

  const bearIndex = parseInt(req.params.index);
  if (bearIndex < 1 || bearIndex > MAX_BEAR_INDEX)
    return res.status(400).json({ error: `Индекс медведя 1-${MAX_BEAR_INDEX}` });

  try {
    const { rows } = await pool.query(
      `UPDATE bears SET killed_at = NULL, killed_by = NULL, spawn_at = NULL
       WHERE clan_id = $1 AND bear_index = $2 RETURNING *`,
      [req.user.clan_id, bearIndex]
    );
    if (!rows.length) return res.status(404).json({ error: 'Медведь не найден' });

    const bear = { ...rows[0], killer_nick: null };
    req.getIo().to(`clan:${req.user.clan_id}`).emit('bear:update', bear);
    res.json({ bear });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
