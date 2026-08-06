# Bear Tracker

Инструмент учёта и трекинга для клана в игре Stay Out: тайминги
респаунов (медведи, драуги), Гора Сияния, Аномальные прорывы, учёт
лута, личные таймеры, достижения, захваты локаций, управление кланом.

Этот файл описывает **текущую архитектуру** после полного переноса с
плоской структуры (`pages/`, монолитный `App.jsx`, роуты вперемешку с
SQL) на слоистую. История самого переноса — в `ARCHITECTURE.md`, этот
README — про то, как проект устроен сейчас и как в нём работать.

## Стек

**Frontend:** React 18 + Vite + `react-router-dom` + Zustand + TypeScript
(частично — новый код на TS, старый на JS сосуществует через
`allowJs`) + ESLint.

**Backend:** Node.js + Express + Socket.IO + PostgreSQL (`pg`,
`node-pg-migrate`) + JWT (`jsonwebtoken`) + `bcryptjs` + TypeScript
(только типы, рантайм на JS) + ESLint.

**Деплой:** frontend — Vercel, backend — Render, база — Neon Postgres.

---

## Структура репозитория

```
.
├── ARCHITECTURE.md          # хронология переноса на новую архитектуру
├── README.md                 # этот файл
├── frontend/
│   └── src/
│       ├── app/               # точка входа: App.jsx, карта маршрутов
│       ├── features/          # доменные модули — см. ниже
│       ├── components/        # общие компоненты, знающие о продукте
│       ├── ui/                 # "глупый" UI-кит (Button, Modal...)
│       ├── stores/             # общая инфраструктура Zustand-сторов
│       ├── hooks/               # переиспользуемые хуки без привязки к фиче
│       ├── lib/                  # обёртки над внешним миром (пока пусто)
│       ├── services/              # кросс-доменные сервисы (пока пусто)
│       ├── types/                   # общие TypeScript-типы
│       ├── utils/                    # чистые функции без побочных эффектов
│       └── content/                   # статичный контент (спойлеры, ачивки)
└── backend/
    └── src/
        ├── routes/            # HTTP-маршруты — тонкий слой
        ├── controllers/        # req/res, вызывают services
        ├── services/            # бизнес-логика
        ├── repositories/         # единственный слой с SQL
        ├── sockets/               # socket.io: auth + обработчики событий
        ├── middleware/             # auth, superadmin
        ├── db/                      # pool.js, schema.js, migrations/
        └── types/                    # express.d.ts
```

---

## Frontend

### `features/<domain>/` — доменные модули

Каждый раздел приложения — папка с собственной страницей и (где нужно)
собственным Zustand-стором:

| Папка | Что внутри | Стор |
|---|---|---|
| `tracker/` | Bears + Draugs — **общий движок** вместо двух копий: `trackerConfig.ts` (конфиг на вид существа), `createTrackerStore.ts` (фабрика стора), `TrackerPage.jsx` + `components/` (общий Row/Modal), `BearsPage.jsx`/`DraugsPage.jsx` — тонкие обёртки | `useBearsStore`, `useDraugsStore` |
| `clan/` | Управление кланом (участники, баны, лидерство) | `useClanStore`, `useMembersStore`, `useBansStore` |
| `hearts/` | Учёт добычи рейда | — (сама грузит свои данные) |
| `timers/` | Личные таймеры | — |
| `shining/` | Гора Сияния | `useShiningStore` |
| `anomaly/` | Аномальные прорывы | `useAnomalyStore` |
| `captures/` | Захваты локаций (справочная таблица) | — |
| `achievements/` | Достижения | — |
| `admin/` | Панель суперадмина | — |
| `auth/` | Вход/регистрация | — |
| `profile/` | Профиль аккаунта | — |
| `promo/` | Промокоды | — |
| `public/` | Публичные/SEO-страницы: лендинг, FAQ, уровни, калькулятор времени | — |

Стор заводится **только когда он решает конкретную проблему** — либо
устраняет дублирование (tracker), либо это данные, которыми реально
владеет `app/App.jsx` (clan/shining/anomaly). Для hearts/timers/captures
и прочих самодостаточных страниц стор не заводили — они как получали
данные и коллбэки пропсами, так и получают, без лишней прослойки.

### `app/`

- `App.jsx` — корневой компонент. Роутинг — ручной вывод раздела из
  `location.pathname` (не переписывали на декларативные `<Routes>` —
  старый паттерн и так рабочий).
