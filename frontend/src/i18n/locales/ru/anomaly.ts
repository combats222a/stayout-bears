export interface AnomalyContent {
  modalErrorEmpty: string;
  modalErrorInvalid: string;
  modalTitle: string;
  modalLabel: string;
  modalHint: string;
  modalCancel: string;
  modalSave: string;
  pageTitle: string;
  guestLockTitle: string;
  guestLockText: string;
  loginToTrack: string;
  burningNow: string;
  breachIn: (t: string) => string;
  untilNext: (t: string) => string;
  soundOnTitle: string;
  soundOffTitle: string;
  ownerNotePrefix: string;
  anchorGameLabel: string;
  anchorRealLabel: string;
  enterTimePrompt: string;
  setTimeBtn: string;
  cardLabels: string[];
  gameTimeLabel: string;
  startedAt: string;
  startsAt: string;
  untilEnd: string;
  inLabel: string;
  hintText: string;
}

const anomaly: AnomalyContent = {
  modalErrorEmpty: 'Введи игровое время — просто цифры, например 0113',
  modalErrorInvalid: 'Неверное время',
  modalTitle: '🥶 Установить время Уледной жары',
  modalLabel: 'Якорь Z — игровое время которое ты видишь прямо сейчас в игре (только цифры)',
  modalHint: 'Backspace удаляет время справа налево: минуты → часы. Затем просто вводи цифры — двоеточие появится само · Локация зафиксирована — GMT +00:00',
  modalCancel: 'Отмена',
  modalSave: 'Сохранить',
  pageTitle: '🥶 Аномальные прорывы / Уледная жара',
  guestLockTitle: 'Личный отсчёт — только твой',
  guestLockText: 'Якорь Аномальных прорывов видит и настраивает только сам игрок. Зарегистрируйся, чтобы завести свой — он будет доступен с любого устройства.',
  loginToTrack: 'Войди, чтобы отслеживать Аномальные прорывы',
  burningNow: '⚡ Прорыв идёт прямо сейчас!',
  breachIn: (t) => `⚠️ Прорыв через ${t}!`,
  untilNext: (t) => `До ближайшего прорыва: ${t}`,
  soundOnTitle: 'Звук включён — нажми чтобы выключить',
  soundOffTitle: 'Звук выключен — нажми чтобы включить',
  ownerNotePrefix: '🔒 Аномальные прорывы видит и настраивает только их владелец —',
  anchorGameLabel: 'Якорь Z (игровое):',
  anchorRealLabel: 'Якорь X (реальное):',
  enterTimePrompt: 'Введи текущее игровое время чтобы начать отсчёт',
  setTimeBtn: '🥶 Установить время',
  cardLabels: ['ПРОРЫВ 1', 'ПРОРЫВ 2', 'ПРОРЫВ 3', 'ПРОРЫВ 4'],
  gameTimeLabel: 'Игровое время',
  startedAt: 'Началось в',
  startsAt: 'Начало в',
  untilEnd: 'До конца',
  inLabel: 'Через',
  hintText: '🥶 Оранжевая: 07:30–07:50 и 19:30–19:50 (игровое) · Зелёная: 07:50–10:00 и 19:50–22:00 (игровое) · Локация зафиксирована на GMT +00:00 · Звук в момент появления оранжевой рамки · Страница не зависит от Горы Сияния',
};

export default anomaly;
