import type { InfoSpoilerContent } from '../components/InfoSpoiler';
import type { Locale } from '../i18n';

// Контент для сворачиваемых блоков-подсказок InfoSpoiler на страницах
// Медведи / Драуги / Сияние / Аномальные прорывы / Таймеры / Клан /
// Учёт лута / Захваты / Калькулятор времени / Достижения.
// Видно всем — и гостям, и авторизованным участникам.
//
// Каждый блок теперь хранится как Record<Locale, InfoSpoilerContent> —
// использование: SOME_SPOILER[locale] (locale берётся из useI18n()).

export const BEARS_SPOILER: Record<Locale, InfoSpoilerContent> = {
  ru: {
    icon: '🐻',
    title: 'Как пользоваться разделом «Медведи»',
    blocks: [
      {
        heading: 'Что это?',
        body: 'Раздел «Медведи» позволяет отслеживать время появления белых медведей в Stay Out. Здесь отображаются все точки спавна, квадраты карты, время последней смерти, оставшееся время до следующего появления и текущий статус таймера. Информация обновляется участниками клана и помогает заранее планировать маршруты фарма.',
      },
      {
        heading: 'Как пользоваться',
        body: [
          '«Сейчас» — отметьте, если медведь был убит только что.',
          '«Исчез» — отметьте, если медведь пропал без убийства.',
          'После обновления система автоматически рассчитывает: время следующего спавна, сколько прошло с момента смерти, оставшееся время до появления и пользователя, который последним обновил информацию.',
          'Белые медведи появляются каждые 35 минут после предыдущего убийства или исчезновения.',
        ],
      },
      {
        heading: 'Цветовая индикация',
        body: [
          '🔵 Синий — до появления медведя ещё достаточно времени.',
          '🟠 Оранжевый — до спавна осталось менее 5 минут. Одновременно включается звуковой сигнал, предупреждающий о скором появлении.',
          '🟢 Зелёный — медведь появился, можно отправляться к точке спавна.',
        ],
      },
      {
        heading: 'Возможности',
        body: [
          'отслеживание всех белых медведей',
          'таймер до следующего спавна',
          'цветовая индикация статуса спавна',
          'звуковое уведомление за 5 минут до появления',
          'история последних убийств',
          'отображение квадратов карты',
          'синхронизация между участниками клана',
        ],
      },
      {
        heading: 'Обновление страницы',
        body: 'Таймеры и статусы обновляются автоматически примерно каждые 20 секунд.',
      },
    ],
  },
  en: {
    icon: '🐻',
    title: 'How to use the "Bears" section',
    blocks: [
      {
        heading: 'What is this?',
        body: 'The "Bears" section tracks when white bears appear in Stay Out. It shows every spawn point, map grid square, the time of the last kill, the time remaining until the next appearance, and the timer\'s current status. The data is updated by clan members and helps plan farming routes ahead of time.',
      },
      {
        heading: 'How to use it',
        body: [
          '"Now" — mark this if the bear was just killed.',
          '"Despawned" — mark this if the bear disappeared without being killed.',
          'After an update, the system automatically calculates: the next spawn time, how much time has passed since the kill, the time remaining until it appears, and who last updated the information.',
          'White bears spawn every 35 minutes after the previous kill or despawn.',
        ],
      },
      {
        heading: 'Color coding',
        body: [
          '🔵 Blue — there is still plenty of time before the bear appears.',
          '🟠 Orange — less than 5 minutes until spawn. A sound alert also triggers to warn you it is coming soon.',
          '🟢 Green — the bear has appeared, you can head to the spawn point.',
        ],
      },
      {
        heading: 'Features',
        body: [
          'tracking every white bear',
          'countdown to the next spawn',
          'color-coded spawn status',
          'sound alert 5 minutes before it appears',
          'recent kill history',
          'map grid square display',
          'sync between clan members',
        ],
      },
      {
        heading: 'Page updates',
        body: 'Timers and statuses refresh automatically about every 20 seconds.',
      },
    ],
  },
};

