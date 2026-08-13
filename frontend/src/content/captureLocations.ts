// Справочник точек захвата в Stay Out (Базы и Укрепточки).
//
// Время (hour/minute) — это ЕЖЕДНЕВНОЕ игровое время сервера захвата,
// зафиксированное в часовом поясе Europe/Kiev (UTC+3, без перевода на
// летнее/зимнее время — так же, как отображает сама игра). Bear Tracker
// на основе этого рассчитывает ближайшее наступление события и конвертирует
// его в часовой пояс, установленный на устройстве конкретного игрока
// (см. utils/captures.ts).
//
// DURATION_BY_TYPE — длительность окна захвата в минутах, отдельно для
// каждого типа точки: Укрепточки захватываются 30 минут, Базы — 60 минут.
export type CaptureType = 'Укрепточка' | 'База';

// Отображаемая подпись типа точки — переводимая UI-категория (не имя
// собственное), в отличие от name/location ниже.
export const CAPTURE_TYPE_LABEL: Record<CaptureType, { ru: string; en: string }> = {
  'Укрепточка': { ru: 'Укрепточка', en: 'Outpost' },
  'База':       { ru: 'База',       en: 'Base' },
};

export const DURATION_BY_TYPE: Record<CaptureType, number> = {
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
} as const;

export interface CaptureLocation {
  name: { ru: string; en: string };
  type: CaptureType;
  location: { ru: string; en: string };
  coords: string;
  hour: number;
  minute: number;
  weekday?: number;
}

