// ═══════════════════════════════════════════════════════════════
// Гора Сияния — игровое время и расчёт респов
// ═══════════════════════════════════════════════════════════════

// ── Константы ────────────────────────────────────────────────────
// 1 игровая минута = 8750 мс реального времени
export const GAME_MINUTE_MS   = 8750;
export const GAME_HOUR_MS     = 60  * GAME_MINUTE_MS;  // 525 000 мс = 8 мин 45 сек
export const GAME_DAY_MS      = 24  * GAME_HOUR_MS;    // 12 600 000 мс = 3 ч 30 мин

// Интервал между сияниями = 6 игровых часов = 52 мин 30 сек реального времени
export const SHINING_INTERVAL_MS    = 6 * GAME_HOUR_MS;  // 3 150 000 мс

// Сияние "горит" 1 игровой час = 8 мин 45 сек реального времени
export const SHINING_DURATION_MS    = GAME_HOUR_MS;       // 525 000 мс

// Предупреждение за 5 реальных минут до начала
export const WARN_BEFORE_SHINING_MS = 5 * 60 * 1000;

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

// ── Якорь (Z + X) ────────────────────────────────────────────────
/**
 * Z = gameTimeStr — любое игровое время которое видит игрок прямо сейчас (например "01:13")
 * X = Date.now() — реальное время ПК в момент нажатия кнопки
 *
 * Сохраняем оба значения как есть.
 * anchorGameTimeStr = Z (строка "ЧЧ:ММ")
 * anchorRealMs      = X (миллисекунды)
 */
export function parseGameTimeInput(gameTimeStr) {
  const parts = gameTimeStr.trim().split(':').map(Number);
  if (parts.length < 2 || parts.some(isNaN)) return null;
  const [gh, gm] = parts;
  if (gh < 0 || gh > 23 || gm < 0 || gm > 59) return null;
  // Якорь X = прямо сейчас
  return new Date().toISOString();
}

// ── Живое игровое время ──────────────────────────────────────────
/**
 * Вычисляет текущее игровое время по формуле:
 *   currentGameMinutes = Z_minutes + (now - X) / GAME_MINUTE_MS
 *
 * Z = anchorGameTimeStr (введённое игровое время)
 * X = anchorRealMs (реальное время момента ввода)
 * slotOffsetHours = 0, 6, 12, 18 для карточек 1-4
 */
export function getLiveGameTime(anchorGameTimeStr, anchorRealMs, slotOffsetHours, nowMs = Date.now()) {
  // Z в минутах
  const parts = (anchorGameTimeStr || '00:00').trim().split(':').map(Number);
  const [gh = 0, gm = 0] = parts;
  const Z_minutes = gh * 60 + gm;

  // Прошло реального времени с момента X
  const elapsedRealMs = nowMs - anchorRealMs;

  // Переводим в игровые минуты
  const elapsedGameMinutes = elapsedRealMs / GAME_MINUTE_MS;

  // Смещение слота в игровых минутах
  const slotOffsetMinutes = slotOffsetHours * 60;

  // Итого игровых минут
  const totalGameMinutes = Z_minutes + elapsedGameMinutes + slotOffsetMinutes;

  // Оборачиваем по 24 игровым часам (1440 минут)
  const wrapped  = ((totalGameMinutes % 1440) + 1440) % 1440;
  const displayH = Math.floor(wrapped / 60);
  const displayM = Math.floor(wrapped % 60);
  return `${String(displayH).padStart(2,'0')}:${String(displayM).padStart(2,'0')}`;
}

// ── Определяем горит ли сияние по текущему игровому времени ──────
/**
 * Сияние горит когда минуты игрового времени попадают в диапазоны:
 *   00:00–01:00, 06:00–07:00, 12:00–13:00, 18:00–19:00
 *
 * liveGameTimeStr = текущее живое игровое время "ЧЧ:ММ"
 * Возвращает true если горит, false если нет
 */
export function isShiningActive(liveGameTimeStr) {
  const parts = liveGameTimeStr.split(':').map(Number);
  const [gh = 0, gm = 0] = parts;
  const totalMin = gh * 60 + gm;
  // Начало каждого сияния: 0:00, 6:00, 12:00, 18:00 (в минутах: 0, 360, 720, 1080)
  const shiningStarts = [0, 360, 720, 1080];
  return shiningStarts.some(start => totalMin >= start && totalMin < start + 60);
}

// ── Реальное время начала ближайшего сияния для карточки N ───────
/**
 * Для карточки N (0-based) вычисляем реальное время начала сияния:
 *
 * Текущее живое игровое время → определяем сколько игровых минут
 * до следующего XX:00 (начала следующего сияния для этого слота).
 * Переводим в реальное время.
 *
 * slotOffsetHours = 0, 6, 12, 18
 */
