import type { AnomalyContent } from '../ru/anomaly';

const anomaly: AnomalyContent = {
  modalErrorEmpty: 'Enter the in-game time — just digits, e.g. 0113',
  modalErrorInvalid: 'Invalid time',
  modalTitle: '🥶 Set Ice Heat time',
  modalLabel: 'Z anchor — the in-game time you see right now in the game (digits only)',
  modalHint: 'Backspace deletes right to left: minutes → hours. Then just type digits — the colon fills in automatically · Location is fixed — GMT +00:00',
  modalCancel: 'Cancel',
  modalSave: 'Save',
  pageTitle: '🥶 Anomaly Breaches / Ice Heat',
  guestLockTitle: 'A personal countdown — just for you',
  guestLockText: 'Only you can see and set your Anomaly Breach anchor. Register to set up your own — it will be available on any device.',
  loginToTrack: 'Log in to track Anomaly Breaches',
  burningNow: '⚡ A breach is happening right now!',
  breachIn: (t) => `⚠️ Breach in ${t}!`,
  untilNext: (t) => `Until the next breach: ${t}`,
  soundOnTitle: 'Sound is on — click to turn off',
  soundOffTitle: 'Sound is off — click to turn on',
  ownerNotePrefix: '🔒 Anomaly Breaches are only visible and configurable by their owner —',
  anchorGameLabel: 'Z anchor (in-game):',
  anchorRealLabel: 'X anchor (real):',
  enterTimePrompt: 'Enter the current in-game time to start the countdown',
  setTimeBtn: '🥶 Set time',
  cardLabels: ['BREACH 1', 'BREACH 2', 'BREACH 3', 'BREACH 4'],
  gameTimeLabel: 'In-game time',
  startedAt: 'Started at',
  startsAt: 'Starts at',
  untilEnd: 'Time left',
  inLabel: 'In',
  hintText: '🥶 Orange: 07:30–07:50 and 19:30–19:50 (in-game) · Green: 07:50–10:00 and 19:50–22:00 (in-game) · Location is fixed to GMT +00:00 · Sound plays when the orange border appears · This page is independent from Shining Mountain',
};

export default anomaly;
