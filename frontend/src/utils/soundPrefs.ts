// Настройки звука хранятся локально в браузере игрока.
// Медведи и Драуги — теперь звук настраивается ОТДЕЛЬНО для каждого
// медведя/драуга (как у Таймеров), и по умолчанию ВЫКЛЮЧЕН для каждого.
// Сияние — общий переключатель на всю вкладку, по умолчанию ВЫКЛЮЧЕН.
// Таймеры — по умолчанию ВЫКЛЮЧЕНО для каждого таймера отдельно.

const KEY_BEAR_PREFIX = 'sound_bear_';
const KEY_DRAUG_PREFIX = 'sound_draug_';
const KEY_SHINING = 'sound_shining_enabled';
const KEY_ANOMALY = 'sound_anomaly_enabled';
const KEY_TIMER_PREFIX = 'sound_timer_';
const KEY_CAPTURE_SOUND_PREFIX = 'sound_capture_';
const KEY_CAPTURE_FAVORITE_PREFIX = 'favorite_capture_';

function readBool(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return def;
    return v === '1';
  } catch {
    return def;
  }
}

function writeBool(key: string, val: boolean): void {
  try { localStorage.setItem(key, val ? '1' : '0'); } catch {}
}

export function isBearSoundEnabled(bearIndex: number | string): boolean { return readBool(KEY_BEAR_PREFIX + bearIndex, false); }
export function setBearSoundEnabled(bearIndex: number | string, val: boolean): void { writeBool(KEY_BEAR_PREFIX + bearIndex, val); }

export function isDraugSoundEnabled(draugIndex: number | string): boolean { return readBool(KEY_DRAUG_PREFIX + draugIndex, false); }
export function setDraugSoundEnabled(draugIndex: number | string, val: boolean): void { writeBool(KEY_DRAUG_PREFIX + draugIndex, val); }

export function isShiningSoundEnabled(): boolean { return readBool(KEY_SHINING, false); }
export function setShiningSoundEnabled(val: boolean): void { writeBool(KEY_SHINING, val); }

// Аномальные прорывы / Уледная жара — общий переключатель на всю вкладку,
// по умолчанию ВЫКЛЮЧЕН, положение сохраняется (как у Сияния).
export function isAnomalySoundEnabled(): boolean { return readBool(KEY_ANOMALY, false); }
export function setAnomalySoundEnabled(val: boolean): void { writeBool(KEY_ANOMALY, val); }

export function isTimerSoundEnabled(timerId: number | string): boolean { return readBool(KEY_TIMER_PREFIX + timerId, false); }
export function setTimerSoundEnabled(timerId: number | string, val: boolean): void { writeBool(KEY_TIMER_PREFIX + timerId, val); }

// Точки захвата (Захваты) — звук настраивается отдельно для каждой точки
// (по имени точки), по умолчанию ВЫКЛЮЧЕН, как у Таймеров/Медведей.
export function isCaptureSoundEnabled(locationName: string): boolean { return readBool(KEY_CAPTURE_SOUND_PREFIX + locationName, false); }
export function setCaptureSoundEnabled(locationName: string, val: boolean): void { writeBool(KEY_CAPTURE_SOUND_PREFIX + locationName, val); }

// Избранное для точек захвата — отдельная звёздочка на каждую точку,
// по умолчанию ВЫКЛЮЧЕНО (не в избранном). Хранится и запоминается
// локально в браузере игрока, как и звук.
export function isCaptureFavorite(locationName: string): boolean { return readBool(KEY_CAPTURE_FAVORITE_PREFIX + locationName, false); }
export function setCaptureFavorite(locationName: string, val: boolean): void { writeBool(KEY_CAPTURE_FAVORITE_PREFIX + locationName, val); }
