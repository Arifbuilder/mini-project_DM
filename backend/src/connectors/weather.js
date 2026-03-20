// OpenWeatherMap Severe Weather Alerts Connector
const config = require('../config');

async function fetchWeatherAlerts(lat = 0, lng = 0) {
  try {
    if (!config.openWeatherApiKey) {
      console.log('  ⛅ Weather: No API key configured, skipping');
      return [];
    }

    // Fetch severe weather alerts for a region
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&exclude=minutely,hourly,daily&appid=${config.openWeatherApiKey}`
    );

    if (!response.ok) {
      console.log(`  ⛅ Weather: API returned ${response.status}, skipping`);
      return [];
    }

    const data = await response.json();
    const alerts = data.alerts || [];

    return alerts.map((alert, i) => ({
      externalId: `owm-${lat}-${lng}-${i}-${Date.now()}`,
      source: 'openweathermap',
      type: 'storm',
      severity: 5,
      title: alert.event || 'Weather Alert',
      description: alert.description || '',
      latitude: lat,
      longitude: lng,
      timestamp: new Date(alert.start * 1000),
      imageUrl: null,
      rawPayload: JSON.stringify({
        sender: alert.sender_name,
        start: alert.start,
        end: alert.end,
        tags: alert.tags,
      }),
    }));
  } catch (err) {
    console.error('  ❌ Weather fetch error:', err.message);
    return [];
  }
}

// Get current weather for a location (used by weather widget)
async function fetchCurrentWeather(lat, lng) {
  try {
    if (!config.openWeatherApiKey) {
      // Return mock data if no API key
      return {
        temp: 22,
        feelsLike: 21,
        humidity: 65,
        windSpeed: 12,
        description: 'Partly cloudy',
        icon: '02d',
        city: 'Your Location',
      };
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${config.openWeatherApiKey}`
    );

    if (!response.ok) throw new Error(`Weather API: ${response.status}`);

    const data = await response.json();
    return {
      temp: Math.round(data.main?.temp || 0),
      feelsLike: Math.round(data.main?.feels_like || 0),
      humidity: data.main?.humidity || 0,
      windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // m/s to km/h
      description: data.weather?.[0]?.description || 'N/A',
      icon: data.weather?.[0]?.icon || '01d',
      city: data.name || 'Unknown',
    };
  } catch (err) {
    console.error('Weather API error:', err.message);
    return {
      temp: '--',
      feelsLike: '--',
      humidity: '--',
      windSpeed: '--',
      description: 'Unavailable',
      icon: '01d',
      city: 'Unknown',
    };
  }
}

module.exports = { fetchWeatherAlerts, fetchCurrentWeather };
