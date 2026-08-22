import type { DeepValuesToString } from '../../types';
import type ruTracker from '../ru/tracker';

const tracker: DeepValuesToString<typeof ruTracker> = {
  colSquare: 'Square',
  colToSpawn: 'Until spawn',
  colActions: 'Actions',
  colSpawnTime: 'Spawn time',
  colElapsed: 'Time elapsed',
  colDeathTime: 'Death time',
  colPlayer: 'Player',
  spawnedTag: '⚡ Spawned!',
  btnNow: 'Now',
  btnVanished: 'Despawned',
  btnReset: '✕ Reset',
  soundOnTitle: 'Spawn sound alert is on',
  soundOffTitle: 'Spawn sound alert is off',
  editDeathTimeTitle: 'Click to fix the death time',
  enterDeathTimeTitle: 'Click to enter the death time',
  noPlayer: '—',
  joinClanPrefix: 'Join a clan to track',
  timerWord: 'timer',
  timerWordPlural: 'timers',
  spawnBangSuffix: 'spawned!',
  timezoneLabel: '⏱ Time zone:',
  tableHint: '⚡ Sound alert 5 min before spawn · "Despawned" —',
  tableHintVanishedSuffix: 'despawned ~5 min ago · ✎ Click "Death time" to fix it',
  modalTitlePrefix: '⏱ Death time —',
  modalLabelPrefix: 'Enter when',
  modalLabelSuffix: 'was killed (digits only)',
  modalHint: 'Backspace deletes right to left: seconds → minutes → hours. Then just type digits — colons fill in automatically · Time is in your local time zone',
  modalCancel: 'Cancel',
  modalSave: 'Save',
  modalErrorEmpty: 'Enter a time — just digits, e.g. 093500',
  modalErrorInvalid: 'Invalid time',
};

export default tracker;
