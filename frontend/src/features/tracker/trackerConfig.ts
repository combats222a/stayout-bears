// Общий конфиг для Bears и Draugs — устраняет дублирование между
// pages/BearsPage.jsx и pages/DraugsPage.jsx (перенесены сюда как
// features/tracker/BearsPage.jsx и DraugsPage.jsx, тонкие обёртки над
// TrackerPage).
//
// Намеренно НЕ трогаем utils/bears.js и utils/draugs.js — они всё ещё
// нужны components/BearCard.jsx и hooks/useGlobalSoundWatcher.js как есть.
// Здесь просто переиспользуем их экспорты под общим интерфейсом.

import {
  BEARS_LIST, getBearMeta, getBearStatus,
  getTimeLeftMs as getBearTimeLeftMs, getProgress as getBearProgress,
  formatCountdown as bearFormatCountdown, formatClock as bearFormatClock,
  formatElapsed as bearFormatElapsed, parseLocalTimeInput as bearParseLocalTimeInput,
} from '../../utils/bears';
import {
  DRAUGS_LIST, getDraugMeta, getDraugStatus,
  getTimeLeftMs as getDraugTimeLeftMs, getProgress as getDraugProgress,
  formatCountdown as draugFormatCountdown, formatClock as draugFormatClock,
  formatElapsed as draugFormatElapsed, parseLocalTimeInput as draugParseLocalTimeInput,
} from '../../utils/draugs';
import { isBearSoundEnabled, setBearSoundEnabled, isDraugSoundEnabled, setDraugSoundEnabled } from '../../utils/soundPrefs';
import { BEARS_SPOILER, DRAUGS_SPOILER } from '../../content/spoilerContent';

export interface TrackerListEntry {
  index: number;
  name: string;
  square: string;
}

export interface TrackerConfig {
  key: 'bears' | 'draugs';
  indexKey: 'bear_index' | 'draug_index';
  list: TrackerListEntry[];
  apiPath: string;
  responseKey: string;
  getMeta: (index: number) => TrackerListEntry;
  getStatus: (item: any) => 'alive' | 'dead';
  getTimeLeftMs: (item: any) => number;
  getProgress: (item: any) => number;
  formatCountdown: (ms: number) => string;
  formatClock: (ts: string | null) => string;
  formatElapsed: (ts: string | null) => string;
  parseLocalTimeInput: (timeStr: string) => string | null;
  soundPrefs: { isEnabled: (index: number) => boolean; setEnabled: (index: number, val: boolean) => void };
  icon: string;
  pageTitleGuest: string;
  trackingNounGenitive: string; // "Вступи в клан чтобы отслеживать ___"
  headerTitle: (clanName: string) => string;
  rowNounLabel: string;
  killedNounGenitive: string; // "Введи время когда убили ___"
  vanishedNoun: string; // "«Исчез» — ___ пропал ~5 мин назад"
  spoiler: { icon: string; title: string; blocks: any[] };
  spoilerStorageKey: string;
  guestLock: { icon: string; title: string; text: string };
}

export const BEARS_CONFIG: TrackerConfig = {
  key: 'bears',
  indexKey: 'bear_index',
  list: BEARS_LIST,
  apiPath: '/bears',
  responseKey: 'bear',
  getMeta: getBearMeta,
  getStatus: getBearStatus,
  getTimeLeftMs: getBearTimeLeftMs,
  getProgress: getBearProgress,
  formatCountdown: bearFormatCountdown,
  formatClock: bearFormatClock,
  formatElapsed: bearFormatElapsed,
  parseLocalTimeInput: bearParseLocalTimeInput,
  soundPrefs: { isEnabled: isBearSoundEnabled, setEnabled: setBearSoundEnabled },
  icon: '🐻\u200d❄️',
  pageTitleGuest: 'Медведи',
  trackingNounGenitive: 'медведей',
  headerTitle: (clanName) => `🐻\u200d❄️ Белые медведи — ${clanName}`,
  rowNounLabel: 'Медведь',
  killedNounGenitive: 'медведя',
  vanishedNoun: 'медведь',
  spoiler: BEARS_SPOILER,
  spoilerStorageKey: 'spoiler_bears',
  guestLock: {
    icon: '🐻\u200d❄️',
    title: 'Отслеживай спавны медведей вместе с кланом',
    text: 'Тайминги медведей и синхронизация с кланом доступны после регистрации — это займёт меньше минуты.',
  },
};

export const DRAUGS_CONFIG: TrackerConfig = {
  key: 'draugs',
  indexKey: 'draug_index',
  list: DRAUGS_LIST,
  apiPath: '/draugs',
  responseKey: 'draug',
  getMeta: getDraugMeta,
  getStatus: getDraugStatus,
  getTimeLeftMs: getDraugTimeLeftMs,
  getProgress: getDraugProgress,
  formatCountdown: draugFormatCountdown,
  formatClock: draugFormatClock,
  formatElapsed: draugFormatElapsed,
  parseLocalTimeInput: draugParseLocalTimeInput,
  soundPrefs: { isEnabled: isDraugSoundEnabled, setEnabled: setDraugSoundEnabled },
  icon: '💀',
  pageTitleGuest: 'Драуги',
  trackingNounGenitive: 'драугов',
  headerTitle: (clanName) => `💀 Драуги — ${clanName}`,
  rowNounLabel: 'Драуг',
  killedNounGenitive: 'драуга',
  vanishedNoun: 'драуг',
  spoiler: DRAUGS_SPOILER,
  spoilerStorageKey: 'spoiler_draugs',
  guestLock: {
    icon: '💀',
    title: 'Отслеживай спавны драугов вместе с кланом',
    text: 'Тайминги драугов и синхронизация с кланом доступны после регистрации — это займёт меньше минуты.',
  },
};
