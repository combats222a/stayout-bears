const router = require('express').Router();
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

// GET /shining — получить текущие данные Сияния для клана
router.get('/', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Ты не в клане' });
  try {
    const { rows } = await pool.query(
      `SELECT anchor_iso, location_id, game_time_str, set_at, set_by_nick
       FROM shining WHERE clan_id = $1 LIMIT 1`,
      [req.user.clan_id]
    );
    if (!rows.length) return res.json(null);
    const r = rows[0];
    res.json({
      anchorIso:   r.anchor_iso,
      locationId:  r.location_id,
      gameTimeStr: r.game_time_str,
      setAt:       r.set_at,
      setByNick:   r.set_by_nick,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /shining/set — установить / обновить время Сияния для клана
router.post('/set', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Ты не в клане' });

  const { anchorIso, locationId, gameTimeStr } = req.body;
  if (!anchorIso || !locationId) return res.status(400).json({ error: 'anchorIso и locationId обязательны' });

  const nick = req.user.game_nick || req.user.nick;
  const setAt = new Date().toISOString();

  try {
    await pool.query(
      `INSERT INTO shining (clan_id, anchor_iso, location_id, game_time_str, set_at, set_by_nick)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (clan_id) DO UPDATE
         SET anchor_iso=$2, location_id=$3, game_time_str=$4, set_at=$5, set_by_nick=$6`,
      [req.user.clan_id, anchorIso, locationId, gameTimeStr || '', setAt, nick]
    );

    const payload = { anchorIso, locationId, gameTimeStr, setAt, setByNick: nick };

    // Уведомить всех участников клана через WebSocket
    req.getIo().to(`clan:${req.user.clan_id}`).emit('shining:update', payload);

    res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
