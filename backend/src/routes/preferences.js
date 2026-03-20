const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Save or update preferences
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      locationName,
      radiusKm,
      sensitivity,
      disasterTypes,
      notificationChannels,
    } = req.body;

    const data = {
      latitude: latitude || null,
      longitude: longitude || null,
      locationName: locationName || null,
      radiusKm: radiusKm || 100,
      sensitivity: sensitivity || 'medium',
      disasterTypes: Array.isArray(disasterTypes) ? disasterTypes.join(',') : (disasterTypes || 'earthquake,flood,wildfire,storm'),
      notificationChannels: Array.isArray(notificationChannels) ? notificationChannels.join(',') : (notificationChannels || 'in-app'),
    };

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: req.user.id },
      update: data,
      create: { userId: req.user.id, ...data },
    });

    res.json(preferences);
  } catch (err) {
    console.error('Save preferences error:', err);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Get preferences
router.get('/', authMiddleware, async (req, res) => {
  try {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.user.id },
    });
    res.json(preferences || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

module.exports = router;
