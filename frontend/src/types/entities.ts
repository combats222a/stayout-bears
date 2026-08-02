// Типы соответствуют реальной схеме backend/src/db/schema.js на момент
// написания. При миграции модуля, который их использует, — сверяй с
// актуальной схемой (или с backend/src/types/entities.ts, когда появится).

export interface User {
  id: number;
  nick: string;
  game_nick: string;
  email: string;
  clan_id: number | null;
  is_superadmin: boolean;
  created_at: string;
}

export interface Clan {
  id: number;
  name: string;
  code: string;
  owner_id: number;
  deputy_id: number | null;
  created_at: string;
}

export interface Bear {
  id: number;
  clan_id: number;
  bear_index: number; // 1..11
  killed_at: string | null;
  killed_by: number | null;
  spawn_at: string | null;
}

export interface Draug {
  id: number;
  clan_id: number;
  draug_index: number; // 1..6
  killed_at: string | null;
  killed_by: number | null;
  spawn_at: string | null;
}

export interface Shining {
  clan_id: number;
  anchor_iso: string;
  location_id: string;
  game_time_str: string;
  set_at: string;
  set_by_nick: string;
}

export interface LootParticipant {
  id: number;
  clan_id: number;
  user_id: number | null;
  nick: string;
  hearts: number;
  pelts: number;
  sold_for: number | null;
  finders: string[];
  created_by: number | null;
  paid_out: string[];
  added_at: string;
}

export interface ClanBan {
  id: number;
  clan_id: number;
  user_id: number;
  banned_by: number;
  banned_at: string;
}

export interface UserTimer {
  id: number;
  user_id: number;
  name: string;
  period_seconds: number;
  last_reset_at: string;
  sort_order: number;
  sound_enabled: boolean;
  created_at: string;
}

export interface UserAnomaly {
  user_id: number;
  anchor_iso: string;
  game_time_str: string;
  set_at: string;
}