export const DRAUGS_SPOILER: Record<Locale, InfoSpoilerContent> = {
  ru: {
    icon: '💀',
    title: 'Что такое драуги и как работает таймер',
    blocks: [
      {
        heading: 'Что это?',
        body: 'Раздел «Драуги» позволяет отслеживать время появления драугов в Stay Out. Здесь отображаются все точки спавна, квадраты карты, время последней смерти, оставшееся время до следующего появления и текущий статус таймера. Информация обновляется участниками клана и помогает заранее планировать маршруты фарма.',
      },
      {
        heading: 'Как пользоваться',
        body: [
          '«Сейчас» — отметьте, если драуг был убит только что.',
          '«Исчез» — отметьте, если драуг пропал без убийства.',
          'После обновления система автоматически рассчитывает: время следующего спавна, сколько прошло с момента смерти, оставшееся время до появления и пользователя, который последним обновил информацию.',
          'Драуги появляются каждые 25 минут после предыдущего убийства или исчезновения.',
        ],
      },
      {
        heading: 'Цветовая индикация',
        body: [
          '🔵 Синий — до появления драуга ещё достаточно времени.',
          '🟠 Оранжевый — до спавна осталось менее 5 минут. Одновременно включается звуковой сигнал, предупреждающий о скором появлении.',
          '🟢 Зелёный — драуг появился, можно отправляться к точке спавна.',
        ],
      },
      {
        heading: 'Возможности',
        body: [
          'отслеживание всех драугов',
          'таймер до следующего спавна',
          'цветовая индикация статуса спавна',
          'звуковое уведомление за 5 минут до появления',
          'история последних убийств',
          'отображение квадратов карты',
          'синхронизация между участниками клана',
        ],
      },
      {
        heading: 'Обновление страницы',
        body: 'Таймеры и статусы обновляются автоматически примерно каждые 20 секунд.',
      },
    ],
  },
  en: {
    icon: '💀',
    title: 'What draugs are and how the timer works',
    blocks: [
      {
        heading: 'What is this?',
        body: 'The "Draugs" section tracks when draugs appear in Stay Out. It shows every spawn point, map grid square, the time of the last kill, the time remaining until the next appearance, and the timer\'s current status. The data is updated by clan members and helps plan farming routes ahead of time.',
      },
      {
        heading: 'How to use it',
        body: [
          '"Now" — mark this if the draug was just killed.',
          '"Despawned" — mark this if the draug disappeared without being killed.',
          'After an update, the system automatically calculates: the next spawn time, how much time has passed since the kill, the time remaining until it appears, and who last updated the information.',
          'Draugs spawn every 25 minutes after the previous kill or despawn.',
        ],
      },
      {
        heading: 'Color coding',
        body: [
          '🔵 Blue — there is still plenty of time before the draug appears.',
          '🟠 Orange — less than 5 minutes until spawn. A sound alert also triggers to warn you it is coming soon.',
          '🟢 Green — the draug has appeared, you can head to the spawn point.',
        ],
      },
      {
        heading: 'Features',
        body: [
          'tracking every draug',
          'countdown to the next spawn',
          'color-coded spawn status',
          'sound alert 5 minutes before it appears',
          'recent kill history',
          'map grid square display',
          'sync between clan members',
        ],
      },
      {
        heading: 'Page updates',
        body: 'Timers and statuses refresh automatically about every 20 seconds.',
      },
    ],
  },
};

