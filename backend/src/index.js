require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { pool } = require('./db/pool');
const { initSchema } = require('./db/schema');
const { attachSockets } = require('./sockets');

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
app.use('/api/draugs', require('./routes/draugs'));
app.use('/api/shining', require('./routes/shining'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hearts', require('./routes/hearts'));
app.use('/api/timers', require('./routes/timers'));
app.use('/api/anomaly', require('./routes/anomaly'));

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
