export const BEAR_RESPAWN_MS = 33 * 60 * 1000;
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

export function formatClock(ts) {
  if (!ts) return '--:--:--';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

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