- `routes.ts` — `APP_PAGES` (все разделы) и `GUEST_PREVIEW_PAGES`
  (какие разделы гость может открыть в режиме превью).
- В `App.jsx` из `useState` остаются: `user`, `token`, `showAuth`,
  `menuOpen`, `loading`, `connectionError`, `heartsReloader` — это
  либо auth-флоу, либо чисто UI-стейт уровня приложения, либо особый
  паттерн регистрации коллбэка (heartsReloader). `clan`/`members`/
  `bans`/`shiningData`/`anomalyData`/`bears`/`draugs` — уже в сторах.

### `stores/`

`createValueStore.ts` — общая фабрика "стор на одно значение целиком"
(clan, shining, anomaly — то, что раньше жило в `App.jsx` как
`useState(null)`/`useState([])` и менялось только целиком, без точечных
патчей по id). Отличается от `tracker`'а `createTrackerStore` — там
нужно было патчить один элемент массива по индексу (обновление одного
медведя по сокету), здесь — просто "заменить всё" или "сбросить".

### `ui/`, `components/`, `hooks/`, `lib/`, `services/`

Каркас подготовлен под будущий рост:
- `ui/` — для компонентов, вообще не знающих о домене (сейчас такие уже
  есть в `components/` — миграция самих компонентов из `components/` в
  `ui/` не проводилась, это не входило в задачу переноса страниц).
- `lib/`, `services/` — пока пустые: `utils/api.js`, `hooks/useSocket.js`
  и подобное продолжают жить на старых местах, поскольку от них зависят
  несколько уже перенесённых фич — переносить их означало бы трогать
  работающий код без конкретной причины.

### Типы

`types/entities.ts`, `types/api.ts` — зеркалят реальную схему БД и
формат ответов `utils/api.js` на момент написания. Новый код на TS,
существующие `.jsx`-страницы не конвертировались (`allowJs: true` в
`tsconfig.json` — јS и TS сосуществуют).

---

## Backend

### Слои

```
routes/  →  controllers/  →  services/  →  repositories/  →  db/
```

- **`routes/*.js`** — только объявление HTTP-маршрутов, монтируют
  `auth`/`superadmin` middleware и метод контроллера. Каждый роут —
  10–20 строк.
- **`controllers/*.controller.js`** — разбор `req`/`res`. Общая обвязка
  `try/catch → 500` вынесена в `controllers/asyncHandler.js` (`wrap()`),
  использует её каждый контроллер, кроме `tracker.controller.js` (у
  него своя фабрика `makeController(config)`, т.к. один контроллер
  обслуживает и bears, и draugs).
- **`services/*.service.js`** — бизнес-логика: валидация, права
  доступа, расчёты, `socket.emit`. Ничего не знает о `req`/`res` —
  принимает `req` только чтобы прочитать `params`/`body`/`user`/`getIo()`,
  возвращает `{ status, body }`.
- **`repositories/*.repository.js`** — единственный слой с SQL.

### Роуты и что за ними стоит

| Роут | Слой bears/draugs общий? | Особенности |
|---|---|---|
| `bears`, `draugs` | Да — `tracker.*` файлы, конфиг-driven | Общий движок вместо двух копий |
| `clans` | — | Самый большой (11 эндпоинтов): create/join/leave/me/kick/ban/unban/transfer/deputy/rename/refresh-code |
| `auth` | — | register/login/me/profile/delete-account. `deleteAccountTx` — вся транзакция удаления аккаунта одной функцией |
| `hearts` | — | Динамический `UPDATE` через `repo.updateFields(fields)`; право редактировать строку — только владелец привязанного аккаунта, либо любой участник клана для "гостевых" строк |
| `timers` | — | Самая нетривиальная логика: `remaining_seconds` ⟷ `period_seconds` |
| `shining`, `anomaly` | Похожий паттерн (dual anchorRealMs/anchorIso), но shining — per-clan (с socket-эмитом), anomaly — per-account (без эмита) | — |
| `admin` | — | `middleware/superadmin.js` — общий guard, вынесен из роута |

### `sockets/`

- `socketAuth.js` — `io.use(...)`: проверка JWT, подгрузка юзера.
- `handlers/connection.js` — `connection`/`join:clan`/`leave:clan`/
  `disconnect`.