export const SHINING_SPOILER: Record<Locale, InfoSpoilerContent> = {
  ru: {
    icon: '✨',
    title: 'Как пользоваться разделом «Сияние»',
    blocks: [
      {
        heading: 'Что это?',
        body: 'Раздел «Сияние» показывает расписание появления сияния в Stay Out. Bear Tracker рассчитывает ближайшие циклы, отображает игровое время и помогает заранее подготовиться к событию.',
      },
      {
        heading: 'Как пользоваться',
        body: 'При необходимости любой участник клана может нажать «Установить время», если известно текущее игровое время. После обновления автоматически отображаются: ближайшее сияние, следующие циклы, обратный отсчёт и игровое время.',
      },
      {
        heading: 'Возможности',
        body: [
          'точный таймер сияния',
          'прогноз следующих циклов',
          'отображение игрового времени',
          'синхронизация между участниками клана',
          'звуковое уведомление перед началом события (00:00, 06:00, 12:00 и 18:00 по игровому времени)',
        ],
      },
      {
        heading: 'Обновление страницы',
        body: 'Таймеры и статусы обновляются автоматически примерно каждые 20 секунд.',
      },
    ],
  },
  en: {
    icon: '✨',
    title: 'How to use the "Shining" section',
    blocks: [
      {
        heading: 'What is this?',
        body: 'The "Shining" section shows the schedule for the Shining event in Stay Out. Bear Tracker calculates the upcoming cycles, displays the in-game time, and helps you prepare for the event ahead of time.',
      },
      {
        heading: 'How to use it',
        body: 'If needed, any clan member can click "Set time" if they know the current in-game time. After the update, the following display automatically: the nearest Shining, upcoming cycles, a countdown, and the in-game time.',
      },
      {
        heading: 'Features',
        body: [
          'precise Shining timer',
          'forecast for upcoming cycles',
          'in-game time display',
          'sync between clan members',
          'sound alert before the event starts (00:00, 06:00, 12:00, and 18:00 in-game time)',
        ],
      },
      {
        heading: 'Page updates',
        body: 'Timers and statuses refresh automatically about every 20 seconds.',
      },
    ],
  },
};

export const TIMERS_SPOILER: Record<Locale, InfoSpoilerContent> = {
  ru: {
    icon: '⏱',
    title: 'Как пользоваться разделом «Таймеры»',
    blocks: [
      {
        heading: 'Что это?',
        body: 'Раздел «Таймеры» позволяет создавать персональные таймеры для любых игровых активностей в Stay Out. Используйте их для отслеживания отката квестов, контейнеров, ресурсов, заданий, маршрутов и любых других событий с фиксированным интервалом. Все таймеры сохраняются автоматически и отображают оставшееся время, а также прогноз следующего события.',
      },
      {
        heading: 'Как пользоваться',
        body: [
          'При создании таймера укажите его название и период. После запуска начнётся обратный отсчёт до события.',
          'Доступные действия:',
          '🔄 Обновить — запускает новый отсчёт с тем же периодом одним нажатием.',
          '🔊 Звук — включает или отключает звуковое уведомление для выбранного таймера.',
          '✏️ Редактировать — позволяет изменить название таймера и оставшееся время до события.',
          '⋯ Меню — дополнительные действия, включая удаление таймера.',
        ],
      },
      {
        heading: 'Возможности',
        body: [
          'неограниченное количество персональных таймеров;',
          'автоматический расчёт времени окончания;',
          'прогноз времени следующего события;',
          'звуковые уведомления для каждого таймера отдельно;',
          'быстрое обновление таймера одной кнопкой;',
          'редактирование названия и оставшегося времени;',
          'автоматическое сохранение всех созданных таймеров.',
        ],
      },
      {
        heading: 'Зачем это нужно?',
        body: 'Раздел помогает не держать откаты в голове и не использовать сторонние приложения. Все важные события находятся в одном месте: вы всегда видите, сколько осталось до нужного действия, можете заранее планировать маршрут и получать уведомление точно в момент окончания таймера.',
      },
    ],
  },
  en: {
    icon: '⏱',
    title: 'How to use the "Timers" section',
    blocks: [
      {
        heading: 'What is this?',
        body: 'The "Timers" section lets you create personal timers for any Stay Out activity. Use them to track quest cooldowns, containers, resources, tasks, routes, and any other event with a fixed interval. All timers are saved automatically and show the time remaining as well as a forecast for the next event.',
      },
      {
        heading: 'How to use it',
        body: [
          'When creating a timer, set its name and period. Once started, a countdown to the event begins.',
          'Available actions:',
          '🔄 Refresh — starts a new countdown with the same period in one click.',
          '🔊 Sound — turns the sound alert for that timer on or off.',
          '✏️ Edit — lets you change the timer\'s name and the remaining time until the event.',
          '⋯ Menu — additional actions, including deleting the timer.',
        ],
      },
      {
        heading: 'Features',
        body: [
          'unlimited personal timers;',
          'automatic end-time calculation;',
          'forecast for the next event;',
          'sound alerts set individually per timer;',
          'one-click quick refresh;',
          'editable name and remaining time;',
          'automatic saving of every timer you create.',
        ],
      },
      {
        heading: 'Why use it?',
        body: 'This section helps you stop keeping cooldowns in your head or relying on third-party apps. All the important events live in one place: you always see how much time is left, can plan your route ahead of time, and get notified exactly when a timer finishes.',
      },
    ],
  },
};

