require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  openWeatherApiKey: process.env.OPENWEATHERMAP_API_KEY || '',
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
  },
  polling: {
    interval: '*/5 * * * *', // every 5 minutes
  },
};
