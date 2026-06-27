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

// Сколько реального времени "горит" сияние (5 игровых минут = 43.75 сек)
export const SHINING_DURATION_MS = 5 * GAME_MINUTE_MS;

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
 * Игрок вводит текущее игровое время (например "17:26").
 * Фиксируем:
 *   - anchorGameMinutes = введённое игровое время в минутах
 *   - anchorRealMs      = Date.now() — реальный момент ввода
 *
 * Возвращает ISO-строку текущего реального времени (якорь).
 */
export function parseGameTimeInput(gameTimeStr, locationId) {
  const parts = gameTimeStr.trim().split(':').map(Number);
  if (parts.length < 2 || parts.some(isNaN)) return null;
  const [gh, gm] = parts;
  if (gh < 0 || gh > 23 || gm < 0 || gm > 59) return null;
  return new Date().toISOString();
}

// ── Вычисление текущего игрового времени ─────────────────────────
/**
 * Возвращает текущее игровое время в минутах (0–1439).
 *
 * anchorGameTimeStr — введённое игровое время ("17:26")
 * anchorIso         — реальный момент ввода (ISO)
 * refTimeMs         — текущий реальный момент (Date.now())
 */
export function getCurrentGameMinutes(anchorGameTimeStr, anchorIso, refTimeMs = Date.now()) {
  const parts = (anchorGameTimeStr || '00:00').trim().split(':').map(Number);
  const [gh = 0, gm = 0] = parts;
  const anchorGameMin = gh * 60 + gm;

  const anchorMs   = new Date(anchorIso).getTime();
  const elapsedMs  = refTimeMs - anchorMs;

  // Сколько игровых минут прошло с момента ввода
  const elapsedGameMin = elapsedMs / GAME_MINUTE_MS;

  const totalGameMin = anchorGameMin + elapsedGameMin;
  // Приводим к диапазону [0, 1440)
  return ((totalGameMin % 1440) + 1440) % 1440;
}

/**
 * Форматирует игровое время из минут в "ЧЧ:ММ"
 */
export function formatGameTime(gameMinutes) {
  const h = Math.floor(gameMinutes / 60) % 24;
  const m = Math.floor(gameMinutes % 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ── Игровые метки сияний (в минутах): 00:29, 06:29, 12:29, 18:29 ─
const SHINING_GAME_MARKS_MIN = [29, 6*60+29, 12*60+29, 18*60+29]; // [29, 389, 749, 1109]

/**
 * По текущим игровым минутам вычисляем 4 карточки сияний.
 *
 * Каждая карточка содержит:
 *   gameMinutes  — игровое время этого сияния (в минутах)
 *   realAt       — реальное время этого сияния (ms)
 *   status       — 'upcoming' | 'active' | 'past'
 *
 * Логика:
 * 1. Находим ближайшее прошедшее или активное сияние → карточка 0
 * 2. Карточки 1,2,3 — следующие три по +6 игровых часов каждая
 *
 * anchorGameTimeStr — введённое игровое время
 * anchorIso         — реальный момент ввода
 * refTimeMs         — текущий реальный момент
 */
export function getShiningCards(anchorGameTimeStr, anchorIso, refTimeMs = Date.now()) {
  const anchorMs = new Date(anchorIso).getTime();

  const parts = (anchorGameTimeStr || '00:00').trim().split(':').map(Number);
  const [gh = 0, gm = 0] = parts;
  const anchorGameMin = gh * 60 + gm;

  // Текущие игровые минуты (дробные, для точного вычисления realAt)
  const elapsedMs = refTimeMs - anchorMs;
  const currentGameMin = anchorGameMin + elapsedMs / GAME_MINUTE_MS;

  // Вспомогательная функция: реальное время для конкретного игрового времени (в минутах, может быть > 1440)
  function realAtForGameMin(targetGameMinAbs) {
    const deltaGameMin = targetGameMinAbs - anchorGameMin;
    return anchorMs + deltaGameMin * GAME_MINUTE_MS;
  }

  // Найдём ближайшую «прошедшую» метку сияния
  // Сияния повторяются каждые 360 игровых минут (6 часов)
  // Метки: 29, 389, 749, 1109 — и так циклично
  // Расширяем до «абсолютных» игровых минут от начала отсчёта

  // currentGameMin может быть > 1440 (без модуля) — так точнее
  // Найдём базовый «день» и метки в нём
  const dayNum     = Math.floor(currentGameMin / 1440);
  const inDayMin   = currentGameMin - dayNum * 1440; // позиция внутри дня

  // Ищем в [-1 день, +1 день] чтобы не промахнуться
  let candidates = [];
  for (let d = dayNum - 1; d <= dayNum + 1; d++) {
    for (const mark of SHINING_GAME_MARKS_MIN) {
      const absMin = d * 1440 + mark;
      candidates.push(absMin);
    }
  }
  candidates.sort((a, b) => a - b);

  // Находим последнее прошедшее (или текущее) сияние
  // «прошедшее» = absMin <= currentGameMin
  let baseIdx = -1;
  for (let i = candidates.length - 1; i >= 0; i--) {
    if (candidates[i] <= currentGameMin) {
      baseIdx = i;
      break;
    }
  }

  // Если не нашли (currentGameMin < первой метки), берём предыдущую из предыдущего дня
  if (baseIdx === -1) baseIdx = 0;

  // Строим 4 карточки: base, base+1, base+2, base+3
  const cards = [];
  for (let i = 0; i < 4; i++) {
    const idx = baseIdx + i;
    let absGameMin = candidates[idx];
    if (absGameMin === undefined) {
      // выходим за пределы candidates — добавляем следующую метку
      const last = candidates[candidates.length - 1];
      absGameMin = last + (idx - (candidates.length - 1)) * 360;
    }

    const rAt        = realAtForGameMin(absGameMin);
    const msFromNow  = rAt - refTimeMs;

    let status;
    if (msFromNow > 0) {
      status = 'upcoming';
    } else if (Math.abs(msFromNow) < SHINING_DURATION_MS) {
      status = 'active';
    } else {
      status = 'past';
    }

    // Игровое время этого сияния (0–1439)
    const gameMin = ((absGameMin % 1440) + 1440) % 1440;

    cards.push({ gameMinutes: gameMin, realAt: rAt, status, msFromNow });
  }

  return cards;
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

// ── Совместимость (старые импорты) ───────────────────────────────
export function getUpcomingShiningSlots(anchorIso, refTimeMs = Date.now()) {
  // fallback — не используется в новой логике
  return [];
}
export function getSlotGameTime(baseGameTimeStr, slotIndex) {
  const parts = (baseGameTimeStr || '00:00').trim().split(':').map(Number);
  const [gh = 0, gm = 0] = parts;
  const totalMin = gh * 60 + gm + slotIndex * 6 * 60;
  const wrapped  = ((totalMin % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped/60)).padStart(2,'0')}:${String(wrapped%60).padStart(2,'0')}`;
}
