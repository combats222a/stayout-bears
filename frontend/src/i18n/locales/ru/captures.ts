export interface CapturesContent {
  title: string;
  activeNow: (n: number) => string;
  soon: (n: number) => string;
  totalPoints: (n: number) => string;
  tzNotePrefix: string;
  searchPlaceholder: string;
  colName: string;
  colType: string;
  colLocation: string;
  colCoords: string;
  colDate: string;
  colCountdown: string;
  favoriteTitle: string;
  soundTitle: string;
  sortHint: string;
  addFavorite: string;
  removeFavorite: string;
  soundOnTitle: string;
  soundOffTitle: string;
  notFound: string;
  legendActive: string;
  legendSoon: string;
  legendFavorite: string;
  legendSound: string;
  legendStarColorPrefix: string;
  legendStarFavorite: string;
  legendStarSoon: string;
  legendStarActive: string;
  spoilerFavHeadingMatch: string;
  spoilerFavBullet1: string;
  spoilerFavBullet2: string;
  spoilerFavColorLabel: string;
  spoilerFavBlue: string;
  spoilerFavYellow: string;
  spoilerFavRed: string;
}

const captures: CapturesContent = {
  title: '🚩 Захваты',
  activeNow: (n) => `🔴 Идёт сейчас: ${n}`,
  soon: (n) => `🟡 Скоро: ${n}`,
  totalPoints: (n) => `📍 Всего точек: ${n}`,
  tzNotePrefix: '🕒 Время до захвата рассчитано в соответствии с часовым поясом, установленным на вашем устройстве:',
  searchPlaceholder: 'Поиск по названию, локации или координатам...',
  colName: 'Наименование',
  colType: 'Тип',
  colLocation: 'Локация',
  colCoords: 'Координаты',
  colDate: 'Дата захвата',
  colCountdown: 'До начала / до конца захвата',
  favoriteTitle: 'Избранное',
  soundTitle: 'Звуковое уведомление',
  sortHint: 'Нажмите, чтобы отсортировать',
  addFavorite: 'Добавить в избранное',
  removeFavorite: 'Убрать из избранного',
  soundOnTitle: 'Звук в начале захвата включён',
  soundOffTitle: 'Звук в начале захвата выключен',
  notFound: 'Ничего не найдено',
  legendActive: '— точка захватывается прямо сейчас',
  legendSoon: '— захват начнётся в течение ближайшего часа',
  legendFavorite: '— избранные точки отображаются вверху таблицы',
  legendSound: '— звук в начале захвата (по умолчанию отключён, включается для каждой точки отдельно)',
  legendStarColorPrefix: 'Цвет звезды:',
  legendStarFavorite: 'избранное,',
  legendStarSoon: 'захват скоро,',
  legendStarActive: 'захват идёт',
  spoilerFavHeadingMatch: 'Избранное и звуковые уведомления',
  spoilerFavBullet1: '⭐ Звезда — добавить в избранное. Избранное автоматически отображается вверху таблицы.',
  spoilerFavBullet2: '🔊 Значок звука — включает звуковое уведомление о начале захвата. По умолчанию уведомление отключено и настраивается отдельно для каждой точки.',
  spoilerFavColorLabel: 'Цвет звезды:',
  spoilerFavBlue: '— до начала захвата больше часа.',
  spoilerFavYellow: '— до начала захвата осталось меньше часа.',
  spoilerFavRed: '— захват уже идёт.',
};

export default captures;
