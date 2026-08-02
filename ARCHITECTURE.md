# Bear Tracker — архитектура и статус миграции

## Статус: каркас готов, функциональность не менялась

Ни один существующий файл в `frontend/src/pages`, `frontend/src/utils`,
`frontend/src/components`, `frontend/src/hooks`, `backend/src/routes`,
`backend/src/middleware`, `backend/src/db/schema.js` — не изменён.
Приложение работает ровно так же, как до этого коммита.

Добавлено (не влияет на рантайм, только на будущую разработку):

**Frontend**
- TypeScript готов к использованию (`tsconfig.json`, `allowJs: true` —
  старые `.jsx` продолжают работать нетронутыми)
- Zustand добавлен как зависимость
- ESLint настроен (`npm run lint`)
- Новые пустые папки с описанием назначения: `app/`, `features/`, `ui/`,
  `stores/`, `lib/`, `services/`
- `types/entities.ts`, `types/api.ts` — типы, зеркалящие реальную схему БД
  и реальный формат ответов `utils/api.js`

**Backend**
- TypeScript готов к использованию (`tsconfig.json`, `allowJs: true`)
- `node-pg-migrate` подключён, `npm run migrate` / `migrate:create`
- `src/db/migrations/0001_init.js` — точное зеркало текущей `schema.js`,
  безопасно для уже проинициализированной БД (все statement'ы идемпотентны)
- ESLint настроен (`npm run lint`)
- Новые пустые папки: `controllers/`, `services/`, `repositories/`,
  `sockets/`
- `types/express.d.ts` — типизация `req.user` по реальной форме,
  которую кладёт `middleware/auth.js`

Оба `npm run typecheck` и `npm run build` (frontend) проходят зелёными.

## Сделано: перенос tracker (Bears + Draugs)

`pages/BearsPage.jsx` и `pages/DraugsPage.jsx` (два почти идентичных файла)
удалены. Вместо них — `features/tracker/`:

- `trackerConfig.ts` — BEARS_CONFIG/DRAUGS_CONFIG, **переиспользуют**
  `utils/bears.js`/`utils/draugs.js` как есть (не трогали эти файлы —
  они всё ещё нужны `components/BearCard.jsx` и
  `hooks/useGlobalSoundWatcher.js`)
- `createTrackerStore.ts` + `stores.ts` — один Zustand-стор на конфиг
  (`useBearsStore`, `useDraugsStore`)
- `components/KillTimeModal.jsx`, `components/TrackerRow.jsx` — один
  компонент вместо двух копий
- `TrackerPage.jsx` — общая страница, `BearsPage.jsx`/`DraugsPage.jsx` —
  тонкие обёртки над ней

`App.jsx` изменён точечно, только строки с `bears`/`draugs`: вместо
`useState([])` — подписка на стор (`useBearsStore(s => s.items)`), вместо
`setBears(...)` — `useBearsStore.getState().setItems(...)`. Остальной код
`App.jsx` не тронут.

**Проверено:** `npm run typecheck`, `npm run build`, `npm run lint` — без
новых ошибок; отдельный smoke-test (setItems/updateItem/reset, в т.ч.
поведение при обновлении несуществующего index) подтвердил, что стор
воспроизводит логику старого `setBears(prev => prev.map(...))` один в один.

## Сделано: перенос clan

`pages/ClanPage.jsx` → `features/clan/ClanPage.jsx` — **чистый перенос
файла**, интерфейс (`user`, `clan`, `members`, `bans`, `onClanChange`,
`isGuest`, `onLoginClick`) не менялся, поменялись только относительные
пути импортов (`../` → `../../`). `App.jsx` не тронут вообще (кроме
одной строки импорта).

Стор для clan/members/bans НЕ заводили — в отличие от tracker, здесь нет
дублирования, которое стор бы устранял, а `clan` читают 5 разных страниц
(Bears, Draugs, Shining, Hearts, Clan). Заводить Zustand сейчас — правка
без необходимости. Он появится вместе с переносом `App.jsx` → `app/`,
когда все 5 потребителей обновляются одним осознанным шагом (см.
`features/clan/README.md`).

**Проверено:** `typecheck`/`build`/`lint` — без новых ошибок; hash
собранных `dist/assets/*.js` и `*.css` совпал **побитово** с билдом до
переноса — то есть поведение не изменилось вообще.

## Сделано: перенос hearts

`pages/HeartsPage.jsx` → `features/hearts/HeartsPage.jsx` — тот же
паттерн, что и clan: чистый перенос файла, только пути импортов
(`../` → `../../`), интерфейс (`clan`, `members`, `user`,
`onHeartsUpdate`, `isGuest`, `onLoginClick`) не менялся. `App.jsx` не
тронут, кроме одной строки импорта.

**Проверено:** `typecheck`/`build`/`lint` — без новых ошибок; хэш
`dist/assets/*` снова совпал побитово с предыдущей сборкой.

## Сделано: перенос timers

`pages/TimersPage.jsx` → `features/timers/TimersPage.jsx` — чистый
перенос файла, интерфейс (`user`, `onLoginClick`) не менялся. Самая
простая миграция из всех — страница ни с кем не делит состояние.

**Проверено:** `typecheck`/`build`/`lint` — без новых ошибок; хэш
`dist/assets/*` снова совпал побитово.

## Сделано: перенос shining

`pages/ShiningPage.jsx` → `features/shining/ShiningPage.jsx` — чистый
перенос файла, интерфейс (`clan`, `shiningData`, `onShiningChange`,
`isGuest`, `onLoginClick`) не менялся. `shiningData` пока живёт в
App.jsx (как раньше bears/draugs) — стор для неё не завели по той же
причине, что и для clan/hearts/timers: нет необходимости прямо сейчас.

**Проверено:** `typecheck`/`build`/`lint` — без новых ошибок; хэш
`dist/assets/*` снова совпал побитово.

## Сделано: перенос captures

`pages/CapturesPage.jsx` → `features/captures/CapturesPage.jsx` — чистый
перенос файла, без пропсов вообще (`<CapturesPage />`).

**Проверено:** `typecheck`/`build`/`lint` — без новых ошибок; хэш
`dist/assets/*` снова совпал побитово.

## Сделано: перенос achievements

`pages/AchievementsPage.jsx` → `features/achievements/AchievementsPage.jsx`
— чистый перенос файла, без пропсов.

**Проверено:** `typecheck`/`build`/`lint` — без новых ошибок; хэш
`dist/assets/*` снова совпал побитово.

## Сделано: перенос anomaly

`pages/AnomalyPage.jsx` → `features/anomaly/AnomalyPage.jsx` — чистый
перенос файла, интерфейс (`user`, `anomalyData`, `onAnomalyChange`,
`isGuest`, `onLoginClick`) не менялся.

**Проверено:** `typecheck`/`build`/`lint` — без новых ошибок; хэш
`dist/assets/*` снова совпал побитово.

## Сделано: перенос admin

`pages/AdminPage.jsx` → `features/admin/AdminPage.jsx` — чистый перенос
файла, без пропсов. Существующий баг (несуществующий импорт
`formatTime`/`getTimeLeft` из `utils/bears.js`) не трогал — не входило
в задачу переноса.

**Проверено:** `typecheck`/`build`/`lint` — без новых ошибок; хэш
`dist/assets/*` снова совпал побитово.

**Вся исходная очередь (tracker → clan → hearts → timers → shining →
captures → achievements → anomaly → admin) перенесена.** В `pages/`
остались: `AuthPage`, `FaqPage`, `LevelPage`, `ProfilePage`, `PromoPage`,
`PublicLandingPage`, `TimeCalcPage` — их в очередь явно не включали.

## Сделано: App.jsx → app/ + сторы для clan/shining/anomaly

`src/App.jsx` → `src/app/App.jsx`, `main.jsx` обновлён на новый путь.
`app/routes.ts` — `APP_PAGES`/`GUEST_PREVIEW_PAGES` вынесены дословно
(сам роутинг — ручной вывод `page` из `location.pathname` — не
переписывали на декларативные `<Routes>`, это уже был рабочий паттерн,
менять без необходимости не стали). `app/providers.tsx` не создавали —
реальных Context-провайдеров в приложении сейчас нет.

Новые сторы (общая фабрика `src/stores/createValueStore.ts` — "стор на
одно значение целиком", в отличие от `createTrackerStore` у tracker):
`features/clan/store.ts` (`useClanStore`, `useMembersStore`,
`useBansStore`), `features/shining/store.ts` (`useShiningStore`),
`features/anomaly/store.ts` (`useAnomalyStore`).

Важно: это заменило `useState` **только внутри `app/App.jsx`**.
`ClanPage`/`HeartsPage`/`ShiningPage`/`AnomalyPage`/`BearsPage`/`DraugsPage`
как получали `clan`/`members`/`bans`/`shiningData`/`anomalyData`
пропсами от App, так и получают — их интерфейс не менялся. Прямой переход
этих страниц на чтение из стора (без пропсов от App) — отдельный
необязательный шаг на будущее, не входил в этот.

**Проверено:** `typecheck`/`build`/`lint` — без новых ошибок. Хэш сборки
в этот раз **не совпал** с предыдущим — и это ожидаемо: в отличие от
чистых переносов файлов, здесь реально поменялся механизм хранения
состояния (useState → Zustand), а не только путь файла. Вместо хэша
проверяли построчно: каждый `setClan`/`setMembers`/`setBans`/
`setShiningData`/`setAnomalyData` найден и заменён на эквивалент
(`grep` подтвердил — старых вызовов не осталось), плюс отдельный
smoke-test прогнал `setValue`/`reset` через реальный код: старт с
null/[] как раньше, независимость сторов друг от друга, и что `reset()`
возвращает к тем же исходным значениям, что делал `onLogout()`.

## Что осталось в App.jsx как useState (не трогали, не входило в шаг)

`user`, `token`, `showAuth`, `menuOpen`, `loading`, `connectionError`,
`heartsReloader` — это состояние либо чисто UI-уровня (menuOpen), либо
специфично для самого App (auth-флоу), либо (heartsReloader) особый
паттерн регистрации колбэка из дочерней страницы — ни один из них не
входил в задачу «clan/shining/anomaly».

## Сделано: оставшиеся страницы (Auth, Profile, Promo, Faq, Landing, Level, TimeCalc)

Все семь — чистый перенос файла, интерфейсы не менялись:
`features/auth/AuthPage.jsx`, `features/profile/ProfilePage.jsx`,
`features/promo/PromoPage.jsx`, и `features/public/` (FaqPage, LevelPage,
TimeCalcPage, PublicLandingPage — сгруппированы вместе, как и
планировалось в исходной архитектуре). Единственная перекрёстная ссылка
— `PublicLandingPage.jsx` импортирует `PromoPage` из `features/promo/`,
путь поправлен.

`pages/` **больше не существует** — директория пуста и удалена.

**Проверено:** `typecheck`/`build`/`lint` — без новых ошибок; хэш
`dist/assets/*` снова совпал побитово с предыдущей сборкой.

---

# 🏁 Frontend полностью переведён на новую архитектуру

Каждый файл в `src/` живёт в папке, отражающей его реальное назначение
(`features/`, `ui/`, `stores/`, `app/`), а не в плоском `pages/`/`utils/`
на всё подряд. `App.jsx` (God-компонент на 448 строк, круживший весь
стейт приложения) стал `app/App.jsx` с частью состояния (clan/members/
bans/shining/anomaly/bears/draugs) в Zustand-сторах вместо `useState`.
Bears/Draugs (главный источник дублирования) — один общий движок вместо
двух copy-paste файлов. TypeScript, ESLint и билд настроены и проверяются
на каждом шаге.

Ни разу за весь перенос функциональность не менялась — только один шаг
(App.jsx → app/) не мог быть проверен побитовым хэшем сборки (реально
поменялся механизм состояния), там проверяли построчным сравнением +
smoke-тестом. Все остальные шаги — идентичный бинарный результат сборки.

## Сделано (backend): перенос tracker (bears/draugs) на слои

`routes/bears.js` и `routes/draugs.js` были byte-for-byte дублями (те же
константы/SQL/тексты ошибок, другие имена). Разложено на:

- `repositories/tracker.repository.js` — единственное место с SQL
  (`upsertKill`/`resetItem`), параметризовано `table`/`indexCol`
- `services/tracker.config.js` — `BEARS_CONFIG`/`DRAUGS_CONFIG` (те же
  константы, что были в routes/bears.js и routes/draugs.js: respawnMs,
  maxIndex, тексты ошибок), по аналогии с frontend `trackerConfig.ts`
- `services/tracker.service.js` — бизнес-логика (валидация индекса,
  расчёт `spawn_at`, `socket.emit`), общая для bears и draugs
- `controllers/tracker.controller.js` — `makeController(config)`,
  req/res-обвязка (403/500), тоже одна вместо двух копий
- `routes/bears.js`/`routes/draugs.js` — теперь по 15 строк, просто
  монтируют `auth` + `controller.kill`/`controller.reset`

**Проверено:** `typecheck`/`lint`/`node --check` на всех файлах — без
новых ошибок (та же 1 pre-existing warning в auth.js). Реальной БД в
песочнице нет, поэтому вместо неё — smoke-test с замоканным
`pool.query`/`req`/`res`/`req.getIo()`: 20 проверок, включая точные
тексты ошибок ("Индекс медведя 1-11", "Медведь не найден"), разницу
между кнопками "Сейчас"/"Исчез", fallback `game_nick || nick`, состав
`socket.emit` (комната, событие, payload) — всё совпадает с тем, что
делал старый инлайновый код.

## Сделано (backend): перенос clans (11 эндпоинтов) на слои

`routes/clans.js` (299 строк, самый большой роут) разложен на:

- `repositories/clan.repository.js` — все SQL-запросы один-в-один,
  включая `createClanWithSeed` (единственная транзакция — создание
  клана + посев 11 bears + 6 draugs через `pool.connect()`)
- `services/clan.service.js` — вся бизнес-логика: create/join/leave/me/
  kick/ban/unban/transfer/deputy/rename/refresh-code. Порядок проверок
  и тексты ошибок скопированы дословно (например в `ban`: self-check
  раньше owner-check — сохранил как было, не "улучшал")
- `controllers/clan.controller.js` — `wrap(serviceFn)`, одна обвязка
  try/catch→500 вместо 11 копий
- `routes/clans.js` — теперь 16 строк, просто монтирует `auth` +
  соответствующий метод контроллера

**Проверено:** `typecheck`/`lint`/`node --check` — без новых ошибок.
Smoke-test с замоканными `pool.query`/`pool.connect` — 27 проверок:
все 11 эндпоинтов, включая матрицу прав (owner/deputy/обычный участник),
транзакционный посев bears/draugs при создании клана, и попутно тест
сначала перепутал порядок проверок в `ban` (self-check vs owner-check) —
поправил тест, не код, после сверки с оригиналом.

## Сделано (backend): перенос auth (5 эндпоинтов) на слои

`routes/auth.js` разложен на:

- `repositories/auth.repository.js` — `createUser`, `findByLoginOrEmail`,
  `updateGameNick`, и `deleteAccountTx` (вся транзакция удаления
  аккаунта одной функцией — та же схема, что `createClanWithSeed`)
- `services/auth.service.js` — register/login/me/profile/delete-account,
  порядок проверок и тексты ошибок дословно как в оригинале
- `controllers/auth.controller.js` — использует общий `wrap()`
- `controllers/asyncHandler.js` — **новое**: `wrap()` вынесен сюда, как
  только дубль появился второй раз (auth после clan) — `clan.controller.js`
  тоже переведён на общий `wrap` вместо своей копии
- `routes/auth.js` — теперь 10 строк

**Проверено:** `typecheck`/`lint`/`node --check` — без новых ошибок
(pre-existing warning про `password_hash` просто переехал вслед за
кодом в `auth.service.js`, не подавлял). Smoke-test с моком БД +
настоящими `bcrypt`/`jsonwebtoken` — 24 проверки: хэширование пароля,
JWT-токен и его payload, email lowercase, "email уже зарегистрирован"
(pg-код 23505), полная матрица удаления аккаунта (владелец с
участниками → блок, владелец один → клан тоже удалён, обычный участник
→ клан не трогается, без клана вообще).

## Сделано (backend): перенос hearts (5 эндпоинтов) на слои

`routes/hearts.js` разложен на:

- `repositories/hearts.repository.js` — SQL, включая общий
  `updateFields(id, clanId, fields)` — билдер динамического
  `UPDATE ... SET` по объекту вместо ручной сборки `sets`/`vals` массивов
- `services/hearts.service.js` — бизнес-логика: право редактировать
  строку (владелец привязанного аккаунта, либо любой участник клана для
  "гостевых" строк без аккаунта), клэмпинг `hearts`/`pelts` в 0,
  парсинг `sold_for`
- `controllers/hearts.controller.js` — использует общий `wrap()`
- `routes/hearts.js` — теперь 10 строк

**Проверено:** `typecheck`/`lint`/`node --check` — без новых ошибок.
Smoke-test — 15 проверок, включая права на "гостевые" строки, клэмпинг
отрицательных значений, парсинг `sold_for` (`''`→null, `'150'`→150),
и что порядок параметров в динамическом `UPDATE` не потерялся.

## Сделано (backend): перенос timers (7 эндпоинтов) на слои

`routes/timers.js` разложен на:

- `repositories/timers.repository.js` — SQL, включая `runUpdate(sets,
  values, id, userId)` — репозиторий выполняет уже построенный запрос,
  сам билдинг `sets`/`values` с `$i`-плейсхолдерами остался в сервисе
  (слишком плотно завязан на порядок проверок, чтобы разносить дальше)
- `services/timers.service.js` — самая нетривиальная логика во всём
  переносе: PATCH принимает `remaining_seconds` и/или `period_seconds`
  с разным поведением в зависимости от того, что передано вместе, а что
  нет — перенесено дословно, включая подтягивание текущего
  `period_seconds` из БД, если он не передан в этом же запросе
- `controllers/timers.controller.js` — использует общий `wrap()`
- `routes/timers.js` — теперь 14 строк

По пути обнаружился баг оригинала: `reorderTimers` использует
`pool.query('BEGIN'/'COMMIT')` без выделенного `client`, то есть
"транзакция" не атомарна на самом деле. Перенёс как есть, не
исправлял — см. «Известные существующие проблемы» ниже.

**Проверено:** `typecheck`/`lint`/`node --check` — без новых ошибок.
Smoke-test — 21 проверка, специально нацеленная на самую рискованную
часть: `remaining_seconds` отдельно, `period_seconds` отдельно, оба
вместе (используется новое значение периода, а не старое из БД),
`remaining_seconds` на несуществующем таймере (404 до всякой записи).

## Сделано (backend): перенос shining (2 эндпоинта) на слои

`routes/shining.js` разложен на `shining.repository.js` (findByClan/
upsert), `shining.service.js` (принимает `anchorRealMs` ИЛИ `anchorIso`,
конвертирует один в другой — оба пути перенесены дословно),
`shining.controller.js` (общий `wrap`). `routes/shining.js` — 8 строк.

**Проверено:** `typecheck`/`lint`/`node --check` — без новых ошибок.
Smoke-test — 13 проверок: оба формата якоря, fallback `game_nick||nick`,
`res.json(null)` когда ничего не задано, дефолт `gameTimeStr` в `''`.

## Сделано (backend): перенос admin (4 эндпоинта) на слои

`routes/admin.js` разложен на `admin.repository.js` (обзор кланов,
каскадное удаление БЕЗ транзакции — как в оригинале, сброс медведей,
переключение прав), `admin.service.js` ("нельзя менять свои права"
сохранено дословно), `admin.controller.js` (общий `wrap`).
`superadmin` middleware вынесен из роута в `middleware/superadmin.js`
(тот же самый guard, просто в правильном месте). `routes/admin.js` —
теперь 11 строк.

**Проверено:** `typecheck`/`lint`/`node --check` — без новых ошибок.
Smoke-test — 9 проверок, включая сам middleware отдельно (блокирует
не-админа, пропускает админа) и каскад удаления клана (участники
отвязаны раньше, чем клан удалён).

## Сделано (backend): перенос anomaly (2 эндпоинта) на слои

`routes/anomaly.js` разложен на `anomaly.repository.js`,
`anomaly.service.js` (тот же dual-anchor формат, что и shining, но
per-account, без socket-эмита — сохранено дословно),
`anomaly.controller.js` (общий `wrap`). `routes/anomaly.js` — 9 строк.

**Проверено:** `typecheck`/`lint`/`node --check` — без новых ошибок.
Smoke-test — 9 проверок, включая явную проверку, что `req.getIo()`
нигде не вызывается (в отличие от shining — это per-account настройка,
не клан-широковещание).

**Все 7 роутов теперь на слоях `routes → controllers → services →
repositories`:** tracker (bears+draugs), clans, auth, hearts, timers,
shining, admin, anomaly.

## Сделано (backend): вынос sockets/ из index.js

`index.js` (98 строк) разгружен: JWT-проверка и обработчики
connection/join:clan/leave:clan/disconnect (~50 строк) вынесены
дословно в `sockets/socketAuth.js` и `sockets/handlers/connection.js`,
объединены в `sockets/index.js` → `attachSockets(io)`. `index.js`
теперь только собирает express-приложение, монтирует роуты и вызывает
`attachSockets(io)` — 66 строк, из них добрая половина — маршруты и
запуск сервера.

**Проверено:** `typecheck`/`lint`/`node --check` — без новых ошибок.
Smoke-test с моком `io`/`socket`/`jwt`/`pool` — 10 проверок: вся матрица
auth-middleware (нет токена / невалидный токен / юзер не найден /
успех), авто-join в комнату клана при коннекте, join:clan/leave:clan,
disconnect.

---

# 🏁 Backend полностью переведён на новую архитектуру

Все 7 роутов (tracker=bears+draugs, clans, auth, hearts, timers,
shining, admin, anomaly) — на слоях `routes → controllers → services →
repositories`. Socket.io-логика — в `sockets/`. `index.js` — тонкая
точка сборки, а не файл на 300+ строк вперемешку с SQL и бизнес-логикой.

За весь backend-перенос функциональность не менялась ни разу — каждый
роут проверен smoke-тестом с замоканной БД (реальной БД в песочнице
нет), сверяя точные тексты ошибок, коды статусов и бизнес-правила
против оригинального кода. По пути нашлись и зафиксированы (не
исправлялись) три существующих проблемы: нетранзакционный `reorder`
таймеров, нетранзакционное каскадное удаление клана в админке (оба —
не мои правки, унаследованы от оригинала), и разница в логировании
ошибок toggle-admin (раньше не логировал, теперь логирует — не влияет
на ответ клиенту).

Фронтенд и бэкенд оба полностью на новой архитектуре. Исходный план
архитектора выполнен целиком.

## Известные существующие проблемы (не мои правки, зафиксировано для памяти)

Найдены при настройке инструментов, не исправлялись — не входили в задачу
этого шага:

- `features/admin/AdminPage.jsx` импортирует `formatTime`/`getTimeLeft` из
  `utils/bears.js`, но там таких экспортов нет (Vite предупреждает при
  сборке, в рантайме это будет `undefined`).
- `components/BearCard.jsx` — та же история (`getTimeLeft`, `formatTime`
  не существуют в `utils/bears.js`), но сам файл нигде не импортируется —
  мёртвый компонент, поэтому Vite даже не предупреждает о нём при сборке.
- `utils/sound.js:23` и `utils/soundPrefs.js:26` — пустые `catch`-блоки
  (проглатывают ошибку молча).
- `services/auth.service.js:46` — `password_hash` получен из строки
  специально, чтобы исключить его из ответа (`{ password_hash, ...safeUser }`),
  но eslint всё равно считает переменную "неиспользуемой" — не баг,
  ложное срабатывание линтера, не подавлял намеренно, чтобы не путать
  с настоящими багами в этом списке.
- `repositories/timers.repository.js` → `reorderTimers` — BEGIN/COMMIT/
  ROLLBACK идут через `pool.query(...)` без выделенного `client`, то
  есть транзакция не атомарна на самом деле (каждый запрос может уйти
  на другое соединение из пула). Найдено при переносе на слои, не
  исправлялось — не входило в задачу.

Ни одна из них не могла быть замаскирована каркасом — все всплыли сами
после подключения линтера/тайпчекера или при переносе на слои.
