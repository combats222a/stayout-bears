// Настройки звука хранятся локально в браузере игрока.
// Медведи и Сияние — по умолчанию ВКЛЮЧЕНО (как было раньше).
// Таймеры — по умолчанию ВЫКЛЮЧЕНО для каждого таймера отдельно.

const KEY_BEARS = 'sound_bears_enabled';
const KEY_SHINING = 'sound_shining_enabled';
const KEY_TIMER_PREFIX = 'sound_timer_';

function readBool(key, def) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return def;
    return v === '1';
  } catch {
    return def;
  }
}

function writeBool(key, val) {
  try { localStorage.setItem(key, val ? '1' : '0'); } catch {}
}

export function isBearsSoundEnabled() { return readBool(KEY_BEARS, true); }
export function setBearsSoundEnabled(val) { writeBool(KEY_BEARS, val); }

export function isShiningSoundEnabled() { return readBool(KEY_SHINING, true); }
export function setShiningSoundEnabled(val) { writeBool(KEY_SHINING, val); }

export function isTimerSoundEnabled(timerId) { return readBool(KEY_TIMER_PREFIX + timerId, false); }
export function setTimerSoundEnabled(timerId, val) { writeBool(KEY_TIMER_PREFIX + timerId, val); }
