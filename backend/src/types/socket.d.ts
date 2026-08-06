// Расширение Socket.IO Socket тем, что реально кладёт туда
// sockets/socketAuth.ts. Только типы, на рантайм не влияет.
import type { AuthUser } from './entities';

export type SocketUser = Pick<AuthUser, 'id' | 'nick' | 'clan_id'>;

declare module 'socket.io' {
  interface Socket {
    user: SocketUser;
  }
}
