import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { pool } from './db/pool';
import { initSchema } from './db/schema';
import { attachSockets } from './sockets';

import authRoutes from './routes/auth';
import clansRoutes from './routes/clans';
import bearsRoutes from './routes/bears';
import draugsRoutes from './routes/draugs';
import shiningRoutes from './routes/shining';
import adminRoutes from './routes/admin';
import heartsRoutes from './routes/hearts';
import timersRoutes from './routes/timers';
import anomalyRoutes from './routes/anomaly';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
// Сжимает все ответы (gzip) — прозрачно для клиентов, они уже шлют
// Accept-Encoding: gzip по умолчанию (fetch/XHR/axios). Особенно заметно на
// /clans/me (bears+draugs+members+bans одним ответом), который гоняется
// каждые 30с с каждого открытого клиента.
app.use(compression());
app.use(express.json());

// Attach io to requests
app.use((req, _res, next) => {
  req.getIo = () => io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clans', clansRoutes);
app.use('/api/bears', bearsRoutes);
app.use('/api/draugs', draugsRoutes);
app.use('/api/shining', shiningRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hearts', heartsRoutes);
app.use('/api/timers', timersRoutes);
app.use('/api/anomaly', anomalyRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Socket.io
attachSockets(io);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected');
    await initSchema();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (e) {
    console.error('❌ Failed to start:', e);
    process.exit(1);
  }
}

start();