export function getSlotRealStartTime(anchorGameTimeStr, anchorRealMs, slotOffsetHours, nowMs = Date.now()) {
  // Текущее живое игровое время для этого слота (с учётом смещения)
  const parts = (anchorGameTimeStr || '00:00').trim().split(':').map(Number);
  const [gh = 0, gm = 0] = parts;
  const Z_minutes = gh * 60 + gm;
  const elapsedRealMs = nowMs - anchorRealMs;
  const elapsedGameMinutes = elapsedRealMs / GAME_MINUTE_MS;
  const slotOffsetMinutes = slotOffsetHours * 60;
  const totalGameMinutes = Z_minutes + elapsedGameMinutes + slotOffsetMinutes;
  const wrapped = ((totalGameMinutes % 1440) + 1440) % 1440;

  // Сколько игровых минут осталось до следующего XX:00 (начало следующего игрового часа в серии 0,6,12,18)
  // Текущий игровой час
  const currentGameHour = Math.floor(wrapped / 60);
  // Начало следующего сияния (ближайший час кратный 6, строго больше текущего часа)
  const nextShiningHour = Math.ceil((currentGameHour + 1) / 6) * 6;
  const nextShiningMin = nextShiningHour * 60; // может быть > 1440, обернём
  const gameMinutesUntilNext = nextShiningMin - wrapped;

  // Переводим в реальное время
  const realMsUntilNext = gameMinutesUntilNext * GAME_MINUTE_MS;
  return nowMs + realMsUntilNext;
}

// ── 4 карточки сияний ────────────────────────────────────────────
/**
 * Возвращает массив из 4 объектов для карточек СИЯНИЕ 1-4.
 * Каждый объект содержит:
 *   slotOffsetHours — смещение (0, 6, 12, 18)
 *   realStartMs     — реальное время начала ближайшего сияния этого слота
 */
export function getShiningCards(anchorGameTimeStr, anchorRealMs, nowMs = Date.now()) {
  return [0, 6, 12, 18].map((offsetHours, cardIndex) => {
    // Реальное время начала ближайшего сияния для СИЯНИЯ 1 (слот 0)
    // Для карточек 2-4 добавляем интервалы × cardIndex
    const baseRealStart = getSlotRealStartTime(anchorGameTimeStr, anchorRealMs, 0, nowMs);
    const realStartMs = baseRealStart + cardIndex * SHINING_INTERVAL_MS;
    return {
      cardNumber:      cardIndex + 1,
      slotOffsetHours: offsetHours,
      realStartMs,
    };
  });
}

/**
 * Вычисляет 4 последовательных сияния начиная с текущего (или ближайшего).
 * Возвращает массив из 4 объектов: { realStartMs, realEndMs }
 *
 * Алгоритм:
 * 1. Текущее игровое время → в минутах
 * 2. Находим последний старт сияния (кратный 360 мин, <= текущих минут)
 * 3. realStart этого сияния = nowMs - (прошло игровых минут с последнего старта) * GAME_MINUTE_MS
 * 4. Если текущее сияние уже закончилось (прошло >= 60 игровых минут) → берём следующее
 * 5. Карточки 2-4 = карточка1.realStart + 1,2,3 * SHINING_INTERVAL_MS
 */
export function computeShiningSlots(anchorGameTimeStr, anchorRealMs, nowMs) {
  const parts = (anchorGameTimeStr || '00:00').trim().split(':').map(Number);
  const [gh = 0, gm = 0] = parts;
  const Z_minutes = gh * 60 + gm;

  // Текущие игровые минуты (без wrap, чтобы не терять направление)
  const elapsedRealMs = nowMs - anchorRealMs;
  const elapsedGameMinutes = elapsedRealMs / GAME_MINUTE_MS;
  const totalGameMinutes = Z_minutes + elapsedGameMinutes;
  const wrapped = ((totalGameMinutes % 1440) + 1440) % 1440;

  // Последний старт сияния (ближайший кратный 360 мин, <= wrapped)
  const lastShiningStartMin = Math.floor(wrapped / 360) * 360;
  const minutesSinceLastStart = wrapped - lastShiningStartMin;

  let slot0RealStart;
  if (minutesSinceLastStart < 60) {
    // Сияние сейчас активно — слот 0 = текущее сияние
    slot0RealStart = nowMs - minutesSinceLastStart * GAME_MINUTE_MS;
  } else {
    // Сияние не активно — слот 0 = следующее сияние
    const nextShiningStartMin = lastShiningStartMin + 360;
    const minutesUntilNext = nextShiningStartMin - wrapped;
    slot0RealStart = nowMs + minutesUntilNext * GAME_MINUTE_MS;
  }

  return Array.from({ length: 4 }, (_, i) => {
    const realStartMs = slot0RealStart + i * SHINING_INTERVAL_MS;
    const realEndMs = realStartMs + SHINING_DURATION_MS;
    return { realStartMs, realEndMs };
  });
}

// ── Форматирование ────────────────────────────────────────────────
export function formatRealTime(ms) {
  if (!ms && ms !== 0) return '--:--:--';
  return new Date(ms).toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export function formatCountdown(ms) {
  if (ms <= 0) return '00:00';
  const totalS = Math.floor(ms / 1000);
  const h = Math.floor(totalS / 3600);
  const m = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// Алиас для обратной совместимости
export const formatShiningCountdown = formatCountdown;
export function getSlotGameTime(baseGameTimeStr, slotIndex) {
  return getLiveGameTime(baseGameTimeStr, Date.now(), slotIndex * 6, Date.now());
}
export function getUpcomingShiningSlots(anchorIso, refTimeMs = Date.now()) {
  const anchorMs = new Date(anchorIso).getTime();
  const intervalMs = SHINING_INTERVAL_MS;
  const elapsed = refTimeMs - anchorMs;
  const baseN = Math.floor(elapsed / intervalMs);
  return Array.from({ length: 4 }, (_, i) => ({
    realAt: anchorMs + (baseN + i) * intervalMs,
    index: baseN + i,
  }));
}
