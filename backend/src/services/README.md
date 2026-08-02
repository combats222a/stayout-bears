# services/

`tracker.service.js` + `tracker.config.js`, `clan.service.js`,
`auth.service.js`, `hearts.service.js`, `timers.service.js`,
`shining.service.js`, `admin.service.js` — см. историю выше.
`anomaly.service.js` — тот же принцип dual-anchor формата, что и
shining, но привязано к аккаунту, а не к клану — без socket-эмита.

Все роуты теперь на этом слое.