export const CLAN_SPOILER: Record<Locale, InfoSpoilerContent> = {
  ru: {
    icon: '👥',
    title: 'Как пользоваться разделом «Клан»',
    blocks: [
      {
        heading: 'Что это?',
        body: 'Раздел «Клан» объединяет участников Bear Tracker для совместной игры в Stay Out. Все данные о медведях, сиянии, учёте лута и общих событиях синхронизируются между членами клана.',
      },
      {
        heading: 'Как пользоваться',
        body: [
          'Передайте код приглашения другим игрокам.',
          'Назначьте заместителей при необходимости.',
          'Управляйте составом клана через список участников.',
          'Все изменения сразу становятся доступны остальным участникам.',
        ],
      },
      {
        heading: 'Возможности',
        body: [
          'создание собственного клана',
          'приглашение игроков по коду',
          'назначение заместителей',
          'управление участниками',
          'общие данные по медведям, сиянию и учёту лута',
        ],
      },
    ],
  },
  en: {
    icon: '👥',
    title: 'How to use the "Clan" section',
    blocks: [
      {
        heading: 'What is this?',
        body: 'The "Clan" section brings Bear Tracker members together for playing Stay Out as a group. All data about bears, the Shining, loot tracking, and shared events syncs between clan members.',
      },
      {
        heading: 'How to use it',
        body: [
          'Share the invite code with other players.',
          'Appoint deputies if needed.',
          'Manage the clan roster through the member list.',
          'Every change becomes available to the rest of the clan instantly.',
        ],
      },
      {
        heading: 'Features',
        body: [
          'create your own clan',
          'invite players with a code',
          'appoint deputies',
          'manage members',
          'shared data for bears, the Shining, and loot tracking',
        ],
      },
    ],
  },
};

