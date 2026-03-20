const { Server } = require('socket.io');
const config = require('./config');

function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('subscribe:location', (data) => {
      const { latitude, longitude, radiusKm } = data;
      socket.userData = { latitude, longitude, radiusKm };
      console.log(`📍 Client ${socket.id} subscribed to location: ${latitude}, ${longitude} (${radiusKm}km)`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = { setupWebSocket };
