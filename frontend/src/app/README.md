# app/

`App.jsx` — перенесён из `src/App.jsx`, интерфейс/поведение не менялись,
только пути импортов (`./` → `../`) и источник `clan`/`members`/`bans`/
`shiningData`/`anomalyData` (теперь сторы вместо `useState` — см.
`features/clan/store.ts`, `features/shining/store.ts`,
`features/anomaly/store.ts`). Дочерние страницы получают их **тем же
способом, что и раньше** — пропсами от `App`, их интерфейс не менялся.

`routes.ts` — `APP_PAGES`/`GUEST_PREVIEW_PAGES`, вынесены из `App.jsx`
дословно (просто данные, без переписывания самого роутинга — ручной
вывод `page` из `location.pathname` внутри `App.jsx` не трогали, менять
его на декларативный `<Routes>`/`<Route>` не было необходимости).

`providers.tsx` пока не создавали — реальных провайдеров (Context) в
приложении сейчас нет (i18n не реализован в этом снэпшоте), заводить
пустой файл ради структуры не стали.

Ещё остаются в `useState` внутри `App.jsx`: `user`, `token`, `showAuth`,
`menuOpen`, `loading`, `connectionError`, `heartsReloader` — это уже
не про clan/shining/anomaly, в текущий шаг не входило.
