const router = require('express').Router();
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

// GET /api/hearts — список участников рейда клана
router.get('/', auth, async (req, res) => {
  if (!req.user.clan_id) return res.json({ participants: [] });
  try {
    const { rows } = await pool.query(
      `SELECT * FROM loot_participants
       WHERE clan_id = $1
       ORDER BY added_at ASC`,
      [req.user.clan_id]
    );
    res.json({ participants: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/hearts/participant — добавить участника
router.post('/participant', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Ты не в клане' });
  const { nick, user_id } = req.body;
  if (!nick || !nick.trim()) return res.status(400).json({ error: 'Укажи ник' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO loot_participants (clan_id, user_id, nick)
       VALUES ($1, $2, $3)
       ON CONFLICT (clan_id, nick) DO UPDATE SET nick = EXCLUDED.nick
       RETURNING *`,
      [req.user.clan_id, user_id || null, nick.trim()]
    );
    req.getIo().to(`clan:${req.user.clan_id}`).emit('hearts:update');
    res.json({ participant: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PATCH /api/hearts/:id — обновить hearts/pelts/sold_for
router.patch('/:id', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  const { hearts, pelts, sold_for } = req.body;
  const sets = [];
  const vals = [];
  let i = 1;
  if (hearts !== undefined) { sets.push(`hearts = $${i++}`); vals.push(Math.max(0, hearts)); }
  if (pelts  !== undefined) { sets.push(`pelts  = $${i++}`); vals.push(Math.max(0, pelts)); }
  if (sold_for !== undefined) { sets.push(`sold_for = $${i++}`); vals.push(sold_for === '' || sold_for === null ? null : parseInt(sold_for)); }
  if (!sets.length) return res.status(400).json({ error: 'Нечего обновлять' });
  vals.push(req.params.id, req.user.clan_id);
  try {
    const { rows } = await pool.query(
      `UPDATE loot_participants SET ${sets.join(', ')}
       WHERE id = $${i} AND clan_id = $${i+1} RETURNING *`,
      vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Не найден' });
    req.getIo().to(`clan:${req.user.clan_id}`).emit('hearts:update');
    res.json({ participant: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/hearts/:id — удалить участника
router.delete('/:id', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM loot_participants WHERE id = $1 AND clan_id = $2',
      [req.params.id, req.user.clan_id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Не найден' });
    req.getIo().to(`clan:${req.user.clan_id}`).emit('hearts:update');
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/hearts/reset — сбросить всю таблицу (очистить рейд)
router.post('/reset', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  try {
    await pool.query('DELETE FROM loot_participants WHERE clan_id = $1', [req.user.clan_id]);
    req.getIo().to(`clan:${req.user.clan_id}`).emit('hearts:update');
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
