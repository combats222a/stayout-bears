# controllers/

`asyncHandler.js` — общий `wrap(serviceFn)`.
`tracker.controller.js` — фабрика для bears/draugs.
`clan.controller.js`, `auth.controller.js`, `hearts.controller.js`,
`timers.controller.js`, `shining.controller.js`, `admin.controller.js`,
`anomaly.controller.js` — используют общий `wrap`.

Все роуты теперь на этом слое.
