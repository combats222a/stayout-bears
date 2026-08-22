import { pool } from '../db/pool';
import type { UserAnomaly } from '../types/entities';

type AnomalyRow = Omit<UserAnomaly, 'user_id'>;

export async function findByUser(userId: number): Promise<AnomalyRow | null> {
  const { rows } = await pool.query<AnomalyRow>(
    `SELECT anchor_iso, game_time_str, set_at
     FROM user_anomaly WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function upsert(userId: number, anchorIso: string, gameTimeStr: string, setAt: string): Promise<void> {
  await pool.query(
    `INSERT INTO user_anomaly (user_id, anchor_iso, game_time_str, set_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id) DO UPDATE
       SET anchor_iso=$2, game_time_str=$3, set_at=$4`,
    [userId, anchorIso, gameTimeStr, setAt]
  );
}
