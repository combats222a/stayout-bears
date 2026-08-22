# features/clan/

`ClanPage.jsx` — перенесена как есть из `pages/`, интерфейс не менялся
(`user`, `clan`, `members`, `bans`, `onClanChange`, `isGuest`, `onLoginClick`
— те же пропсы, что и раньше).

`store.ts` — `useClanStore`/`useMembersStore`/`useBansStore` (общая
фабрика `createValueStore`, живёт в `src/stores/`). Источник данных для
`app/App.jsx` вместо `useState`, но **`ClanPage.jsx` продолжает получать
их пропсами от App**, как и раньше — интерфейс страницы не менялся.
Другие потребители (Bears/Draugs/Shining/Hearts тоже читают `clan` как
проп от App) переводить напрямую на стор не стали — не входило в текущий
шаг, риска не добавляет.
