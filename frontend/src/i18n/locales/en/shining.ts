import type { ShiningContent } from '../ru/shining';

const shining: ShiningContent = {
  modalErrorEmpty: 'Enter the in-game time — just digits, e.g. 0113',
  modalErrorInvalid: 'Invalid time',
  modalTitle: '✨ Set Shining Mountain time',
  modalLabel: 'Z anchor — the in-game time you see right now in the game (digits only)',
  modalHint: 'Backspace deletes right to left: minutes → hours. Then just type digits — the colon fills in automatically · Any current in-game time',
  modalCancel: 'Cancel',
  modalSave: 'Save',
  pageTitle: '✨ Shining Mountain',
  guestLockTitle: 'Never miss a Shining on the Mountain',
  guestLockText: 'A precise countdown to the next cycle and a sound alert are available to Bear Tracker clans — register to join one.',
  joinClanToTrack: 'Join a clan to track the Shining',
  burningNow: '⚡ The Shining is happening right now!',
  shiningIn: (t) => `⚠️ Shining in ${t}!`,
  untilNext: (t) => `Until the next Shining: ${t}`,
  soundOnTitle: 'Sound is on — click to turn off',
  soundOffTitle: 'Sound is off — click to turn on',
  anchorGameLabel: 'Z anchor (in-game):',
  anchorRealLabel: 'X anchor (real):',
  setByPrefix: 'Set by:',
  enterTimePrompt: 'Enter the current in-game time to start the countdown',
  setTimeBtn: '✨ Set time',
  cardLabels: ['SHINING 1', 'SHINING 2', 'SHINING 3', 'SHINING 4'],
  gameTimeLabel: 'In-game time',
  startedAt: 'Started at',
  startsAt: 'Starts at',
  untilEnd: 'Time left',
  inLabel: 'In',
  hintText: '✨ Shinings happen every 6 in-game hours = 52 min 30 sec of real time · Windows: 00:00–01:00 · 06:00–07:00 · 12:00–13:00 · 18:00–19:00 · Sound plays 5 min before · Any clan member can update the time',
};

export default shining;
