# stores/

`createValueStore.ts` — общая фабрика для "стора на одно значение целиком"
(clan/shining/anomaly и т.п. — используется из соответствующих
`features/<domain>/store.ts`, а не напрямую отсюда).

Кросс-доменные сторы уровня приложения (useSocketStore, useUiStore) сюда
пока не добавляли — `token`/`menuOpen`/`showAuth` остаются в `app/App.jsx`
как useState, это не входило в текущий шаг.
