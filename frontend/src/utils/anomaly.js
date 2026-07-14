// ═══════════════════════════════════════════════════════════════
// Аномальные прорывы / Ледяная жара — расписание по реальному
// времени GMT+00:00. В отличие от «Горы Сияния» здесь НЕТ якоря
// (игровое время не нужно) — окна контеста фиксированы по реальным
// часам сервера (GMT+0) и одинаковы для всех, поэтому страница не
// требует входа/клана и никак не связана с Сиянием.
// ═══════════════════════════════════════════════════════════════

// Два цикла в сутки по GMT+00:00. Каждый цикл задаёт три момента:
//   warnStart → burnStart : оранжевая рамка (предупреждение)
//   burnStart → burnEnd   : зелёная рамка (контест идёт)
// Вне этих промежутков рамка нейтральная (жёлтая для ближайшего окна,
// серая для остальных).
export const ANOMALY_CYCLES_UTC = [
  { warnStart: [7, 30],  burnStart: [7, 50],  burnEnd: [10, 0] },
  { warnStart: [19, 30], burnStart: [19, 50], burnEnd: [22, 0] },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function hmMs(h, m) { return (h * 60 + m) * 60 * 1000; }

// Реальное время (мс) полуночи UTC-суток, содержащих nowMs.
function utcMidnightMs(nowMs) {
  const d = new Date(nowMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
}

// Все окна (warn/burn начало-конец в мс), отсортированные по времени,
// покрывающие достаточный диапазон вокруг nowMs, чтобы найти следующие 4.
function buildWindowsAround(nowMs) {
  const midnight = utcMidnightMs(nowMs);
  const out = [];
  // -1, 0, +1, +2 суток — с запасом
  for (let dayOffset = -1; dayOffset <= 2; dayOffset++) {
    for (const c of ANOMALY_CYCLES_UTC) {
      const dayStart = midnight + dayOffset * DAY_MS;
      out.push({
        warnStartMs: dayStart + hmMs(...c.warnStart),
        realStartMs: dayStart + hmMs(...c.burnStart), // начало зелёной фазы
        realEndMs:   dayStart + hmMs(...c.burnEnd),
      });
    }
  }
  out.sort((a, b) => a.realStartMs - b.realStartMs);
  return out;
}

/**
 * Возвращает 4 ближайших (текущее/следующие) окна прорыва:
 * [{ warnStartMs, realStartMs, realEndMs }, ...] — если сейчас идёт
 * предупреждение или сама зелёная фаза, окно будет первым в списке,
 * дальше следующие 3.
 */
export function computeAnomalySlots(nowMs = Date.now()) {
  const windows = buildWindowsAround(nowMs);
  const idx = windows.findIndex(w => nowMs < w.realEndMs);
  const from = idx === -1 ? 0 : idx;
  return windows.slice(from, from + 4);
}

// Ближайшее (текущее или следующее) окно — используется для статус-пилюли
// и глобального звукового вотчера.
export function getNearestAnomalySlot(nowMs = Date.now()) {
  return computeAnomalySlots(nowMs)[0];
}