export const HEARTS_SPOILER: Record<Locale, InfoSpoilerContent> = {
  ru: {
    icon: '❤️',
    title: 'Как пользоваться учётом лута',
    blocks: [
      {
        heading: 'Что это?',
        body: 'Учёт лута — это инструмент Bear Tracker для игроков Stay Out, который помогает вести общий учёт добычи после охоты на белых медведей. Сервис автоматически рассчитывает долю каждого участника, фиксирует продажи и позволяет контролировать выплаты без ручных вычислений.',
      },
      {
        heading: 'Как пользоваться',
        body: [
          'Каждая строка — это один убитый медведь.',
          '1. Нажмите «Добавить участника».',
          '2. Выберите игрока из списка клана или введите ник вручную.',
          '3. Укажите: ❤️ количество сердец, 🐻 количество шкур, 💵 сумму продажи.',
          'Доля каждого участника рассчитывается автоматически: Сумма продажи ÷ Количество участников.',
        ],
      },
      {
        heading: 'Кто может редактировать запись?',
        body: 'Поля ❤️ Сердца, 🐻 Шкуры, 👥 Участники, 💵 Продали за и 💸 Выплачено участникам может изменять только владелец записи — игрок, чей аккаунт привязан к указанному нику. Это защищает таблицу от случайных или намеренных изменений другими участниками.',
      },
      {
        heading: 'Гостевые участники',
        body: 'Если ник введён вручную и не привязан к аккаунту Bear Tracker, запись остаётся доступной для редактирования всем участникам клана. Это удобно для временных игроков или гостей.',
      },
      {
        heading: 'Возможности',
        body: [
          'автоматический расчёт долей',
          'учёт сердец и шкур',
          'контроль выплат участникам',
          'история добычи',
          'совместная работа клана в Stay Out',
        ],
      },
    ],
  },
  en: {
    icon: '❤️',
    title: 'How to use loot tracking',
    blocks: [
      {
        heading: 'What is this?',
        body: 'Loot tracking is a Bear Tracker tool for Stay Out players that helps keep a shared log of loot after hunting white bears. The service automatically works out each participant\'s share, records sales, and lets you keep track of payouts without doing the math by hand.',
      },
      {
        heading: 'How to use it',
        body: [
          'Each row is one bear kill.',
          '1. Click "Add participant".',
          '2. Pick a player from the clan roster or enter a nickname manually.',
          '3. Enter: ❤️ number of hearts, 🐻 number of pelts, 💵 sale amount.',
          'Each participant\'s share is calculated automatically: Sale amount ÷ Number of participants.',
        ],
      },
      {
        heading: 'Who can edit an entry?',
        body: 'The ❤️ Hearts, 🐻 Pelts, 👥 Participants, 💵 Sold for, and 💸 Paid to participants fields can only be edited by the entry\'s owner — the player whose account is linked to the given nickname. This protects the table from accidental or intentional changes by other members.',
      },
      {
        heading: 'Guest participants',
        body: 'If a nickname is typed in manually and is not linked to a Bear Tracker account, the entry stays editable by every clan member. This is handy for temporary players or guests.',
      },
      {
        heading: 'Features',
        body: [
          'automatic share calculation',
          'heart and pelt tracking',
          'payout tracking for participants',
          'loot history',
          'collaborative clan work in Stay Out',
        ],
      },
    ],
  },
};

