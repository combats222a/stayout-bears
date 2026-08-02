// Расчёт "время + смещение" для калькулятора времени. Раньше здесь был
// парсер свободного текста ("02:01 +35" одной строкой) — его заменили на
// структурированный ввод (маска ЧЧ:ММ + отдельное поле дельты), поэтому
// расчёт теперь принимает уже готовые числа, без разбора строк.

export function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * @param {number|null} baseH — час базового времени, null если используем "сейчас"
 * @param {number|null} baseM — минута базового времени
 * @param {'+'|'-'} sign
 * @param {number} deltaMin — смещение в минутах (неотрицательное)
 * @param {boolean} usedNow — база не указана явно, взято текущее время
 */
export function computeTimeResult({ baseH, baseM, sign, deltaMin, usedNow }) {
  if (baseH == null || baseM == null || baseH > 23 || baseM > 59 || Number.isNaN(deltaMin)) {
    return { error: true };
  }
  const baseTotal = baseH * 60 + baseM;
  const signedDelta = sign === '-' ? -deltaMin : deltaMin;
  const rawTotal = baseTotal + signedDelta;
  const dayShift = Math.floor(rawTotal / 1440);
  const norm = ((rawTotal % 1440) + 1440) % 1440;
  const resultH = Math.floor(norm / 60);
  const resultM = norm % 60;

  return {
    error: false,
    usedNow,
    sign,
    deltaMin,
    dayShift,
    baseLabel: `${pad2(baseH)}:${pad2(baseM)}`,
    resultLabel: `${pad2(resultH)}:${pad2(resultM)}`,
  };
}

function pluralDays(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дня';
  return 'дней';
}

// "+1 день" / "−2 дня" / null (если сутки не перевалили)
export function formatDayShift(shift) {
  if (!shift) return null;
  const abs = Math.abs(shift);
  return `${shift > 0 ? '+' : '−'}${abs} ${pluralDays(abs)}`;
}

// "1 ч 20 мин" / "35 мин"
export function formatDeltaPhrase(deltaMin) {
  const h = Math.floor(deltaMin / 60);
  const m = deltaMin % 60;
  const parts = [];
  if (h) parts.push(`${h} ч`);
  if (m || !h) parts.push(`${m} мин`);
  return parts.join(' ');
}
