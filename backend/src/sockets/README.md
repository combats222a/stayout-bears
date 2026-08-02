# sockets/

`socketAuth.js` — io.use() middleware (проверка JWT + подгрузка
пользователя), извлечён из index.js дословно.
`handlers/connection.js` — обработчики connection/join:clan/leave:clan/
disconnect, тоже извлечены дословно.
`index.js` — `attachSockets(io)`, единая точка подключения обоих к
инстансу io. `index.js` (корневой, backend/src/index.js) теперь просто
вызывает `attachSockets(io)` вместо ~35 строк инлайновой socket-логики.