export const CAPTURES_SPOILER: Record<Locale, InfoSpoilerContent> = {
  ru: {
    icon: '🚩',
    title: 'Как пользоваться разделом «Захваты»',
    blocks: [
      {
        heading: 'Что это?',
        body: 'Раздел «Захваты» в Bear Tracker показывает актуальное расписание захватов баз и укрепточек в Stay Out. Здесь отображаются название точки, тип объекта, локация, координаты, время до следующего захвата и статус активности. Таймер автоматически обновляется, поэтому вы всегда видите, когда начнётся или закончится захват.',
      },
      {
        heading: 'Расписание захватов Stay Out',
        body: 'Сервис автоматически рассчитывает время до начала и окончания каждого захвата. Если захват уже идёт, отображается оставшееся время до его завершения. Это позволяет заранее подготовиться к событию и не пропустить нужную точку.',
      },
      {
        heading: 'Часовой пояс',
        body: 'Все времена отображаются в часовом поясе вашего устройства. Bear Tracker автоматически определяет локальное время, поэтому игроки из разных стран видят одинаковые события в своём часовом поясе без необходимости выполнять ручной пересчёт.',
      },
      {
        heading: 'Цвета в таблице',
        body: [
          '🔴 Красный — захват идёт прямо сейчас.',
          '🟡 Жёлтый — захват начнётся менее чем через час.',
          '⚪ Без подсветки — до начала захвата осталось больше часа.',
        ],
      },
      {
        heading: 'Избранное и звуковые уведомления',
        body: [
          '⭐ Звезда — добавить в избранное. Избранное автоматически отображается вверху таблицы.',
          '🔊 Значок звука — включает звуковое уведомление о начале захвата. По умолчанию уведомление отключено и настраивается отдельно для каждой точки.',
          'Цвет звезды:',
          '🔵 Синяя — до начала захвата больше часа.',
          '🟡 Жёлтая — до начала захвата осталось меньше часа.',
          '🔴 Красная — захват уже идёт.',
        ],
      },
      {
        heading: 'Возможности',
        body: [
          'расписание захватов баз и укрепточек Stay Out;',
          'обратный отсчёт до начала захвата;',
          'обратный отсчёт до окончания активного захвата;',
          'поиск по названию точки;',
          'поиск по локации;',
          'поиск по координатам;',
          'отображение координат для быстрого поиска на карте;',
          'автоматическая корректировка времени под часовой пояс игрока;',
          'добавление точек в избранное;',
          'звуковые уведомления о начале захвата.',
        ],
      },
      {
        heading: 'Зачем это нужно?',
        body: 'Захваты баз и укрепточек являются одной из важных PvP-активностей в Stay Out. С помощью Bear Tracker можно быстро узнать расписание захватов, заранее спланировать маршрут и вовремя прибыть на нужную точку. Таблица обновляет таймеры автоматически, поэтому информация всегда остаётся актуальной.',
      },
    ],
  },
  en: {
    icon: '🚩',
    title: 'How to use the "Captures" section',
    blocks: [
      {
        heading: 'What is this?',
        body: 'The "Captures" section in Bear Tracker shows the current schedule for base and outpost captures in Stay Out. It displays the point\'s name, object type, location, coordinates, time until the next capture, and its current activity status. The timer refreshes automatically, so you always see when a capture starts or ends.',
      },
      {
        heading: 'Stay Out capture schedule',
        body: 'The service automatically calculates the time until each capture starts and ends. If a capture is already underway, it shows the remaining time until it finishes. This lets you get ready ahead of time and not miss a point you care about.',
      },
      {
        heading: 'Time zone',
        body: 'All times are shown in your device\'s time zone. Bear Tracker automatically detects your local time, so players in different countries see the same events in their own time zone with no manual conversion required.',
      },
      {
        heading: 'Table colors',
        body: [
          '🔴 Red — the capture is happening right now.',
          '🟡 Yellow — the capture starts in less than an hour.',
          '⚪ No highlight — more than an hour left until the capture starts.',
        ],
      },
      {
        heading: 'Favorites and sound alerts',
        body: [
          '⭐ Star — add to favorites. Favorites automatically appear at the top of the table.',
          '🔊 Sound icon — turns on a sound alert for when the capture starts. It is off by default and can be set separately for each point.',
          'Star color:',
          '🔵 Blue — more than an hour until the capture starts.',
          '🟡 Yellow — less than an hour until the capture starts.',
          '🔴 Red — the capture is already underway.',
        ],
      },
      {
        heading: 'Features',
        body: [
          'schedule for Stay Out base and outpost captures;',
          'countdown to the capture starting;',
          'countdown to an active capture ending;',
          'search by point name;',
          'search by location;',
          'search by coordinates;',
          'coordinates shown for quick lookup on the map;',
          'time automatically adjusted to the player\'s time zone;',
          'add points to favorites;',
          'sound alerts when a capture starts.',
        ],
      },
      {
        heading: 'Why use it?',
        body: 'Base and outpost captures are one of the key PvP activities in Stay Out. Bear Tracker lets you quickly check the capture schedule, plan your route ahead of time, and arrive at the right point on time. The table refreshes its timers automatically, so the information always stays current.',
      },
    ],
  },
};

