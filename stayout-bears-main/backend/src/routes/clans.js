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

    // Init 9 bears
    for (let i = 1; i <= 9; i++) {
      await client.query(
        'INSERT INTO bears (clan_id, bear_index) VALUES ($1, $2) ON CONFLICT DO NOTHING',
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
  } finally {
    client.release();
  }
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
    await pool.query('UPDATE users SET clan_id = $1 WHERE id = $2', [clan.id, req.user.id]);

    req.getIo().to(`clan:${clan.id}`).emit('clan:update');
    res.json({ clan });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Leave clan
router.post('/leave', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(400).json({ error: 'Ты не в клане' });

  try {
    const { rows: clanRows } = await pool.query('SELECT * FROM clans WHERE id = $1', [req.user.clan_id]);
    const clan = clanRows[0];

    if (clan && clan.owner_id === req.user.id) {
      // Check if there are other members
      const { rows: members } = await pool.query(
        'SELECT id FROM users WHERE clan_id = $1 AND id != $2',
        [req.user.clan_id, req.user.id]
      );
      if (members.length > 0) {
        return res.status(400).json({ error: 'Ты владелец клана. Сначала передай владение или кикни всех участников.' });
      }
      // Delete clan (bears cascade)
      await pool.query('DELETE FROM clans WHERE id = $1', [clan.id]);
    }

    await pool.query('UPDATE users SET clan_id = NULL WHERE id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get clan info
router.get('/me', auth, async (req, res) => {
  if (!req.user.clan_id) return res.json({ clan: null, members: [], bears: [] });

  try {
    const { rows: clanRows } = await pool.query('SELECT * FROM clans WHERE id = $1', [req.user.clan_id]);
    if (!clanRows.length) return res.json({ clan: null, members: [], bears: [] });

    const clan = clanRows[0];
    const { rows: members } = await pool.query(
      'SELECT id, nick, email FROM users WHERE clan_id = $1 ORDER BY id',
      [req.user.clan_id]
    );
    const { rows: bears } = await pool.query(
      `SELECT b.*, u.nick as killer_nick FROM bears b
       LEFT JOIN users u ON b.killed_by = u.id
       WHERE b.clan_id = $1 ORDER BY b.bear_index`,
      [req.user.clan_id]
    );

    res.json({ clan, members, bears });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Kick member (owner only)
router.post('/kick/:userId', auth, async (req, res) => {
  if (!req.user.clan_id) return res.status(403).json({ error: 'Нет клана' });

  try {
    const { rows } = await pool.query('SELECT owner_id FROM clans WHERE id = $1', [req.user.clan_id]);
    if (!rows.length || rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Только владелец может кикать' });
    }

    const targetId = parseInt(req.params.userId);
    if (targetId === req.user.id) return res.status(400).json({ error: 'Нельзя кикнуть себя' });

    await pool.query('UPDATE users SET clan_id = NULL WHERE id = $1 AND clan_id = $2', [targetId, req.user.clan_id]);
    req.getIo().to(`clan:${req.user.clan_id}`).emit('clan:update');
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
