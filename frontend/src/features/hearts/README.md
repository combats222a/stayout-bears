# features/hearts/

`HeartsPage.jsx` — перенесена как есть из `pages/`, интерфейс не менялся
(`clan`, `members`, `user`, `onHeartsUpdate`, `isGuest`, `onLoginClick`).

Сама себе загружает данные (свой useEffect/api.get внутри), в App.jsx
наружу торчит только колбэк регистрации перезагрузки по сокет-событию
(`onHeartsUpdate={setHeartsReloader}`) — эта механика в App.jsx не
трогалась.

Store здесь не заводили по той же причине, что и в clan: нет
дублирования, которое он бы устранял, а `members` уже приходит из
App.jsx (общий с ClanPage) — сам по себе перенос его в стор откладывается
до шага App.jsx → app/.
