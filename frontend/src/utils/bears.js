export const BEAR_RESPAWN_MS = 35 * 60 * 1000;
export const VANISH_OFFSET_MS = 5 * 60 * 1000; // "Исчез" = убит 5 мин назад

export const BEARS_LIST = [
  { index: 1,  name: 'Ржавый',          square: 'B1-4' },
  { index: 2,  name: 'Кривой',          square: 'B3-2' },
  { index: 3,  name: 'Подводная лодка', square: 'B3-4' },
  { index: 4,  name: 'Первый',          square: 'A3-1' },
  { index: 5,  name: 'Второй',          square: 'A3-1' },
  { index: 6,  name: 'Третий',          square: 'A3-3' },
  { index: 7,  name: 'Правый',          square: 'B4-2' },
  { index: 8,  name: 'Левый',           square: 'A4-4' },
  { index: 9,  name: 'Возле моста',     square: 'B5-4' },
  { index: 10, name: 'Южка мост',       square: 'C3-1' },
  { index: 11, name: 'Южка Сникерс',    square: 'D3-3' },
];

export function getBearMeta(index) {
  return BEARS_LIST.find(b => b.index === index) || { index, name: `Медведь ${index}`, square: '?' };
}

export function getBearStatus(bear) {
  if (!bear.spawn_at) return 'alive';
  return new Date(bear.spawn_at).getTime() > Date.now() ? 'dead' : 'alive';
}

export function getTimeLeftMs(bear) {
  if (!bear.spawn_at) return 0;
  return Math.max(0, new Date(bear.spawn_at).getTime() - Date.now());
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

export function getProgress(bear) {
  if (!bear.spawn_at || !bear.killed_at) return 1;
  const total = BEAR_RESPAWN_MS;
  const elapsed = Date.now() - new Date(bear.killed_at).getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}

/**
 * Parse a HH:MM or HH:MM:SS string entered by the user (in their LOCAL timezone)
 * and return a UTC ISO string for today's date.
 * If the resulting time is more than 12h in the future, assume it was yesterday.
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
 * Given killed_at ISO string, compute spawn_at ISO string (killed + 35 min)
 */
export function spawnAtFromKilledAt(killedAtIso) {
  return new Date(new Date(killedAtIso).getTime() + BEAR_RESPAWN_MS).toISOString();
}

/**
 * Given spawn_at ISO string, compute killed_at ISO string (spawn - 35 min)
 */
export function killedAtFromSpawnAt(spawnAtIso) {
  return new Date(new Date(spawnAtIso).getTime() - BEAR_RESPAWN_MS).toISOString();
}

/**
 * Given killed_at ISO string, compute elapsed string HH:MM:SS (for display only)
 */
export function elapsedFromKilledAt(killedAtIso) {
  return formatElapsed(killedAtIso);
}
