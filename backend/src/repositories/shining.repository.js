const { pool } = require('../db/pool');

async function findByClan(clanId) {
  const { rows } = await pool.query(
    `SELECT anchor_iso, location_id, game_time_str, set_at, set_by_nick
     FROM shining WHERE clan_id = $1 LIMIT 1`,
    [clanId]
  );
  return rows[0] || null;
}

async function upsert(clanId, anchorIso, locationId, gameTimeStr, setAt, nick) {
  await pool.query(
    `INSERT INTO shining (clan_id, anchor_iso, location_id, game_time_str, set_at, set_by_nick)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (clan_id) DO UPDATE
       SET anchor_iso=$2, location_id=$3, game_time_str=$4, set_at=$5, set_by_nick=$6`,
    [clanId, anchorIso, locationId, gameTimeStr, setAt, nick]
  );
}

module.exports = { findByClan, upsert };
