const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authRequired, authOptional } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/messages — fetch recent messages
router.get('/', async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(messages.reverse());
  } catch (err) {
    console.error('Messages fetch error:', err.message);
    res.json([]);
  }
});

// POST /api/messages — send a message
router.post('/', authOptional, async (req, res) => {
  try {
    const { text, type = 'chat', latitude, longitude, disasterType } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const message = await prisma.message.create({
      data: {
        text: text.trim().slice(0, 1000),
        type, // 'chat', 'report', 'alert'
        latitude: latitude || null,
        longitude: longitude || null,
        disasterType: disasterType || null,
        userId: req.user?.id || null,
        userName: req.user?.name || req.body.userName || 'Anonymous',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Broadcast via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('message:new', message);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('Message create error:', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/messages/report — submit a disaster report
router.post('/report', authOptional, async (req, res) => {
  try {
    const { description, disasterType, severity, latitude, longitude, locationName } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const report = await prisma.message.create({
      data: {
        text: `🚨 REPORT: ${description}`.slice(0, 1000),
        type: 'report',
        latitude: latitude || null,
        longitude: longitude || null,
        disasterType: disasterType || 'other',
        userId: req.user?.id || null,
        userName: req.user?.name || req.body.userName || 'Anonymous',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('message:new', report);
      io.emit('report:new', {
        ...report,
        severity: severity || 5,
        locationName: locationName || 'Unknown',
      });
    }

    res.status(201).json(report);
  } catch (err) {
    console.error('Report create error:', err.message);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;
