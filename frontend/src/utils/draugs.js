export const DRAUG_RESPAWN_MS = 25 * 60 * 1000;
export const VANISH_OFFSET_MS = 5 * 60 * 1000; // "Исчез" = убит 5 мин назад
export const WARN_BEFORE_SPAWN_MS = 5 * 60 * 1000; // Звук за 5 мин до спавна

export const DRAUGS_LIST = [
  { index: 1, name: 'Северный',          square: 'H3-4' },
  { index: 2, name: 'Под северным',      square: 'H4-3' },
  { index: 3, name: 'Западный',          square: 'H5'   },
  { index: 4, name: 'Восточный дальний', square: 'J4-3' },
  { index: 5, name: 'Восточный',         square: 'J5-2' },
  { index: 6, name: 'Южный',             square: 'K7-1' },
];

export function getDraugMeta(index) {
  return DRAUGS_LIST.find(d => d.index === index) || { index, name: `Драуг ${index}`, square: '?' };
}

export function getDraugStatus(draug) {
  if (!draug.spawn_at) return 'alive';
  return new Date(draug.spawn_at).getTime() > Date.now() ? 'dead' : 'alive';
}

export function getTimeLeftMs(draug) {
  if (!draug.spawn_at) return 0;
  return Math.max(0, new Date(draug.spawn_at).getTime() - Date.now());
}

export function formatCountdown(ms) {
  if (ms <= 0) return '00:00';
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// Format a UTC ISO timestamp as HH:MM:SS in the LOCAL timezone of the browser
export function formatClock(ts) {
  if (!ts) return '--:--:--';
  const d = new Date(ts);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// Format elapsed time since killed_at (counts up in local time)
export function formatElapsed(ts) {
  if (!ts) return '--:--:--';
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}

export function getProgress(draug) {
  if (!draug.spawn_at || !draug.killed_at) return 1;
  const total = DRAUG_RESPAWN_MS;
  const elapsed = Date.now() - new Date(draug.killed_at).getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}

/**
 * Parse a HH:MM or HH:MM:SS string entered by the user (in their LOCAL timezone)
 * and return a UTC ISO string for today's date.
 * If the resulting time is more than 30 min in the future, assume it was yesterday.
 */
export function parseLocalTimeInput(timeStr) {
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.length < 2 || parts.some(isNaN)) return null;
  const [h, m, s = 0] = parts;
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;

  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(h, m, s, 0);

  // If candidate is more than 30 min in the future → assume yesterday
  if (candidate.getTime() - now.getTime() > 30 * 60 * 1000) {
    candidate.setDate(candidate.getDate() - 1);
  }

  return candidate.toISOString();
}

/**
 * Given killed_at ISO string, compute spawn_at ISO string (killed + 25 min)
 */
export function spawnAtFromKilledAt(killedAtIso) {
  return new Date(new Date(killedAtIso).getTime() + DRAUG_RESPAWN_MS).toISOString();
}

/**
 * Given spawn_at ISO string, compute killed_at ISO string (spawn - 25 min)
 */
export function killedAtFromSpawnAt(spawnAtIso) {
  return new Date(new Date(spawnAtIso).getTime() - DRAUG_RESPAWN_MS).toISOString();
}

/**
 * Given killed_at ISO string, compute elapsed string HH:MM:SS (for display only)
 */
export function elapsedFromKilledAt(killedAtIso) {
  return formatElapsed(killedAtIso);
}
