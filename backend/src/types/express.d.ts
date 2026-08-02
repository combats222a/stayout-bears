// Расширение Express Request тем, что реально кладёт туда middleware/auth.js.
// Это только объявление типов — на рантайм не влияет.
import 'express';

export interface AuthUser {
  id: number;
  nick: string;
  game_nick: string;
  email: string;
  clan_id: number | null;
  is_superadmin: boolean;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}
