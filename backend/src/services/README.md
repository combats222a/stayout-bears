# services/

`tracker.service.ts` + `tracker.config.ts`, `clan.service.ts`,
`auth.service.ts`, `hearts.service.ts`, `timers.service.ts`,
`shining.service.ts`, `admin.service.ts` — см. историю выше.
`anomaly.service.ts` — тот же принцип dual-anchor формата, что и
shining, но привязано к аккаунту, а не к клану — без socket-эмита.

Все роуты теперь на этом слое.
