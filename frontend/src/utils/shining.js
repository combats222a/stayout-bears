// ═══════════════════════════════════════════════════════════════
// Гора Сияния — игровое время и расчёт респов
// ═══════════════════════════════════════════════════════════════

// 1 игровая минута = 8.75 реальных секунд
export const GAME_MINUTE_MS      = 8750;
export const GAME_HOUR_MS        = 60 * GAME_MINUTE_MS;   // 525 000 мс = 8 мин 45 сек
export const GAME_DAY_MS         = 24 * GAME_HOUR_MS;     // 12 600 000 мс = 3 ч 30 мин

// Интервал между сияниями: 6 игровых часов реального времени
// 6 * 60 * 8750 = 3 150 000 мс = 52 мин 30 сек реального времени
export const SHINING_INTERVAL_MS = 6 * GAME_HOUR_MS;

// Предупреждение за 5 реальных минут
export const WARN_BEFORE_SHINING_MS = 5 * 60 * 1000;

// Сколько реального времени "горит" сияние (1 игровой час = 60 игровых минут)
export const SHINING_DURATION_MS = GAME_HOUR_MS; // 525 000 мс = 8 мин 45 сек

// ── Локации ──────────────────────────────────────────────────────
export const LOCATIONS = [
  { id: 'gmt0',  label: 'GMT +00:00', offset: 0,  name: 'Аэропорт, Везувий, Любеч, Окрестности Любеча, Чёрный лес' },
  { id: 'gmt+2', label: 'GMT +02:00', offset: 2,  name: 'Город N' },
  { id: 'gmt+4', label: 'GMT +04:00', offset: 4,  name: 'Тунгуска, Казачий Аул' },
  { id: 'gmt-1', label: 'GMT −01:00', offset: -1, name: 'Новая Земля о. Северный, Новая Земля о. Южный' },
];
export const DEFAULT_LOCATION_ID = 'gmt-1';
export function getLocation(id) {
  return LOCATIONS.find(l => l.id === id) || LOCATIONS[0];
}

// ── Парсинг ввода ─────────────────────────────────────────────────
/**
 * Игрок ВИДИТ сияние прямо сейчас в игре и вводит его игровое время.
 * Мы фиксируем Date.now() как якорь — это реальный момент НАЧАЛА этого сияния.
 *
 * Возвращает ISO-строку текущего реального времени.
 */
export function parseGameTimeInput(gameTimeStr, locationId) {
  const parts = gameTimeStr.trim().split(':').map(Number);
  if (parts.length < 2 || parts.some(isNaN)) return null;
  const [gh, gm] = parts;
  if (gh < 0 || gh > 23 || gm < 0 || gm > 59) return null;
  // Якорь = прямо сейчас (игрок видит сияние и вводит его время)
  return new Date().toISOString();
}

// ── Скользящее окно из 4 слотов ──────────────────────────────────
/**
 * anchorIso — реальный UTC момент когда было зафиксировано сияние.
 * refTimeMs — текущий момент.
 *
 * Слот 0 = ТЕКУЩЕЕ: последнее прошедшее сияние (если с тех пор < SHINING_DURATION_MS — "горит")
 *                   или следующее ближайшее (если прошедшее уже далеко)
 * Слоты 1,2,3 = следующие три
 *
 * Логика скользящего окна:
 *   elapsed = now - anchor
 *   baseN = floor(elapsed / interval)  → индекс последнего прошедшего
 *   slot[0].realAt = anchor + baseN * interval   (последнее прошедшее)
 *   slot[1].realAt = anchor + (baseN+1) * interval
 *   ...
 */
export function getUpcomingShiningSlots(anchorIso, refTimeMs = Date.now()) {
  const anchorMs   = new Date(anchorIso).getTime();
  const intervalMs = SHINING_INTERVAL_MS;
  const elapsed    = refTimeMs - anchorMs;
  const baseN      = Math.floor(elapsed / intervalMs);

  const slots = [];
  for (let i = 0; i < 4; i++) {
    slots.push({
      realAt: anchorMs + (baseN + i) * intervalMs,
      index:  baseN + i,
    });
  }
  return slots;
}

// ── Отображение игрового времени слота ───────────────────────────
/**
 * baseGameTimeStr — введённое игровое время (например "17:26")
 * slotIndex — 0,1,2,3 → прибавляем 0,6,12,18 игровых часов
 */
export function getSlotGameTime(baseGameTimeStr, slotIndex) {
  const parts = (baseGameTimeStr || '00:00').trim().split(':').map(Number);
  const [gh = 0, gm = 0] = parts;
  const totalMin   = gh * 60 + gm + slotIndex * 6 * 60;
  const wrapped    = ((totalMin % 1440) + 1440) % 1440;
  const displayH   = Math.floor(wrapped / 60);
  const displayM   = wrapped % 60;
  return `${String(displayH).padStart(2,'0')}:${String(displayM).padStart(2,'0')}`;
}

// ── Живое игровое время ──────────────────────────────────────────
/**
 * Вычисляет текущее живое игровое время на основе якоря.
 * anchorIso — реальное время когда было зафиксировано сияние с известным игровым временем.
 * baseGameTimeStr — игровое время в момент якоря (например "00:29").
 * slotOffset — смещение слота в игровых часах (0, 6, 12, 18).
 * nowMs — текущий реальный момент времени.
 *
 * Возвращает строку "ЧЧ:ММ" — текущее игровое время.
 */
export function getLiveGameTime(anchorIso, baseGameTimeStr, slotIndex, nowMs = Date.now()) {
  const anchorMs = new Date(anchorIso).getTime();
  // Сколько реального времени прошло с момента якоря
  const elapsedRealMs = nowMs - anchorMs;
  // Переводим в игровые минуты (только elapsed, без слотового смещения)
  const elapsedGameMinutes = elapsedRealMs / GAME_MINUTE_MS;

  // Базовое игровое время якоря
  const parts = (baseGameTimeStr || '00:00').trim().split(':').map(Number);
  const [gh = 0, gm = 0] = parts;
  const anchorGameMinutes = gh * 60 + gm;

  // Текущее живое игровое время (слот 0) + смещение слота
  // slotIndex * 6 * 60 — смещение в игровых минутах для показа нужного слота
  const slotOffsetMinutes = slotIndex * 6 * 60;
  const totalGameMinutes = anchorGameMinutes + elapsedGameMinutes + slotOffsetMinutes;

  // Оборачиваем по 24 игровым часам
  const wrapped = ((totalGameMinutes % 1440) + 1440) % 1440;
  const displayH = Math.floor(wrapped / 60);
  const displayM = Math.floor(wrapped % 60);
  return `${String(displayH).padStart(2,'0')}:${String(displayM).padStart(2,'0')}`;
}

// ── Форматирование ────────────────────────────────────────────────
export function formatRealTime(ms) {
  if (!ms && ms !== 0) return '--:--:--';
  return new Date(ms).toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export function formatShiningCountdown(ms) {
  if (ms <= 0) return '00:00';
  const totalS = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(totalS / 3600);
  const m = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