// name/location — конкретные точки и зоны карты Stay Out. Большинство —
// обычные описательные русские фразы (не выдуманные имена существ, как в
// achievementsData.ts), поэтому переведены как обычный текст; несколько
// названий деревень (Конуковка, Выселки, Красно) — транслитерированы, т.к.
// у игры нет официальной английской локализации и придумывать для них
// принципиально другие английские названия было бы неверно.
export const CAPTURE_LOCATIONS: CaptureLocation[] = [
  { name: { ru: 'Заброшенный рудник', en: 'Abandoned Mine' }, type: 'База', location: { ru: 'Окрестности Любеча', en: 'Lyubech Outskirts' }, coords: 'H3-2', hour: 19, minute: 0, weekday: WEEKDAY.SATURDAY },
  { name: { ru: 'Деревня на холме', en: 'Hillside Village' }, type: 'База', location: { ru: 'Окрестности Любеча', en: 'Lyubech Outskirts' }, coords: 'G7-3', hour: 19, minute: 0, weekday: WEEKDAY.SATURDAY },
  { name: { ru: 'Автостанция Новиково', en: 'Novikovo Bus Station' }, type: 'База', location: { ru: 'Везувий', en: 'Vesuvius' }, coords: 'F3-2', hour: 17, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: { ru: 'Рыбхоз', en: 'Fish Farm' }, type: 'База', location: { ru: 'Везувий', en: 'Vesuvius' }, coords: 'C7-4', hour: 17, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: { ru: 'Тунгуска', en: 'Tunguska' }, type: 'База', location: { ru: 'Тунгуска', en: 'Tunguska' }, coords: 'F4-1', hour: 17, minute: 0, weekday: WEEKDAY.SATURDAY },
  { name: { ru: 'Песчаный карьер', en: 'Sand Quarry' }, type: 'База', location: { ru: 'Черный лес', en: 'Black Forest' }, coords: 'K3-1', hour: 19, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: { ru: 'Пожарная станция', en: 'Fire Station' }, type: 'База', location: { ru: 'Черный лес', en: 'Black Forest' }, coords: 'Q4-2', hour: 19, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: { ru: 'СЕЛЬХОЗСНАБ', en: 'Agricultural Supply Depot' }, type: 'База', location: { ru: 'Черный лес', en: 'Black Forest' }, coords: 'S7-4', hour: 19, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: { ru: 'ДПУ-7', en: 'DPU-7' }, type: 'База', location: { ru: 'Черный лес', en: 'Black Forest' }, coords: 'L8-1', hour: 19, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: { ru: 'Подстанция', en: 'Substation' }, type: 'База', location: { ru: 'Черный лес', en: 'Black Forest' }, coords: 'H8-2', hour: 19, minute: 0, weekday: WEEKDAY.SUNDAY },
  { name: { ru: 'Задорожье', en: 'Zadorozhye' }, type: 'Укрепточка', location: { ru: 'Окрестности Любеча', en: 'Lyubech Outskirts' }, coords: 'F6-2', hour: 13, minute: 0 },
  { name: { ru: 'Заброшенная автостоянка', en: 'Abandoned Parking Lot' }, type: 'Укрепточка', location: { ru: 'Окрестности Любеча', en: 'Lyubech Outskirts' }, coords: 'J3-3', hour: 16, minute: 0 },
  { name: { ru: 'Лесопилка', en: 'Sawmill' }, type: 'Укрепточка', location: { ru: 'Окрестности Любеча', en: 'Lyubech Outskirts' }, coords: 'E2-2', hour: 19, minute: 0 },
  { name: { ru: 'Очистная станция', en: 'Treatment Plant' }, type: 'Укрепточка', location: { ru: 'Окрестности Любеча', en: 'Lyubech Outskirts' }, coords: 'H9-4', hour: 19, minute: 0 },
  { name: { ru: 'Лодочное производство', en: 'Boat Factory' }, type: 'Укрепточка', location: { ru: 'Окрестности Любеча', en: 'Lyubech Outskirts' }, coords: 'J5-3', hour: 21, minute: 0 },
  { name: { ru: 'Дорога к д.Выселки', en: 'Road to Vyselki' }, type: 'Укрепточка', location: { ru: 'Окрестности Любеча', en: 'Lyubech Outskirts' }, coords: 'B3-4', hour: 23, minute: 0 },
  { name: { ru: 'д. Конуковка', en: 'Konukovka Village' }, type: 'Укрепточка', location: { ru: 'Аэропорт', en: 'Airport' }, coords: 'A2-2', hour: 18, minute: 30 },
  { name: { ru: 'База отдыха', en: 'Resort' }, type: 'Укрепточка', location: { ru: 'Везувий', en: 'Vesuvius' }, coords: 'F9-2', hour: 9, minute: 0 },
  { name: { ru: 'Железнодорожная станция Хворостовка', en: 'Khvorostovka Railway Station' }, type: 'Укрепточка', location: { ru: 'Везувий', en: 'Vesuvius' }, coords: 'I6-3', hour: 14, minute: 0 },
  { name: { ru: 'Пост ГАИ', en: 'Traffic Police Post' }, type: 'Укрепточка', location: { ru: 'Везувий', en: 'Vesuvius' }, coords: 'C5-2', hour: 18, minute: 0 },
  { name: { ru: 'СНТ Озеро', en: 'Lake Garden Community' }, type: 'Укрепточка', location: { ru: 'Везувий', en: 'Vesuvius' }, coords: 'C4-2', hour: 20, minute: 30 },
  { name: { ru: 'Заброшенное бомбоубежище', en: 'Abandoned Bomb Shelter' }, type: 'Укрепточка', location: { ru: 'Везувий', en: 'Vesuvius' }, coords: 'D10-2', hour: 20, minute: 30 },
  { name: { ru: '66 км', en: '66 km' }, type: 'Укрепточка', location: { ru: 'Везувий', en: 'Vesuvius' }, coords: 'H4-4', hour: 21, minute: 0 },
  { name: { ru: 'Гора сияния - юг', en: 'Shining Mountain - South' }, type: 'Укрепточка', location: { ru: 'Новая Земля о. Южный', en: 'Novaya Zemlya South Island' }, coords: 'C4-3', hour: 15, minute: 0 },
  { name: { ru: 'Гора сияния - восток', en: 'Shining Mountain - East' }, type: 'Укрепточка', location: { ru: 'Новая Земля о. Южный', en: 'Novaya Zemlya South Island' }, coords: 'C4-2', hour: 16, minute: 0 },
  { name: { ru: 'Гора сияния - запад', en: 'Shining Mountain - West' }, type: 'Укрепточка', location: { ru: 'Новая Земля о. Южный', en: 'Novaya Zemlya South Island' }, coords: 'B4-2', hour: 17, minute: 0 },
  { name: { ru: 'Станция', en: 'Station' }, type: 'Укрепточка', location: { ru: 'Новая Земля о. Южный', en: 'Novaya Zemlya South Island' }, coords: 'C3-2', hour: 21, minute: 0 },
  { name: { ru: 'Блокпост Красно', en: 'Krasno Checkpoint' }, type: 'Укрепточка', location: { ru: 'Черный лес', en: 'Black Forest' }, coords: 'N9-2', hour: 13, minute: 0 },
  { name: { ru: 'Рыбацкая хижина', en: "Fisherman's Hut" }, type: 'Укрепточка', location: { ru: 'Черный лес', en: 'Black Forest' }, coords: 'E4-1', hour: 15, minute: 0 },
  { name: { ru: 'Окраина с.Красно', en: 'Krasno Village Outskirts' }, type: 'Укрепточка', location: { ru: 'Черный лес', en: 'Black Forest' }, coords: 'R8-3', hour: 16, minute: 0 },
  { name: { ru: 'Дачный кооператив', en: 'Dacha Cooperative' }, type: 'Укрепточка', location: { ru: 'Черный лес', en: 'Black Forest' }, coords: 'O5-1', hour: 17, minute: 0 },
  { name: { ru: 'Охотничья заимка', en: 'Hunting Lodge' }, type: 'Укрепточка', location: { ru: 'Черный лес', en: 'Black Forest' }, coords: 'N3-1', hour: 21, minute: 0 },
];
