export interface HeartsContent {
  clanMembersLabel: string;
  searchPlaceholder: string;
  noMembers: string;
  allAdded: string;
  writeManually: string;
  nickPlaceholder: string;
  whoFoundClan: string;
  nobody: string;
  writeManuallyShort: string;
  nickShort: string;
  editOnlyOwnerTitle: string;
  markUnpaid: string;
  markPaid: string;
  guestTag: string;
  chooseEllipsis: string;
  currencySuffix: string;
  shareCurrencySuffix: string;
  deleteTitle: string;
  colDate: string;
  colNick: string;
  colHearts: string;
  colPelts: string;
  colShare: string;
  colFinders: string;
  colPaidOut: string;
  colSold: string;
  loadError: string;
  pageTitleGuest: string;
  guestLockTitle: string;
  guestLockText: string;
  joinClanPrompt: string;
  pageTitle: (clanName: string) => string;
  heartsCount: (n: number) => string;
  peltsCount: (n: number) => string;
  participantsCount: (n: number) => string;
  loadingRow: string;
  emptyRow: string;
  addParticipantBtn: string;
  hintText: string;
}

const hearts: HeartsContent = {
  clanMembersLabel: '👥 Участники клана',
  searchPlaceholder: 'Поиск...',
  noMembers: 'Нет участников',
  allAdded: 'Все уже добавлены',
  writeManually: '✍️ Вписать ник вручную',
  nickPlaceholder: 'Ник игрока...',
  whoFoundClan: '👥 Кто нашёл — клан',
  nobody: 'Никого нет',
  writeManuallyShort: '✍️ Вписать вручную',
  nickShort: 'Ник...',
  editOnlyOwnerTitle: 'Редактировать может только тот, чей ник указан в строке',
  markUnpaid: 'Отметить как невыплачено',
  markPaid: 'Отметить как выплачено',
  guestTag: 'гость',
  chooseEllipsis: 'Выбрать...',
  currencySuffix: 'руб.',
  shareCurrencySuffix: 'руб.',
  deleteTitle: 'Удалить',
  colDate: 'ДАТА',
  colNick: 'НИК',
  colHearts: '❤️ СЕРДЦА',
  colPelts: '🧥 ШКУРЫ',
  colShare: '💰 ДОЛЯ',
  colFinders: '👥 УЧАСТНИКИ',
  colPaidOut: '💸 ВЫПЛАЧЕНО УЧАСТНИКАМ',
  colSold: '💵 ПРОДАЛИ ЗА',
  loadError: 'Ошибка загрузки',
  pageTitleGuest: '🫀 Учёт лута',
  guestLockTitle: 'Веди учёт добычи вместе с кланом',
  guestLockText: 'Автоматический расчёт долей и история добычи доступны после регистрации и вступления в клан.',
  joinClanPrompt: 'Вступи в клан чтобы вести учёт',
  pageTitle: (clanName) => `🫀 Учёт лута — ${clanName}`,
  heartsCount: (n) => `❤️ Сердец: ${n}`,
  peltsCount: (n) => `🧥 Шкур: ${n}`,
  participantsCount: (n) => `👥 Участников: ${n}`,
  loadingRow: 'Загрузка...',
  emptyRow: 'Нажми «+ Добавить участника» чтобы начать учёт',
  addParticipantBtn: '+ Добавить участника',
  hintText: '❤️ + шкуры 🧥 = доля считается автоматически · «Участники» и «Выплачено участникам» редактирует только тот, чей ник указан в строке · «Очистить рейд» сбрасывает таблицу',
};

export default hearts;
