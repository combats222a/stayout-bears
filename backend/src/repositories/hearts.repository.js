const { pool } = require('../db/pool');

async function listParticipants(clanId) {
  const { rows } = await pool.query(
    'SELECT * FROM loot_participants WHERE clan_id = $1 ORDER BY added_at ASC',
    [clanId]
  );
  return rows;
}

async function createParticipant(clanId, userId, nick, createdBy) {
  const { rows } = await pool.query(
    `INSERT INTO loot_participants (clan_id, user_id, nick, finders, created_by)
     VALUES ($1, $2, $3, '[]', $4)
     RETURNING *`,
    [clanId, userId || null, nick, createdBy]
  );
  return rows[0];
}

async function findOwner(id, clanId) {
  const { rows } = await pool.query(
    'SELECT user_id FROM loot_participants WHERE id = $1 AND clan_id = $2',
    [id, clanId]
  );
  return rows[0] || null;
}

// fields — plain object of {column: value}, вставленных сервисом в том же
// порядке, что и раньше строился sets/vals (hearts, pelts, finders,
// paid_out, sold_for) — порядок параметров в итоговом запросе тот же.
async function updateFields(id, clanId, fields) {
  const cols = Object.keys(fields);
  const sets = cols.map((c, i) => `${c} = $${i + 1}`);
  const vals = cols.map((c) => fields[c]);
  vals.push(id, clanId);
  const { rows } = await pool.query(
    `UPDATE loot_participants SET ${sets.join(', ')}
     WHERE id = $${cols.length + 1} AND clan_id = $${cols.length + 2} RETURNING *`,
    vals
  );
  return rows[0] || null;
}

async function deleteParticipant(id, clanId) {
  const { rowCount } = await pool.query(
    'DELETE FROM loot_participants WHERE id = $1 AND clan_id = $2',
    [id, clanId]
  );
  return rowCount > 0;
}

async function resetParticipants(clanId) {
  await pool.query('DELETE FROM loot_participants WHERE clan_id = $1', [clanId]);
}

module.exports = { listParticipants, createParticipant, findOwner, updateFields, deleteParticipant, resetParticipants };
