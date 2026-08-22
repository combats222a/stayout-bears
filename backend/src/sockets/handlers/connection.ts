import type { Server, Socket } from 'socket.io';
import { pool } from '../../db/pool';

export function registerConnectionHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    const user = socket.user;
    console.log(`🔌 ${user.nick} connected`);

    if (user.clan_id) {
      socket.join(`clan:${user.clan_id}`);
    }

    // ИСПРАВЛЕНО: раньше join:clan/leave:clan пускали сокет в комнату
    // ЛЮБОГО clanId без проверки, что этот пользователь реально состоит
    // в этом клане — любой залогиненный клиент мог подписаться на чужие
    // события (медведи/таймеры/сердца/сияние). Обработчик нужен, потому
    // что socket.user.clan_id берётся один раз при подключении и может
    // быть устаревшим (например, сокет подключился раньше, чем игрок
    // вступил в клан через REST) — поэтому здесь каждый раз перечитываем
    // актуальный clan_id из БД и пускаем только в СВОЮ комнату.
    socket.on('join:clan', async (clanId: string | number) => {
      try {
        const { rows } = await pool.query<{ clan_id: number | null }>(
          'SELECT clan_id FROM users WHERE id = $1',
          [user.id]
        );
        const currentClanId = rows[0]?.clan_id ?? null;
        if (currentClanId == null || String(currentClanId) !== String(clanId)) return;
        socket.user.clan_id = currentClanId;
        socket.join(`clan:${currentClanId}`);
      } catch (e) {
        console.error(e);
      }
    });

    socket.on('leave:clan', (clanId: string | number) => {
      if (String(socket.user.clan_id) !== String(clanId)) return;
      socket.leave(`clan:${clanId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 ${user.nick} disconnected`);
    });
  });
}
