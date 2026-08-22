# controllers/

`asyncHandler.ts` — общий `wrap(serviceFn)`.
`tracker.controller.ts` — фабрика для bears/draugs.
`clan.controller.ts`, `auth.controller.ts`, `hearts.controller.ts`,
`timers.controller.ts`, `shining.controller.ts`, `admin.controller.ts`,
`anomaly.controller.ts` — используют общий `wrap`.

Все роуты теперь на этом слое.
