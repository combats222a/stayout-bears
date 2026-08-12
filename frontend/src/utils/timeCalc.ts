// Расчёт "время + смещение" для калькулятора времени. Раньше здесь был
// парсер свободного текста ("02:01 +35" одной строкой) — его заменили на
// структурированный ввод (маска ЧЧ:ММ + отдельное поле дельты), поэтому
// расчёт теперь принимает уже готовые числа, без разбора строк.

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export interface TimeCalcInput {
  baseH: number | null; // час базового времени, null если используем "сейчас"
  baseM: number | null; // минута базового времени
  sign: '+' | '-';
  deltaMin: number; // смещение в минутах (неотрицательное)
  usedNow: boolean; // база не указана явно, взято текущее время
}

export type TimeCalcResult =
  | { error: true }
  | {
      error: false;
      usedNow: boolean;
      sign: '+' | '-';
      deltaMin: number;
      dayShift: number;
      baseLabel: string;
      resultLabel: string;
    };

export function computeTimeResult({ baseH, baseM, sign, deltaMin, usedNow }: TimeCalcInput): TimeCalcResult {
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

function pluralDaysRu(n: number): string {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дня';
  return 'дней';
}

function pluralDaysEn(n: number): string {
  return n === 1 ? 'day' : 'days';
}

// "+1 день" / "−2 дня" (RU) / "+1 day" / "−2 days" (EN) / null (если сутки не перевалили)
export function formatDayShift(shift: number, locale: 'ru' | 'en' = 'ru'): string | null {
  if (!shift) return null;
  const abs = Math.abs(shift);
  const word = locale === 'en' ? pluralDaysEn(abs) : pluralDaysRu(abs);
  return `${shift > 0 ? '+' : '−'}${abs} ${word}`;
}

// "1 ч 20 мин" / "35 мин" (RU) — "1h 20m" / "35m" (EN)
export function formatDeltaPhrase(deltaMin: number, locale: 'ru' | 'en' = 'ru'): string {
  const h = Math.floor(deltaMin / 60);
  const m = deltaMin % 60;
  const parts: string[] = [];
  if (locale === 'en') {
    if (h) parts.push(`${h}h`);
    if (m || !h) parts.push(`${m}m`);
  } else {
    if (h) parts.push(`${h} ч`);
    if (m || !h) parts.push(`${m} мин`);
  }
  return parts.join(' ');
}
