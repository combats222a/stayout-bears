require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { pool } = require('./db/pool');
const { initSchema } = require('./db/schema');

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
app.use(express.json());

// Attach io to requests
app.use((req, _res, next) => {
  req.getIo = () => io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clans', require('./routes/clans'));
app.use('/api/bears', require('./routes/bears'));
app.use('/api/admin', require('./routes/admin'));

app.get('/health', (_req, res) => res.json({ ok: true }));

// Socket.io
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT id, nick, clan_id FROM users WHERE id = $1', [payload.id]);
    if (!rows.length) return next(new Error('User not found'));
    socket.user = rows[0];
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.user;
  console.log(`🔌 ${user.nick} connected`);

  if (user.clan_id) {
    socket.join(`clan:${user.clan_id}`);
  }

  socket.on('join:clan', (clanId) => {
    socket.join(`clan:${clanId}`);
  });

  socket.on('leave:clan', (clanId) => {
    socket.leave(`clan:${clanId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 ${user.nick} disconnected`);
  });
});

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
