const router = require('express').Router();
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

// GET /api/hearts
router.get('/', auth, async (req, res) => {
  if (!req.user.clan_id) return res.json({ participants: [] });
  try {
    const { rows } = await pool.query(
      `SELECT * FROM loot_participants WHERE clan_id = $1 ORDER BY added_at ASC`,
      [req.user.clan_id]
    );
    res.json({ participants: rows });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

// POST /api/hearts/participant
router.post('/participant', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Ты не в клане' });
  const { nick, user_id } = req.body;
  if (!nick || !nick.trim()) return res.status(400).json({ error: 'Укажи ник' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO loot_participants (clan_id, user_id, nick, finders, created_by)
       VALUES ($1, $2, $3, '[]', $4)
       RETURNING *`,
      [req.user.clan_id, user_id || null, nick.trim(), req.user.id]
    );
    req.getIo().to(`clan:${req.user.clan_id}`).emit('hearts:update');
    res.json({ participant: rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

// PATCH /api/hearts/:id
router.patch('/:id', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  const { hearts, pelts, sold_for, finders, paid_out } = req.body;

  // "Сердца", "Шкуры", "Продали за", "Участники" и "Выплачено участникам" —
  // редактировать может только тот, чей аккаунт привязан к нику в этой строке
  // (user_id, колонка «НИК»). Если ник «гостевой» (вписан вручную, аккаунта
  // нет) — доступ у того, кто добавил строку (created_by). Если и этого нет
  // (старая запись без обеих привязок) — доступ у лидера/зама клана, чтобы
  // строка не «зависла» навсегда.
  if (hearts !== undefined || pelts !== undefined || sold_for !== undefined ||
      finders !== undefined || paid_out !== undefined) {
    const { rows: ownerRows } = await pool.query(
      'SELECT user_id, created_by FROM loot_participants WHERE id = $1 AND clan_id = $2',
      [req.params.id, req.user.clan_id]
    );
    if (!ownerRows.length) return res.status(404).json({ error: 'Не найден' });
    const { user_id: nickUserId, created_by: createdBy } = ownerRows[0];
    let allowed;
    if (nickUserId != null) {
      allowed = nickUserId === req.user.id;
    } else if (createdBy != null) {
      allowed = createdBy === req.user.id;
    } else {
      const { rows: clanRows } = await pool.query(
        'SELECT owner_id, deputy_id FROM clans WHERE id = $1', [req.user.clan_id]
      );
      const c = clanRows[0] || {};
      allowed = c.owner_id === req.user.id || c.deputy_id === req.user.id;
    }
    if (!allowed) {
      return res.status(403).json({ error: 'Редактировать эту графу может только тот, чей ник указан в строке' });
    }
  }

  const sets = [];
  const vals = [];
  let i = 1;
  if (hearts   !== undefined) { sets.push(`hearts   = $${i++}`); vals.push(Math.max(0, hearts)); }
  if (pelts    !== undefined) { sets.push(`pelts    = $${i++}`); vals.push(Math.max(0, pelts)); }
  if (finders  !== undefined) { sets.push(`finders  = $${i++}`); vals.push(JSON.stringify(finders)); }
  if (paid_out !== undefined) { sets.push(`paid_out = $${i++}`); vals.push(JSON.stringify(paid_out)); }
  if (sold_for !== undefined) {
    sets.push(`sold_for = $${i++}`);
    vals.push(sold_for === '' || sold_for === null ? null : parseInt(sold_for));
  }
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
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

// DELETE /api/hearts/:id
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
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

// POST /api/hearts/reset
router.post('/reset', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  try {
    await pool.query('DELETE FROM loot_participants WHERE clan_id = $1', [req.user.clan_id]);
    req.getIo().to(`clan:${req.user.clan_id}`).emit('hearts:update');
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

module.exports = router;
