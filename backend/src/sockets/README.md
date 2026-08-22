# sockets/

`socketAuth.ts` — io.use() middleware (проверка JWT + подгрузка
пользователя), извлечён из index.ts дословно.
`handlers/connection.ts` — обработчики connection/join:clan/leave:clan/
disconnect, тоже извлечены дословно.
`index.ts` — `attachSockets(io)`, единая точка подключения обоих к
инстансу io. `index.ts` (корневой, backend/src/index.ts) теперь просто
вызывает `attachSockets(io)` вместо ~35 строк инлайновой socket-логики.
