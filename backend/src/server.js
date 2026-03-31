const express = require('express');
const http = require('http');
const cors = require('cors');
const cron = require('node-cron');
const config = require('./config');
const { setupWebSocket } = require('./websocket');
const { pollAllSources } = require('./services/disasterService');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const preferencesRoutes = require('./routes/preferences');
const weatherRoutes = require('./routes/weather');
const messagesRoutes = require('./routes/messages');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket
const io = setupWebSocket(server);
app.set('io', io);

// Initial data fetch
pollAllSources(io).then(() => {
  console.log('✅ Initial disaster data fetched');
}).catch(err => {
  console.error('⚠️  Initial fetch failed (will retry):', err.message);
});

// Schedule polling every 5 minutes
cron.schedule(config.polling.interval, () => {
  console.log('🔄 Polling disaster data sources...');
  pollAllSources(io);
});

// Start server
server.listen(config.port, () => {
  console.log(`🚀 Disaster Intel Backend running on port ${config.port}`);
});
