// Разбор и расчёт выражений вида "02:01 +35", "14:20-1:30", "+45", "-90".
// Формат специально сделан гибким — игрок может писать почти как угодно:
// с пробелами и без, дельту минутами или через двоеточие, базовое время
// можно не указывать вообще (тогда берётся текущее реальное время).

export function pad2(n) {
  return String(n).padStart(2, '0');
}

// Приводим разные виды тире/дефиса к обычному "-" и схлопываем пробелы —
// люди часто копируют текст с "красивым" минусом или лишними пробелами.
function normalize(str) {
  return String(str || '')
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

const TIME_RE = '(\\d{1,2}):([0-5]?\\d)';

/**
 * Разбирает выражение и считает результат.
 * @param {string} raw   — то, что ввёл игрок
 * @param {Date}   now    — текущий момент (для "+35" без базы и кнопки «Сейчас»)
 * @returns {null | { error: true } | ResultObject}
 *   null — строка пустая (нечего считать, но это не ошибка).
 */
export function parseTimeExpr(raw, now = new Date()) {
  const str = normalize(raw);
  if (!str) return null;

  let m;

  // "02:01 +35" / "02:01+1:20" — база + знак + дельта (минуты или чч:мм)
  m = str.match(new RegExp(`^${TIME_RE}\\s*([+-])\\s*(?:${TIME_RE}|(\\d{1,4}))$`));
  if (m) {
    const baseH = +m[1], baseM = +m[2], sign = m[3];
    const deltaMin = m[4] !== undefined ? (+m[4]) * 60 + (+m[5]) : +m[6];
    return build({ baseH, baseM, sign, deltaMin, usedNow: false });
  }

  // "+35" / "-1:20" — без базы, дельта от текущего момента
  m = str.match(new RegExp(`^([+-])\\s*(?:${TIME_RE}|(\\d{1,4}))$`));
  if (m) {
    const sign = m[1];
    const deltaMin = m[2] !== undefined ? (+m[2]) * 60 + (+m[3]) : +m[4];
    return build({ baseH: now.getHours(), baseM: now.getMinutes(), sign, deltaMin, usedNow: true });
  }

  // просто время без операции — "14:20" (полезно как быстрый способ
  // проверить/поправить опечатку перед тем, как дописать дельту)
  m = str.match(new RegExp(`^${TIME_RE}$`));
  if (m) {
    return build({ baseH: +m[1], baseM: +m[2], sign: '+', deltaMin: 0, usedNow: false });
  }

  return { error: true };
}

function build({ baseH, baseM, sign, deltaMin, usedNow }) {
  if (baseH > 23 || baseM > 59 || deltaMin == null || Number.isNaN(deltaMin)) {
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
