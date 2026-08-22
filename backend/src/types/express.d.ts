// Расширение Express Request тем, что реально кладёт туда
// middleware/auth.ts (user) и backend/src/index.ts (getIo).
// Это только объявление типов — на рантайм не влияет.
import 'express';
import type { Server } from 'socket.io';
import type { AuthUser } from './entities';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
    getIo: () => Server;
  }
}
