# features/anomaly/

`AnomalyPage.jsx` — перенесена как есть, интерфейс не менялся
(`user`, `anomalyData`, `onAnomalyChange`, `isGuest`, `onLoginClick`).
`store.ts` — `useAnomalyStore` (через общую `createValueStore`).
Источник данных для `app/App.jsx` вместо `useState`, но
`AnomalyPage.jsx` продолжает получать `anomalyData`/`onAnomalyChange`
пропсами от App, интерфейс страницы не менялся.
