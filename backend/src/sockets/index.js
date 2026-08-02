const { socketAuth } = require('./socketAuth');
const { registerConnectionHandlers } = require('./handlers/connection');

function attachSockets(io) {
  io.use(socketAuth);
  registerConnectionHandlers(io);
}

module.exports = { attachSockets };
