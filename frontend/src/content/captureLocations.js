// Справочник точек захвата в Stay Out (Базы и Укрепточки).
//
// Время (hour/minute) — это ЕЖЕДНЕВНОЕ игровое время сервера захвата,
// зафиксированное в часовом поясе Europe/Kiev (UTC+3, без перевода на
// летнее/зимнее время — так же, как отображает сама игра). Bear Tracker
// на основе этого рассчитывает ближайшее наступление события и конвертирует
// его в часовой пояс, установленный на устройстве конкретного игрока
// (см. utils/captures.js).
//
// DURATION_BY_TYPE — длительность окна захвата в минутах, отдельно для
// каждого типа точки: Укрепточки захватываются 30 минут, Базы — 60 минут.
export const DURATION_BY_TYPE = {
  'Укрепточка': 30,
  'База': 60,
};

// Длительность по умолчанию для типов, которых нет в DURATION_BY_TYPE.
export const DEFAULT_DURATION_MIN = 60;

// Смещение "игрового" часового пояса точек ниже относительно UTC, в часах.
export const SERVER_UTC_OFFSET = 3; // Europe/Kiev, UTC+3

// Некоторые точки (Базы) захватываются не каждый день, а только по
// определённым дням недели. Поле `weekday` — номер дня недели по
// стандарту JS (Date.getUTCDay): 0 — воскресенье, 6 — суббота.
// Если поле не задано — точка захватывается ежедневно.
export const WEEKDAY = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export const CAPTURE_LOCATIONS = [
  { name: 'Заброшенный рудник',              type: 'База',        location: 'Окрестности Любеча',     coords: 'H3-2', hour: 19, minute: 0, weekday: WEEKDAY.SATURDAY },
  { name: 'Деревня на холме',                type: 'База',        location: 'Окрестности Любеча',     coords: 'G7-3', hour: 19, minute: 0, weekday: WEEKDAY.SATURDAY },
  { name: 'Автостанция Новиково',            type: 'База',        location: 'Везувий',                coords: 'F3-2', hour: 17, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: 'Рыбхоз',                          type: 'База',        location: 'Везувий',                coords: 'C7-4', hour: 17, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: 'Тунгуска',                        type: 'База',        location: 'Тунгуска',               coords: 'F4-1', hour: 17, minute: 0, weekday: WEEKDAY.SATURDAY },
  { name: 'Песчаный карьер',                 type: 'База',        location: 'Черный лес',             coords: 'K3-1', hour: 19, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: 'Пожарная станция',                type: 'База',        location: 'Черный лес',             coords: 'Q4-2', hour: 19, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: 'СЕЛЬХОЗСНАБ',                     type: 'База',        location: 'Черный лес',             coords: 'S7-4', hour: 19, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: 'ДПУ-7',                           type: 'База',        location: 'Черный лес',             coords: 'L8-1', hour: 19, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: 'Подстанция',                      type: 'База',        location: 'Черный лес',             coords: 'H8-2', hour: 19, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: 'Задорожье',                       type: 'Укрепточка',  location: 'Окрестности Любеча',     coords: 'F6-2', hour: 13, minute: 0 },
  { name: 'Заброшенная автостоянка',         type: 'Укрепточка',  location: 'Окрестности Любеча',     coords: 'J3-3', hour: 16, minute: 0 },
  { name: 'Лесопилка',                       type: 'Укрепточка',  location: 'Окрестности Любеча',     coords: 'E2-2', hour: 19, minute: 0 },
  { name: 'Очистная станция',                type: 'Укрепточка',  location: 'Окрестности Любеча',     coords: 'H9-4', hour: 19, minute: 0 },
  { name: 'Лодочное производство',           type: 'Укрепточка',  location: 'Окрестности Любеча',     coords: 'J5-3', hour: 21, minute: 0 },
  { name: 'Дорога к д.Выселки',               type: 'Укрепточка',  location: 'Окрестности Любеча',     coords: 'B3-4', hour: 23, minute: 0 },
  { name: 'д. Конуковка',                    type: 'Укрепточка',  location: 'Аэропорт',               coords: 'A2-2', hour: 18, minute: 30 },
  { name: 'База отдыха',                     type: 'Укрепточка',  location: 'Везувий',                coords: 'F9-2', hour: 9,  minute: 0 },
  { name: 'Железнодорожная станция Хворостовка', type: 'Укрепточка', location: 'Везувий',             coords: 'I6-3', hour: 14, minute: 0 },
  { name: 'Пост ГАИ',                        type: 'Укрепточка',  location: 'Везувий',                coords: 'C5-2', hour: 18, minute: 0 },
  { name: 'СНТ Озеро',                       type: 'Укрепточка',  location: 'Везувий',                coords: 'C4-2', hour: 20, minute: 30 },
  { name: 'Заброшенное бомбоубежище',        type: 'Укрепточка',  location: 'Везувий',                coords: 'D10-2', hour: 20, minute: 30 },
  { name: '66 км',                           type: 'Укрепточка',  location: 'Везувий',                coords: 'H4-4', hour: 21, minute: 0 },
  { name: 'Гора сияния - юг',                type: 'Укрепточка',  location: 'Новая Земля о. Южный',   coords: 'C4-3', hour: 15, minute: 0 },
  { name: 'Гора сияния - восток',            type: 'Укрепточка',  location: 'Новая Земля о. Южный',   coords: 'C4-2', hour: 16, minute: 0 },
  { name: 'Гора сияния - запад',             type: 'Укрепточка',  location: 'Новая Земля о. Южный',   coords: 'B4-2', hour: 17, minute: 0 },
  { name: 'Станция',                         type: 'Укрепточка',  location: 'Новая Земля о. Южный',   coords: 'C3-2', hour: 21, minute: 0 },
  { name: 'Блокпост Красно',                 type: 'Укрепточка',  location: 'Черный лес',             coords: 'N9-2', hour: 13, minute: 0 },
  { name: 'Рыбацкая хижина',                 type: 'Укрепточка',  location: 'Черный лес',             coords: 'E4-1', hour: 15, minute: 0 },
  { name: 'Окраина с.Красно',                type: 'Укрепточка',  location: 'Черный лес',             coords: 'R8-3', hour: 16, minute: 0 },
  { name: 'Дачный кооператив',                type: 'Укрепточка',  location: 'Черный лес',             coords: 'O5-1', hour: 17, minute: 0 },
  { name: 'Охотничья заимка',                type: 'Укрепточка',  location: 'Черный лес',             coords: 'N3-1', hour: 21, minute: 0 },
];
