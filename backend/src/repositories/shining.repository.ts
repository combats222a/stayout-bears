import { pool } from '../db/pool';
import type { Shining } from '../types/entities';

type ShiningRow = Omit<Shining, 'clan_id'>;

export async function findByClan(clanId: number): Promise<ShiningRow | null> {
  const { rows } = await pool.query<ShiningRow>(
    `SELECT anchor_iso, location_id, game_time_str, set_at, set_by_nick
     FROM shining WHERE clan_id = $1 LIMIT 1`,
    [clanId]
  );
  return rows[0] || null;
}

export async function upsert(
  clanId: number,
  anchorIso: string,
  locationId: string,
  gameTimeStr: string,
  setAt: string,
  nick: string
): Promise<void> {
  await pool.query(
    `INSERT INTO shining (clan_id, anchor_iso, location_id, game_time_str, set_at, set_by_nick)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (clan_id) DO UPDATE
       SET anchor_iso=$2, location_id=$3, game_time_str=$4, set_at=$5, set_by_nick=$6`,
    [clanId, anchorIso, locationId, gameTimeStr, setAt, nick]
  );
}
