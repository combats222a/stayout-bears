const router = require('express').Router();
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

function genCode() {
  return Math.random().toString(36).toUpperCase().slice(2, 8);
}

// Create clan
router.post('/create', auth, async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Название клана: минимум 2 символа' });
  if (req.user.clan_id) return res.status(400).json({ error: 'Ты уже в клане. Сначала выйди.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let code, exists = true;
    while (exists) {
      code = genCode();
      const { rows } = await client.query('SELECT id FROM clans WHERE code = $1', [code]);
      exists = rows.length > 0;
    }
    const { rows } = await client.query(
      'INSERT INTO clans (name, code, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), code, req.user.id]
    );
    const clan = rows[0];
    await client.query('UPDATE users SET clan_id = $1 WHERE id = $2', [clan.id, req.user.id]);
    for (let i = 1; i <= 11; i++) {
      await client.query(
        'INSERT INTO bears (clan_id, bear_index) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [clan.id, i]
      );
    }
    for (let i = 1; i <= 6; i++) {
      await client.query(
        'INSERT INTO draugs (clan_id, draug_index) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [clan.id, i]
      );
    }
    await client.query('COMMIT');
    req.getIo().to(`clan:${clan.id}`).emit('clan:update');
    res.json({ clan });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: 'Клан с таким названием уже существует' });
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  } finally { client.release(); }
});

