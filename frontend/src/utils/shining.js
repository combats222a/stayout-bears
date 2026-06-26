// ═══════════════════════════════════════════════════════════════
// Гора Сияния — игровое время и расчёт респов
// ═══════════════════════════════════════════════════════════════

// Игровое время: 1 игровая минута = 8.75 реальных секунд
export const GAME_MINUTE_MS  = 8750;          // 8 750 мс
export const GAME_HOUR_MS    = 60 * GAME_MINUTE_MS;  // 525 000 мс = 8 мин 45 сек
export const GAME_DAY_MS     = 24 * GAME_HOUR_MS;    // 12 600 000 мс = 3 ч 30 мин

// Сияние происходит в HH:29 каждые 6 игровых часов
// т.е. в 00:29, 06:29, 12:29, 18:29 игрового времени
export const SHINING_INTERVAL_GAME_H = 6;
export const SHINING_MINUTE_MARK     = 29; // минута 29 каждого 6-часового цикла

// Предупреждение за 5 реальных минут
export const WARN_BEFORE_SHINING_MS = 5 * 60 * 1000;

// ── Часовые пояса локаций ────────────────────────────────────────
export const LOCATIONS = [
  { id: 'gmt0',    label: 'GMT +00:00',  offset: 0,   name: 'Аэропорт, Везувий, Любеч, Окрестности Любеча, Чёрный лес' },
  { id: 'gmt+2',   label: 'GMT +02:00',  offset: 2,   name: 'Город N' },
  { id: 'gmt+4',   label: 'GMT +04:00',  offset: 4,   name: 'Тунгуска, Казачий Аул' },
  { id: 'gmt-1',   label: 'GMT −01:00',  offset: -1,  name: 'Новая Земля о. Северный, Новая Земля о. Южный' },
];

export const DEFAULT_LOCATION_ID = 'gmt-1'; // «мы как раз на ней играем»

export function getLocation(id) {
  return LOCATIONS.find(l => l.id === id) || LOCATIONS[0];
}

// ── Игровое время → реальное UTC ───────────────────────────────────
/**
 * Разбирает введённое игровое время "HH:MM" с учётом часового пояса локации.
 * Возвращает UTC ISO-строку.
 *
 * Логика:
 *   Игровой UTC = введённое_время − смещение_локации
 *   Реальное UTC = подбирается так, чтобы разность в ms была кратна GAME_DAY_MS
 *   Берётся ближайший реальный момент в прошлом (или сейчас).
 */
export function parseGameTimeInput(gameTimeStr, locationId) {
  const loc = getLocation(locationId);
  const parts = gameTimeStr.trim().split(':').map(Number);
  if (parts.length < 2 || parts.some(isNaN)) return null;
  const [gh, gm] = parts;
  if (gh < 0 || gh > 23 || gm < 0 || gm > 59) return null;

  // Игровое время в "игровых минутах от начала суток" (в GMT+0)
  const gameMinutesInDay = (gh - loc.offset) * 60 + gm;
  // normalise to [0, 1440)
  const normGameMin = ((gameMinutesInDay % 1440) + 1440) % 1440;

  // Реальное время, соответствующее "началу игровых суток" — неизвестно,
  // но мы знаем сколько миллисекунд прошло с начала суток по игровому времени.
  const msFromDayStart = normGameMin * GAME_MINUTE_MS;

  // Текущий момент
  const now = Date.now();
  // Длина игровых суток в реальном ms
  const dayMs = GAME_DAY_MS;

  // Ищем ближайший прошедший реальный момент, совпадающий с введённым игровым временем.
  // Для этого: находим, сколько раз укладывается dayMs от эпохи до now,
  // и берём остаток.
  const msInCurrentCycle = now % dayMs;
  let diff = msFromDayStart - msInCurrentCycle;
  // Если diff > 0, это в будущем текущего цикла — берём прошлый цикл
  if (diff > 0) diff -= dayMs;

  const realUTC = now + diff;

  // Если полученный момент слишком далеко в прошлом (> 1 игровые сутки) — что-то не так
  if (now - realUTC > dayMs + 60000) return null;

  return new Date(realUTC).toISOString();
}

// ── Расчёт следующих сияний ────────────────────────────────────────
/**
 * По известному реальному UTC времени одного сияния (shiningAtIso)
 * возвращает массив из 4 ближайших сияний >= refTime (по умолчанию Date.now()).
 *
 * Каждое сияние: { realAt: ms (UTC), index: number }
 */
export function getUpcomingShiningSlots(shiningAtIso, refTimeMs = Date.now()) {
  const anchorMs = new Date(shiningAtIso).getTime();
  const intervalMs = SHINING_INTERVAL_GAME_H * GAME_HOUR_MS;

  // Найдём ближайшее к refTimeMs (или текущее активное)
  // Количество интервалов от anchor до ref
  const rawN = (refTimeMs - anchorMs) / intervalMs;
  // Берём floor чтобы получить последнее прошедшее или текущее
  const baseN = Math.floor(rawN);

  const slots = [];
  for (let i = 0; i < 4; i++) {
    const n = baseN + i;
    const realAt = anchorMs + n * intervalMs;
    slots.push({ realAt, index: n });
  }
  return slots;
}

/**
 * Форматирует реальное UTC время как HH:MM:SS в локальном часовом поясе
 */
export function formatRealTime(ms) {
  if (!ms) return '--:--:--';
  return new Date(ms).toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

/**
 * Форматирует обратный отсчёт мс → MM:SS или HH:MM:SS
 */
export function formatShiningCountdown(ms) {
  if (ms <= 0) return '00:00';
  const totalS = Math.floor(ms / 1000);
  const h = Math.floor(totalS / 3600);
  const m = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

/**
 * Конвертирует реальный UTC ms обратно в игровое время строку "HH:MM"
 * с учётом смещения локации.
 */
export function toGameTimeStr(realMs, locationId) {
  const loc = getLocation(locationId);
  // Сколько ms прошло с начала игровых суток
  const msInDay = ((realMs % GAME_DAY_MS) + GAME_DAY_MS) % GAME_DAY_MS;
  const gameMinutesFromDayStart = msInDay / GAME_MINUTE_MS;
  // Применяем смещение локации
  const gameMinutes = ((gameMinutesFromDayStart + loc.offset * 60) % 1440 + 1440) % 1440;
  const gh = Math.floor(gameMinutes / 60);
  const gm = Math.floor(gameMinutes % 60);
  return `${String(gh).padStart(2,'0')}:${String(gm).padStart(2,'0')}`;
}
