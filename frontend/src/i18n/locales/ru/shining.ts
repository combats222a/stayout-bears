export interface ShiningContent {
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
  joinClanToTrack: string;
  burningNow: string;
  shiningIn: (t: string) => string;
  untilNext: (t: string) => string;
  soundOnTitle: string;
  soundOffTitle: string;
  anchorGameLabel: string;
  anchorRealLabel: string;
  setByPrefix: string;
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

const shining: ShiningContent = {
  modalErrorEmpty: 'Введи игровое время — просто цифры, например 0113',
  modalErrorInvalid: 'Неверное время',
  modalTitle: '✨ Установить время Горы Сияния',
  modalLabel: 'Якорь Z — игровое время которое ты видишь прямо сейчас в игре (только цифры)',
  modalHint: 'Backspace удаляет время справа налево: минуты → часы. Затем просто вводи цифры — двоеточие появится само · Любое текущее игровое время',
  modalCancel: 'Отмена',
  modalSave: 'Сохранить',
  pageTitle: '✨ Гора Сияния',
  guestLockTitle: 'Не пропускай Сияние на Горе',
  guestLockText: 'Точный отсчёт до ближайшего цикла и звуковое уведомление доступны кланам Bear Tracker — зарегистрируйся, чтобы подключиться.',
  joinClanToTrack: 'Вступи в клан чтобы отслеживать Сияния',
  burningNow: '⚡ Сияние идёт прямо сейчас!',
  shiningIn: (t) => `⚠️ Сияние через ${t}!`,
  untilNext: (t) => `До ближайшего Сияния: ${t}`,
  soundOnTitle: 'Звук включён — нажми чтобы выключить',
  soundOffTitle: 'Звук выключен — нажми чтобы включить',
  anchorGameLabel: 'Якорь Z (игровое):',
  anchorRealLabel: 'Якорь X (реальное):',
  setByPrefix: 'Установил:',
  enterTimePrompt: 'Введи текущее игровое время чтобы начать отсчёт',
  setTimeBtn: '✨ Установить время',
  cardLabels: ['СИЯНИЕ 1', 'СИЯНИЕ 2', 'СИЯНИЕ 3', 'СИЯНИЕ 4'],
  gameTimeLabel: 'Игровое время',
  startedAt: 'Началось в',
  startsAt: 'Начало в',
  untilEnd: 'До конца',
  inLabel: 'Через',
  hintText: '✨ Сияния каждые 6 игровых часов = 52 мин 30 сек реального времени · Диапазоны: 00:00–01:00 · 06:00–07:00 · 12:00–13:00 · 18:00–19:00 · Звук за 5 мин · Любой игрок клана может обновить время',
};

export default shining;
