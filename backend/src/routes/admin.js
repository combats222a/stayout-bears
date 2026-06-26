const router = require('express').Router();
const { pool } = require('../db/pool');
const { auth } = require('../middleware/auth');

function superadmin(req, res, next) {
  if (!req.user.is_superadmin) return res.status(403).json({ error: 'Недостаточно прав' });
  next();
}

// Get all clans with members and bears
router.get('/clans', auth, superadmin, async (req, res) => {
  try {
    const { rows: clans } = await pool.query('SELECT * FROM clans ORDER BY created_at DESC');
    const { rows: users } = await pool.query('SELECT id, nick, email, clan_id, is_superadmin, created_at FROM users ORDER BY id');
    const { rows: bears } = await pool.query(`
      SELECT b.*, u.nick as killer_nick FROM bears b
      LEFT JOIN users u ON b.killed_by = u.id
      ORDER BY b.clan_id, b.bear_index
    `);

    res.json({ clans, users, bears });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Delete clan
router.delete('/clans/:id', auth, superadmin, async (req, res) => {
  try {
    await pool.query('UPDATE users SET clan_id = NULL WHERE clan_id = $1', [req.params.id]);
    await pool.query('DELETE FROM clans WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Reset all bears in a clan
router.post('/clans/:id/reset-bears', auth, superadmin, async (req, res) => {
  try {
    await pool.query(
      'UPDATE bears SET killed_at = NULL, killed_by = NULL, spawn_at = NULL WHERE clan_id = $1',
      [req.params.id]
    );
    req.getIo().to(`clan:${req.params.id}`).emit('clan:update');
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Toggle superadmin
router.post('/users/:id/toggle-admin', auth, superadmin, async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Нельзя изменить свои права' });
  }
  try {
    const { rows } = await pool.query(
      'UPDATE users SET is_superadmin = NOT is_superadmin WHERE id = $1 RETURNING id, nick, is_superadmin',
      [req.params.id]
    );
    res.json({ user: rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
