import type { Server } from 'socket.io';
import { socketAuth } from './socketAuth';
import { registerConnectionHandlers } from './handlers/connection';

export function attachSockets(io: Server) {
  io.use(socketAuth);
  registerConnectionHandlers(io);
}
