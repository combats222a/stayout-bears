import type { Server, Socket } from 'socket.io';

export function registerConnectionHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    const user = socket.user;
    console.log(`🔌 ${user.nick} connected`);

    if (user.clan_id) {
      socket.join(`clan:${user.clan_id}`);
    }

    socket.on('join:clan', (clanId: string | number) => {
      socket.join(`clan:${clanId}`);
    });

    socket.on('leave:clan', (clanId: string | number) => {
      socket.leave(`clan:${clanId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 ${user.nick} disconnected`);
    });
  });
}