// Join clan
router.post('/join', auth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Укажи код клана' });
  if (req.user.clan_id) return res.status(400).json({ error: 'Ты уже в клане' });
  try {
    const { rows } = await pool.query('SELECT * FROM clans WHERE code = $1', [code.toUpperCase()]);
    if (!rows.length) return res.status(404).json({ error: 'Клан не найден' });
    const clan = rows[0];

    // Check if user is banned in this clan
    const { rows: banRows } = await pool.query(
      'SELECT id FROM clan_bans WHERE clan_id = $1 AND user_id = $2',
      [clan.id, req.user.id]
    );
    if (banRows.length > 0) {
      return res.status(403).json({ error: 'Ты заблокирован в этой группировке' });
    }

    await pool.query('UPDATE users SET clan_id = $1 WHERE id = $2', [clan.id, req.user.id]);
    req.getIo().to(`clan:${clan.id}`).emit('clan:update');
    res.json({ clan });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

// Leave clan
router.post('/leave', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(400).json({ error: 'Ты не в клане' });
  try {
    const { rows: clanRows } = await pool.query('SELECT * FROM clans WHERE id = $1', [req.user.clan_id]);
    const clan = clanRows[0];
    if (clan && clan.owner_id === req.user.id) {
      const { rows: members } = await pool.query(
        'SELECT id FROM users WHERE clan_id = $1 AND id != $2', [req.user.clan_id, req.user.id]
      );
      if (members.length > 0)
        return res.status(400).json({ error: 'Ты лидер. Передай лидерство или кикни всех участников.' });
      await pool.query('DELETE FROM clans WHERE id = $1', [clan.id]);
    }
    await pool.query('UPDATE users SET clan_id = NULL WHERE id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

// Get clan info (including bans)
router.get('/me', auth, async (req, res) => {
  if (!req.user.clan_id) return res.json({ clan: null, members: [], bears: [], draugs: [], bans: [] });
  try {
    const { rows: clanRows } = await pool.query('SELECT * FROM clans WHERE id = $1', [req.user.clan_id]);
    if (!clanRows.length) return res.json({ clan: null, members: [], bears: [], draugs: [], bans: [] });
    const clan = clanRows[0];
    const { rows: members } = await pool.query(
      'SELECT id, nick, game_nick, email FROM users WHERE clan_id = $1 ORDER BY id',
      [req.user.clan_id]
    );
    const { rows: bears } = await pool.query(
      `SELECT b.*, COALESCE(u.game_nick, u.nick) as killer_nick FROM bears b
       LEFT JOIN users u ON b.killed_by = u.id
       WHERE b.clan_id = $1 ORDER BY b.bear_index`,
      [req.user.clan_id]
    );
    const { rows: draugs } = await pool.query(
      `SELECT d.*, COALESCE(u.game_nick, u.nick) as killer_nick FROM draugs d
       LEFT JOIN users u ON d.killed_by = u.id
       WHERE d.clan_id = $1 ORDER BY d.draug_index`,
      [req.user.clan_id]
    );
    const { rows: bans } = await pool.query(
      `SELECT cb.user_id, cb.banned_at, cb.banned_by,
              COALESCE(u.game_nick, u.nick) as nick
       FROM clan_bans cb
       LEFT JOIN users u ON cb.user_id = u.id
       WHERE cb.clan_id = $1 ORDER BY cb.banned_at DESC`,
      [req.user.clan_id]
    );
    res.json({ clan, members, bears, draugs, bans });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

// Kick member (owner OR deputy, but deputy can't kick owner/other deputy)
router.post('/kick/:userId', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  try {
    const { rows } = await pool.query('SELECT owner_id, deputy_id FROM clans WHERE id = $1', [req.user.clan_id]);
    if (!rows.length) return res.status(404).json({ error: 'Клан не найден' });
    const { owner_id, deputy_id } = rows[0];
    const isOwner = owner_id === req.user.id;
    const isDeputy = deputy_id === req.user.id;
    if (!isOwner && !isDeputy) return res.status(403).json({ error: 'Недостаточно прав' });

    const targetId = parseInt(req.params.userId);
    if (targetId === req.user.id) return res.status(400).json({ error: 'Нельзя кикнуть себя' });
    if (!isOwner && targetId === owner_id) return res.status(403).json({ error: 'Зам не может кикнуть лидера' });
    if (!isOwner && targetId === deputy_id) return res.status(403).json({ error: 'Зам не может кикнуть другого зама' });

    if (targetId === deputy_id) {
      await pool.query('UPDATE clans SET deputy_id = NULL WHERE id = $1', [req.user.clan_id]);
    }

    await pool.query('UPDATE users SET clan_id = NULL WHERE id = $1 AND clan_id = $2', [targetId, req.user.clan_id]);
    req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

// Ban member (owner OR deputy; deputy can't ban owner/other deputy)
router.post('/ban/:userId', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  try {
    const { rows } = await pool.query('SELECT owner_id, deputy_id FROM clans WHERE id = $1', [req.user.clan_id]);
    if (!rows.length) return res.status(404).json({ error: 'Клан не найден' });
    const { owner_id, deputy_id } = rows[0];
    const isOwner = owner_id === req.user.id;
    const isDeputy = deputy_id === req.user.id;
    if (!isOwner && !isDeputy) return res.status(403).json({ error: 'Недостаточно прав' });

    const targetId = parseInt(req.params.userId);
    if (targetId === req.user.id) return res.status(400).json({ error: 'Нельзя заблокировать себя' });
    if (targetId === owner_id) return res.status(403).json({ error: 'Нельзя заблокировать лидера' });
    if (!isOwner && targetId === deputy_id) return res.status(403).json({ error: 'Зам не может заблокировать другого зама' });

    // Check target is in this clan (or was previously)
    // Kick from clan first
    if (targetId === deputy_id) {
      await pool.query('UPDATE clans SET deputy_id = NULL WHERE id = $1', [req.user.clan_id]);
    }
    await pool.query('UPDATE users SET clan_id = NULL WHERE id = $1 AND clan_id = $2', [targetId, req.user.clan_id]);

    // Add ban record
    await pool.query(
      'INSERT INTO clan_bans (clan_id, user_id, banned_by) VALUES ($1, $2, $3) ON CONFLICT (clan_id, user_id) DO NOTHING',
      [req.user.clan_id, targetId, req.user.id]
    );

    req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

// Unban member (owner only)
router.post('/unban/:userId', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  try {
    const { rows } = await pool.query('SELECT owner_id FROM clans WHERE id = $1', [req.user.clan_id]);
    if (!rows.length) return res.status(404).json({ error: 'Клан не найден' });
    if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Только лидер может разбанить' });

    const targetId = parseInt(req.params.userId);
    await pool.query('DELETE FROM clan_bans WHERE clan_id = $1 AND user_id = $2', [req.user.clan_id, targetId]);
    req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

// Transfer leadership (owner only)
router.post('/transfer/:userId', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  try {
    const { rows } = await pool.query('SELECT owner_id FROM clans WHERE id = $1', [req.user.clan_id]);
    if (!rows.length) return res.status(404).json({ error: 'Клан не найден' });
    if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Только лидер может передать власть' });

    const targetId = parseInt(req.params.userId);
    if (targetId === req.user.id) return res.status(400).json({ error: 'Это уже ты' });

    const { rows: targetRows } = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND clan_id = $2', [targetId, req.user.clan_id]
    );
    if (!targetRows.length) return res.status(404).json({ error: 'Игрок не в клане' });

    await pool.query(
      'UPDATE clans SET owner_id = $1, deputy_id = CASE WHEN deputy_id = $1 THEN NULL ELSE deputy_id END WHERE id = $2',
      [targetId, req.user.clan_id]
    );
    req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

// Set / unset deputy (owner only)
router.post('/deputy/:userId', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  try {
    const { rows } = await pool.query('SELECT owner_id, deputy_id FROM clans WHERE id = $1', [req.user.clan_id]);
    if (!rows.length) return res.status(404).json({ error: 'Клан не найден' });
    if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Только лидер может назначать зама' });

    const targetId = parseInt(req.params.userId);
    if (targetId === req.user.id) return res.status(400).json({ error: 'Нельзя назначить себя замом' });

    const newDeputy = rows[0].deputy_id === targetId ? null : targetId;
    await pool.query('UPDATE clans SET deputy_id = $1 WHERE id = $2', [newDeputy, req.user.clan_id]);
    req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
    res.json({ ok: true, deputy_id: newDeputy });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

// Rename clan (owner only)
router.post('/rename', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  const { name } = req.body;
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Название клана: минимум 2 символа' });
  if (name.trim().length > 64) return res.status(400).json({ error: 'Название клана: максимум 64 символа' });
  try {
    const { rows } = await pool.query('SELECT owner_id FROM clans WHERE id = $1', [req.user.clan_id]);
    if (!rows.length) return res.status(404).json({ error: 'Клан не найден' });
    if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Только лидер может переименовать группировку' });

    const { rows: updated } = await pool.query(
      'UPDATE clans SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), req.user.clan_id]
    );
    req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
    res.json({ clan: updated[0] });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Клан с таким названием уже существует' });
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Refresh invite code (owner OR deputy)
router.post('/refresh-code', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });
  try {
    const { rows } = await pool.query('SELECT owner_id, deputy_id FROM clans WHERE id = $1', [req.user.clan_id]);
    if (!rows.length) return res.status(404).json({ error: 'Клан не найден' });
    const { owner_id, deputy_id } = rows[0];
    if (owner_id !== req.user.id && deputy_id !== req.user.id) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    let code, exists = true;
    while (exists) {
      code = genCode();
      const { rows: r } = await pool.query('SELECT id FROM clans WHERE code = $1', [code]);
      exists = r.length > 0;
    }

    const { rows: updated } = await pool.query(
      'UPDATE clans SET code = $1 WHERE id = $2 RETURNING *',
      [code, req.user.clan_id]
    );
    req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
    res.json({ clan: updated[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка сервера' }); }
});

module.exports = router;
