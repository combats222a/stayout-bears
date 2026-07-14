// ═══════════════════════════════════════════════════════════════
// Аномальные прорывы / Уледная жара — работает ТОЧНО как Гора Сияния:
// игрок вводит Якорь Z (игровое время, которое видит прямо сейчас) —
// и дальше всё считается по той же формуле игровой скорости времени
// (1 игр. минута = 8750 мс реального времени), что и в Сиянии.
//
// Единственные отличия от Сияния:
//   — локация зафиксирована на GMT +00:00 (это уже существующая
//     локация 'gmt0' из shining.js — выбор недоступен, всегда она)
//   — окна другие: не 4 равных цикла по 6 игр. часов, а 2 цикла в
//     игровые сутки, каждый со своими границами предупреждения и
//     самого прорыва (см. ANOMALY_CYCLES ниже)
// ═══════════════════════════════════════════════════════════════

import { GAME_MINUTE_MS, getLocation } from './shining';

// Локация зафиксирована — как договорились, всегда GMT +00:00
export const ANOMALY_LOCATION_ID = 'gmt0';
export function getAnomalyLocation() {
  return getLocation(ANOMALY_LOCATION_ID);
}

// Два цикла в игровые сутки (границы — в игровых минутах от 00:00):
//   warnStart → burnStart : оранжевая рамка (предупреждение)
//   burnStart → burnEnd   : зелёная рамка (прорыв идёт)
// 07:30–07:50 (warn) → 07:50–10:00 (burn)
// 19:30–19:50 (warn) → 19:50–22:00 (burn)
const h = (hh, mm) => hh * 60 + mm;
export const ANOMALY_CYCLES = [
  { warnStart: h(7, 30),  burnStart: h(7, 50),  burnEnd: h(10, 0) },
  { warnStart: h(19, 30), burnStart: h(19, 50), burnEnd: h(22, 0) },
];

const DAY_MIN = 24 * 60; // 1440 игровых минут в игровых сутках

/**
 * Возвращает 4 ближайших (текущий/следующие) цикла прорыва:
 * [{ warnStartMs, realStartMs, realEndMs }, ...] — если сейчас идёт
 * предупреждение или сам прорыв, цикл будет первым в списке.
 *
 * anchorGameTimeStr — Якорь Z, игровое время "ЧЧ:ММ"
 * anchorRealMs      — Якорь X, реальное время (мс) в момент ввода
 */
export function computeAnomalySlots(anchorGameTimeStr, anchorRealMs, nowMs = Date.now()) {
  const parts = (anchorGameTimeStr || '00:00').trim().split(':').map(Number);
  const [gh = 0, gm = 0] = parts;
  const Z_minutes = gh * 60 + gm;

  const elapsedRealMs = nowMs - anchorRealMs;
  const elapsedGameMinutes = elapsedRealMs / GAME_MINUTE_MS;
  // Не оборачиваем — нужна абсолютная позиция, чтобы не терять направление
  // между игровыми сутками (как в computeShiningSlots).
  const totalGameMinutes = Z_minutes + elapsedGameMinutes;

  const dayIndex0 = Math.floor(totalGameMinutes / DAY_MIN);

  // Строим окна на несколько игровых суток вокруг текущего момента —
  // с запасом, чтобы гарантированно найти следующие 4.
  const windows = [];
  for (let dayOffset = -1; dayOffset <= 2; dayOffset++) {
    const dayBase = (dayIndex0 + dayOffset) * DAY_MIN;
    for (const c of ANOMALY_CYCLES) {
      windows.push({
        warnStartAbs: dayBase + c.warnStart,
        burnStartAbs: dayBase + c.burnStart,
        burnEndAbs:   dayBase + c.burnEnd,
      });
    }
  }
  windows.sort((a, b) => a.burnStartAbs - b.burnStartAbs);

  // Берём окна, которые ещё не закончились (burnEnd в будущем или сейчас идут)
  const upcoming = windows.filter(w => w.burnEndAbs > totalGameMinutes).slice(0, 4);

  return upcoming.map(w => ({
    warnStartMs: nowMs + (w.warnStartAbs - totalGameMinutes) * GAME_MINUTE_MS,
    realStartMs: nowMs + (w.burnStartAbs - totalGameMinutes) * GAME_MINUTE_MS,
    realEndMs:   nowMs + (w.burnEndAbs   - totalGameMinutes) * GAME_MINUTE_MS,
  }));
}

// Ближайший (текущий или следующий) цикл — используется для статус-пилюли
// и глобального звукового вотчера. Возвращает null если якорь не задан.
export function getNearestAnomalySlot(anchorGameTimeStr, anchorRealMs, nowMs = Date.now()) {
  if (!anchorGameTimeStr || !anchorRealMs) return null;
  const slots = computeAnomalySlots(anchorGameTimeStr, anchorRealMs, nowMs);
  return slots[0] || null;
}

// ─── Якорь Z/X — хранится локально в браузере (страница не привязана
// к клану), но, в отличие от предыдущей версии, ТЕПЕРЬ РЕАЛЬНО ЗАПУСКАЕТ
// расчёт циклов — совсем как якорь Сияния на бэкенде клана. ───────────
const ANOMALY_ANCHOR_KEY = 'anomaly_anchor_v2';

export function loadAnomalyAnchor() {
  try {
    const raw = window.localStorage.getItem(ANOMALY_ANCHOR_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAnomalyAnchor(anchor) {
  try {
    window.localStorage.setItem(ANOMALY_ANCHOR_KEY, JSON.stringify(anchor));
  } catch {
    // localStorage может быть недоступен (приватный режим и т.п.) — игнорируем
  }
}