export const TIMECALC_SPOILER: Record<Locale, InfoSpoilerContent> = {
  ru: {
    icon: '🧮',
    title: 'О калькуляторе времени',
    blocks: [
      {
        heading: 'Что это?',
        body: '«Калькулятор времени» — это удобный онлайн-инструмент для расчёта времени. Он позволяет быстро определить разницу между двумя значениями, прибавить или вычесть часы, минуты и секунды, а также выполнять точные вычисления без ручного подсчёта. Калькулятор подходит для работы, учёбы, путешествий, спорта, планирования задач и любых других ситуаций, где требуется быстро рассчитать время.',
      },
      {
        heading: 'Как пользоваться',
        body: 'Введите исходные значения времени или выберите нужный режим расчёта. Укажите часы, минуты и секунды, после чего калькулятор автоматически выполнит вычисления и сразу покажет точный результат.',
      },
      {
        heading: 'Возможности',
        body: [
          'расчёт разницы между двумя значениями времени',
          'сложение и вычитание часов, минут и секунд',
          'мгновенный расчёт без регистрации',
          'удобная работа на компьютере и мобильных устройствах',
          'точные вычисления в режиме онлайн',
        ],
      },
      {
        heading: 'Ищут также',
        body: [
          'калькулятор времени онлайн',
          'рассчитать время',
          'вычислить разницу во времени',
          'прибавить время',
          'вычесть время',
          'калькулятор часов и минут',
          'сколько прошло времени',
          'расчёт времени онлайн',
        ],
      },
    ],
  },
  en: {
    icon: '🧮',
    title: 'About the time calculator',
    blocks: [
      {
        heading: 'What is this?',
        body: 'The "Time Calculator" is a handy online tool for time calculations. It quickly finds the difference between two values, adds or subtracts hours, minutes, and seconds, and performs precise calculations without manual math. It works for work, study, travel, sports, task planning, and any other situation where you need to work out time quickly.',
      },
      {
        heading: 'How to use it',
        body: 'Enter the starting time values or pick the calculation mode you need. Set the hours, minutes, and seconds, and the calculator will run the math automatically and show the exact result right away.',
      },
      {
        heading: 'Features',
        body: [
          'calculate the difference between two time values',
          'add and subtract hours, minutes, and seconds',
          'instant calculation, no account needed',
          'works well on desktop and mobile',
          'precise online calculations',
        ],
      },
      {
        heading: 'People also search for',
        body: [
          'online time calculator',
          'calculate time',
          'work out time difference',
          'add time',
          'subtract time',
          'hours and minutes calculator',
          'how much time has passed',
          'online time calculation',
        ],
      },
    ],
  },
};

export const ANOMALY_SPOILER: Record<Locale, InfoSpoilerContent> = {
  ru: {
    icon: '🥶',
    title: 'Что такое аномальные прорывы и как пользоваться таймером',
    blocks: [
      {
        heading: 'Что это?',
        body: 'Сезонное событие «Аномальные прорывы» проходит во время события «Улёдная жара» и происходит два раза за игровые сутки. Во время активности на нескольких локациях появляются зоны аномальных выбросов, где можно найти больше артефактов, встретить опасных мутантов и получить ценные награды.',
      },
      {
        heading: 'Как пользоваться',
        body: 'Эта страница помогает определить, когда начнётся следующий аномальный прорыв в Stay Out. Нажмите «Установить время» и введите текущее игровое время, которое отображается у вас в игре (Якорь Z). После этого Bear Tracker автоматически рассчитает ближайшие циклы, время до начала события и обратный отсчёт до его окончания.',
      },
      {
        heading: 'Таймер',
        body: 'Таймер учитывает игровые часы и помогает заранее подготовиться к событию, чтобы успеть добраться до нужной локации до начала прорыва. При желании можно включить звуковое уведомление, которое сработает в момент начала окна подготовки.',
      },
      {
        heading: 'Расписание (по игровому времени)',
        body: [
          '🟠 Оранжевая рамка (подготовка): 07:30–07:50 и 19:30–19:50.',
          '🟢 Зелёная рамка (аномальный прорыв): 07:50–10:00 и 19:50–22:00.',
          'Остальное игровое время — ожидание следующего цикла.',
          '🔊 07:30 и 19:30 — звучит сигнал, начинается этап подготовки.',
        ],
      },
      {
        heading: 'Особенности',
        body: 'Раздел работает независимо от страницы «Гора Сияния» и использует собственный игровой якорь времени.',
      },
    ],
  },
  en: {
    icon: '🥶',
    title: 'What anomaly breaches are and how to use the timer',
    blocks: [
      {
        heading: 'What is this?',
        body: 'The seasonal "Anomaly Breaches" event runs during the "Ice Heat" event and happens twice per in-game day. During the activity, anomalous surge zones appear at several locations, where you can find more artifacts, run into dangerous mutants, and earn valuable rewards.',
      },
      {
        heading: 'How to use it',
        body: 'This page helps you work out when the next anomaly breach starts in Stay Out. Click "Set time" and enter the current in-game time shown in your game (the Z anchor). Bear Tracker will then automatically calculate the upcoming cycles, the time until the event starts, and a countdown until it ends.',
      },
      {
        heading: 'Timer',
        body: 'The timer accounts for in-game hours and helps you prepare for the event ahead of time so you can reach the right location before the breach starts. You can optionally turn on a sound alert that triggers right when the preparation window begins.',
      },
      {
        heading: 'Schedule (in-game time)',
        body: [
          '🟠 Orange border (preparation): 07:30–07:50 and 19:30–19:50.',
          '🟢 Green border (anomaly breach): 07:50–10:00 and 19:50–22:00.',
          'The rest of the in-game time is waiting for the next cycle.',
          '🔊 07:30 and 19:30 — a sound alert plays, the preparation phase begins.',
        ],
      },
      {
        heading: 'Notes',
        body: 'This section works independently from the "Shining Mountain" page and uses its own in-game time anchor.',
      },
    ],
  },
};

