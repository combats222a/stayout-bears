import { SERVER_UTC_OFFSET, DURATION_BY_TYPE, DEFAULT_DURATION_MIN } from '../content/captureLocations';

// Длительность окна захвата для конкретной точки (зависит от её типа).
function durationMinFor(location) {
  return DURATION_BY_TYPE[location.type] ?? DEFAULT_DURATION_MIN;
}

// Расписание точек хранится как "ежедневное игровое время сервера"
// (час:минута в Europe/Kiev, UTC+3). Отображать его нужно всегда в
// часовом поясе конкретного игрока — эти функции переводят время точки
// в ближайший будущий момент (абсолютный UTC-timestamp) и дальше браузер
// сам покажет его в локальном поясе через toLocaleString/toLocaleTimeString.

// Строит Date для конкретного календарного дня (в UTC) с заданным
// игровым часом/минутой сервера, переведённым в UTC.
function serverTimeOnDate(baseUtcDate, hour, minute) {
  const utcHour = hour - SERVER_UTC_OFFSET;
  return new Date(Date.UTC(
    baseUtcDate.getUTCFullYear(),
    baseUtcDate.getUTCMonth(),
    baseUtcDate.getUTCDate(),
    utcHour,
    minute,
    0,
  ));
}

// Проверяет, подходит ли календарный день (в UTC) под день недели точки.
// Если у точки не задан weekday — точка захватывается ежедневно.
function matchesWeekday(location, dayUtcDate) {
  if (location.weekday === undefined || location.weekday === null) return true;
  return dayUtcDate.getUTCDay() === location.weekday;
}

// Ближайшее наступление точки: перебираем дни начиная с сегодняшнего,
// пропуская те, что не подходят под день недели точки (для точек,
// которые захватываются не каждый день, а по расписанию, например
// только по субботам или только по воскресеньям), и берём первый день,
// в котором окно захвата (начало+длительность) ещё не закончилось.
export function getNextOccurrence(location, now = new Date()) {
  const durationMin = durationMinFor(location);
  let dayCursor = now;
  // 8 итераций с запасом гарантированно покрывают полную неделю.
  for (let i = 0; i < 8; i++) {
    if (matchesWeekday(location, dayCursor)) {
      const start = serverTimeOnDate(dayCursor, location.hour, location.minute);
      const end = new Date(start.getTime() + durationMin * 60000);
      if (end.getTime() > now.getTime()) {
        return { start, end };
      }
    }
    dayCursor = new Date(dayCursor.getTime() + 24 * 3600000);
  }
  // Сюда мы никогда не должны попасть, но на всякий случай отдаём
  // сегодняшнее окно, чтобы не сломать интерфейс.
  const start = serverTimeOnDate(now, location.hour, location.minute);
  return { start, end: new Date(start.getTime() + durationMin * 60000) };
}

// Статус для подсветки строки: active — захват идёт прямо сейчас,
// soon — начнётся в течение ближайшего часа, normal — всё остальное.
export function getCaptureStatus(location, now = new Date()) {
  const { start, end } = getNextOccurrence(location, now);
  const msToStart = start.getTime() - now.getTime();
  const isActive = now.getTime() >= start.getTime() && now.getTime() < end.getTime();
  const isSoon = !isActive && msToStart <= 60 * 60000;
  return {
    start,
    end,
    isActive,
    isSoon,
    msToStart,
    msToEnd: end.getTime() - now.getTime(),
  };
}

// Форматирует миллисекунды в "чч:мм:сс" (или "мм:сс", если меньше часа).
export function formatDuration(ms) {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// Часовой пояс, установленный на устройстве игрока, для баннера над таблицей.
export function getViewerTimezoneLabel(now = new Date()) {
  let tz = 'локальный часовой пояс';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz;
  } catch {
    // игнорируем — используем запасной текст
  }
  const offsetMin = -now.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const oh = String(Math.floor(abs / 60)).padStart(2, '0');
  const om = String(abs % 60).padStart(2, '0');
  return `UTC ${sign}${oh}:${om} · ${tz}`;
}
