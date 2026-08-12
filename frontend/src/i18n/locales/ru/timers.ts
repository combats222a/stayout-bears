export interface TimersContent {
  moreTitle: string;
  editItem: string;
  deleteItem: string;
  increaseAria: string;
  decreaseAria: string;
  periodTitle: string;
  dayUnit: string;
  hourUnit: string;
  minuteUnit: string;
  dayUnitLong: string;
  hourUnitLong: string;
  minuteUnitLong: string;
  nameRequired: string;
  editTimerTitle: string;
  closeAria: string;
  timerNameLabel: string;
  untilEventLabel: string;
  untilEventTip: string;
  hintEnterGameTime: string;
  cancel: string;
  saveChanges: string;
  dragToReorder: string;
  ready: string;
  now: string;
  updateTitle: string;
  soundOnTitle: string;
  soundOffTitle: string;
  updateBtn: string;
  everyPrefix: string;
  loading: string;
  pageTitleGuest: string;
  guestLockTitle: string;
  guestLockText: string;
  pageTitle: string;
  pageSubtitle: string;
  ownerNotePrefix: string;
  emptyTitle: string;
  emptySubtitle: string;
  periodRequired: string;
  colName: string;
  colPeriod: string;
  colRemaining: string;
  colForecast: string;
  colActions: string;
  createTitle: string;
  createNameLabel: string;
  createNamePlaceholder: string;
  createPeriodLabel: string;
  createBtn: string;
  timezoneLabel: string;
}

const timers: TimersContent = {
  moreTitle: 'Ещё',
  editItem: 'Изменить',
  deleteItem: 'Удалить',
  increaseAria: 'Увеличить',
  decreaseAria: 'Уменьшить',
  periodTitle: 'Период таймера',
  dayUnit: 'д',
  hourUnit: 'ч',
  minuteUnit: 'м',
  dayUnitLong: 'дн.',
  hourUnitLong: 'ч.',
  minuteUnitLong: 'мин.',
  nameRequired: 'Введите название таймера',
  editTimerTitle: 'Редактировать таймер',
  closeAria: 'Закрыть',
  timerNameLabel: 'Название таймера',
  untilEventLabel: 'Осталось до события',
  untilEventTip: 'Поправьте, если забыли вовремя нажать «Обновить» — период при этом не изменится',
  hintEnterGameTime: 'Введите время, которое показывает игра.',
  cancel: 'Отмена',
  saveChanges: 'Сохранить изменения',
  dragToReorder: 'Перетащи чтобы изменить порядок',
  ready: 'Готово!',
  now: 'Уже!',
  updateTitle: 'Обновить',
  soundOnTitle: 'Звук по окончании включён',
  soundOffTitle: 'Звук по окончании выключен',
  updateBtn: 'Обновить',
  everyPrefix: 'каждые',
  loading: 'Загрузка...',
  pageTitleGuest: '⏱️ Мои таймеры',
  guestLockTitle: 'Личные таймеры — только твои',
  guestLockText: 'Таймеры видит и настраивает только их создатель. Зарегистрируйся, чтобы завести свои — под откаты заданий, ресурсов или чего угодно ещё.',
  pageTitle: '⏱️ Таймеры',
  pageSubtitle: 'Создавайте таймеры, отслеживайте время и получайте уведомления',
  ownerNotePrefix: '🔒 Таймеры видит только их создатель —',
  emptyTitle: 'У вас пока нет таймеров',
  emptySubtitle: 'Создайте первый таймер с помощью формы ниже',
  periodRequired: 'Период должен быть не менее 1 минуты',
  colName: 'Название таймера',
  colPeriod: 'Период',
  colRemaining: 'Оставшееся время',
  colForecast: 'Прогноз',
  colActions: 'Действия',
  createTitle: 'Создать новый таймер',
  createNameLabel: 'Название таймера',
  createNamePlaceholder: 'Введите название',
  createPeriodLabel: 'Период таймера',
  createBtn: '+ Создать таймер',
  timezoneLabel: '🕐 Часовой пояс:',
};

export default timers;