- `index.js` → `attachSockets(io)` — единая точка подключения обоих к
  инстансу `io`. `backend/src/index.js` (корневой) вызывает её вместо
  ~50 строк инлайновой socket-логики.

### `db/`

- `pool.js` — подключение к Postgres (без изменений).
- `schema.js` — исходная функция `initSchema()`, всё ещё вызывается при
  старте сервера (идемпотентна, `CREATE TABLE IF NOT EXISTS`).
- `migrations/0001_init.js` — точное зеркало `schema.js` в формате
  `node-pg-migrate`, безопасно для уже проинициализированной БД.
  Дальнейшие изменения схемы — новые файлы миграций
  (`npm run migrate:create -- <name>`), а не правки `schema.js`.

---

## Как запускать

```bash
# Frontend
cd frontend
npm install
npm run dev         # локальный сервер разработки
npm run build        # прод-сборка
npm run typecheck     # tsc --noEmit
npm run lint           # eslint

# Backend
cd backend
npm install
npm run dev           # nodemon
npm run typecheck      # tsc --noEmit (проверяет только .ts-файлы, напр. express.d.ts)
npm run lint             # eslint
npm run migrate           # применить миграции БД (нужен настоящий DATABASE_URL)
npm run migrate:create -- <name>   # создать новый файл миграции
```

`.env` (backend) — см. `.env.example`: `DATABASE_URL`, `JWT_SECRET`,
`FRONTEND_URL`, `PORT`, `NODE_ENV`.

---

## Принципы, которых придерживались при переносе

Это не абстрактные правила, а то, что реально применялось на каждом шаге:

1. **Стор заводится только когда решает конкретную проблему.**
   Дублирование (tracker) или реальное владение данными на уровне
   `App.jsx` (clan/shining/anomaly) — да. "Просто чтобы было
   единообразно" — нет (hearts/timers/captures и другие самодостаточные
   страницы обошлись без стора).
2. **Общий код выносится, когда дублирование появляется во второй раз,
   не раньше.** `controllers/asyncHandler.js` вынесен только после
   того, как `wrap()` продублировался в clan- и auth-контроллерах —
   не «на будущее», а по факту.
3. **Существующие баги не исправлялись по пути**, только фиксировались
   (см. ниже) — перенос архитектуры и починка багов это разные задачи.
4. **Каждый шаг проверялся** — `typecheck`/`build`/`lint` на фронте,
   `typecheck`/`lint`/`node --check` + smoke-тест с замоканной БД на
   бэкенде (реальной БД в песочнице нет). Пять шагов на фронте
   подтверждены **побитово идентичным** билдом относительно шага до
   них — доказательство, что поведение не менялось буквально ни на бит.

## Известные существующие проблемы

Найдены при переносе, не исправлялись — не входило в задачу:

- ~~`features/admin/AdminPage.jsx` и `components/BearCard.jsx` импортируют
  `formatTime`/`getTimeLeft` из `utils/bears.js`, которых там нет~~ —
  **устранено.** `AdminPage.tsx` перенесён на TS без этого импорта.
  `BearCard.jsx` был мёртвым, нигде не используемым компонентом (отрисовку
  строки медведя/драуга полностью взял на себя `TrackerRow.tsx`) — удалён
  при завершении миграции, а не переведён в `.tsx`, чтобы не тащить в
  типизированный код заведомо неиспользуемый и нерабочий файл.
- `utils/sound.js` и `utils/soundPrefs.js` — пустые `catch`-блоки.
- `repositories/timers.repository.js` → `reorderTimers` — `BEGIN`/
  `COMMIT`/`ROLLBACK` идут через `pool.query(...)` без выделенного
  `client`, то есть транзакция не атомарна на самом деле.
- `repositories/admin.repository.js` → `deleteClanCascade` — то же
  самое: два запроса подряд без транзакции.

## Куда двигаться дальше (не обязательно, на будущее)

- Перевести `ClanPage`/`HeartsPage`/`ShiningPage`/`AnomalyPage`/
  `BearsPage`/`DraugsPage` на прямое чтение из стора вместо пропсов от
  `App` — устранить последнюю прокидку через корневой компонент.
- Перенести `utils/api.js` → `lib/apiClient.ts`, `hooks/useSocket.js` →
  `lib/socketClient.ts` — сейчас не сделано, поскольку от них зависят
  уже перенесённые фичи и трогать их без конкретной причины не стали.
- Собственно исправить баги из списка выше, если понадобится.
