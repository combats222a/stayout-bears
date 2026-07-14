const router = require('express').Router();
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

// Аномальные прорывы / Уледная жара — в отличие от Сияния (одна запись на
// клан), здесь одна запись на АККАУНТ: видит и настраивает только сам
// игрок, независимо от того, в каком он клане. Локация всегда GMT+0,
// поэтому её хранить не нужно — только якорь Z (игровое время) и якорь X
// (реальное время в момент ввода).

// GET /api/anomaly — якорь текущего пользователя (или null, если ещё не задан)
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT anchor_iso, game_time_str, set_at
       FROM user_anomaly WHERE user_id = $1 LIMIT 1`,
      [req.user.id]
    );
    if (!rows.length) return res.json(null);
    const r = rows[0];
    res.json({
      anchorIso:    r.anchor_iso,
      anchorRealMs: new Date(r.anchor_iso).getTime(),
      gameTimeStr:  r.game_time_str,
      setAt:        r.set_at,
      setByNick:    req.user.game_nick || req.user.nick,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/anomaly/set — сохранить/обновить якорь текущего пользователя
router.post('/set', auth, async (req, res) => {
  const { anchorRealMs, anchorIso, gameTimeStr } = req.body;
  const anchorIsoFinal = anchorIso || (anchorRealMs ? new Date(anchorRealMs).toISOString() : null);
  const anchorRealMsFinal = anchorRealMs || (anchorIso ? new Date(anchorIso).getTime() : null);

  if (!anchorIsoFinal) return res.status(400).json({ error: 'anchor обязателен' });

  const setAt = new Date().toISOString();

  try {
    await pool.query(
      `INSERT INTO user_anomaly (user_id, anchor_iso, game_time_str, set_at)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id) DO UPDATE
         SET anchor_iso=$2, game_time_str=$3, set_at=$4`,
      [req.user.id, anchorIsoFinal, gameTimeStr || '', setAt]
    );

    res.json({
      anchorIso:    anchorIsoFinal,
      anchorRealMs: anchorRealMsFinal,
      gameTimeStr,
      setAt,
      setByNick: req.user.game_nick || req.user.nick,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