export const ACHIEVEMENTS_SPOILER: Record<Locale, InfoSpoilerContent> = {
  ru: {
    icon: 'ℹ️',
    title: 'Справка по достижениям',
    blocks: [
      {
        heading: 'Что это?',
        body: 'Раздел «Достижения» в Bear Tracker помогает отслеживать прогресс получения достижений в Stay Out. Здесь собраны все доступные достижения, их описание, требования для получения и информация о наградах. С помощью поиска можно быстро найти нужную ачивку и узнать, что необходимо выполнить.',
      },
      {
        heading: 'Достижения Stay Out',
        body: 'Каждое достижение содержит название, описание условий получения и доступную награду. Это позволяет заранее планировать развитие персонажа и выбирать, какие достижения выполнить в первую очередь.',
      },
      {
        heading: 'Возможности',
        body: [
          'полный список достижений Stay Out',
          'поиск по названию достижения',
          'описание условий получения',
          'отображение наград за достижение',
          'быстрый поиск нужной ачивки',
          'удобная навигация по всем достижениям',
        ],
      },
      {
        heading: 'Для чего это нужно?',
        body: 'Если вы хотите закрыть все достижения или найти определённую награду, Bear Tracker позволяет сделать это значительно быстрее. Вместо поиска информации на форумах все достижения Stay Out собраны в одном месте с удобным поиском и актуальными описаниями.',
      },
    ],
  },
  en: {
    icon: 'ℹ️',
    title: 'Achievements help',
    blocks: [
      {
        heading: 'What is this?',
        body: 'The "Achievements" section in Bear Tracker helps you track your Stay Out achievement progress. It gathers every available achievement, its description, the requirements to unlock it, and reward information. Search lets you quickly find the achievement you need and see what to do to complete it.',
      },
      {
        heading: 'Stay Out achievements',
        body: 'Each achievement lists its name, a description of how to unlock it, and its reward. This lets you plan your character\'s progression ahead of time and choose which achievements to go after first.',
      },
      {
        heading: 'Features',
        body: [
          'a complete list of Stay Out achievements',
          'search by achievement name',
          'description of the unlock conditions',
          'reward display for each achievement',
          'quick search for a specific achievement',
          'easy navigation through all achievements',
        ],
      },
      {
        heading: 'Why use it?',
        body: 'If you want to unlock every achievement or find a specific reward, Bear Tracker makes it much faster. Instead of digging through forums, every Stay Out achievement is gathered in one place with convenient search and up-to-date descriptions.',
      },
    ],
  },
};
