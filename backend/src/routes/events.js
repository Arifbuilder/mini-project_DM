const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { getCachedEvents } = require('../services/disasterService');
const { calculateRiskScore, haversineDistance } = require('../services/riskScoring');

const router = express.Router();

// Get all disaster events (with optional location filtering)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { lat, lng, radius, type } = req.query;
    let events = getCachedEvents();

    // Filter by type
    if (type) {
      const types = type.split(',');
      events = events.filter(e => types.includes(e.type));
    }

    // Filter by distance
    if (lat && lng && radius) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxRadius = parseFloat(radius);

      events = events
        .map(e => ({
          ...e,
          distance: haversineDistance(userLat, userLng, e.latitude, e.longitude),
        }))
        .filter(e => e.distance <= maxRadius)
        .sort((a, b) => a.distance - b.distance);
    }

    // Add risk scores if user location provided
    if (lat && lng) {
      events = events.map(e => ({
        ...e,
        riskScore: calculateRiskScore(e, parseFloat(lat), parseFloat(lng)),
      }));
    }

    res.json({
      count: events.length,
      events,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event stats
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const events = getCachedEvents();
    const stats = {
      total: events.length,
      byType: {},
      avgSeverity: 0,
    };

    let totalSeverity = 0;
    events.forEach(e => {
      stats.byType[e.type] = (stats.byType[e.type] || 0) + 1;
      totalSeverity += e.severity;
    });
    stats.avgSeverity = events.length > 0 ? +(totalSeverity / events.length).toFixed(2) : 0;

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

module.exports = router;
