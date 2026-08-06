# features/shining/

`ShiningPage.jsx` — перенесена как есть из `pages/`, интерфейс не менялся
(`clan`, `shiningData`, `onShiningChange`, `isGuest`, `onLoginClick`).

`store.ts` — `useShiningStore` (через общую `createValueStore`). Источник
данных для `app/App.jsx` вместо `useState`, но `ShiningPage.jsx`
продолжает получать `shiningData`/`onShiningChange` пропсами от App,
интерфейс страницы не менялся.
