const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to strictly enforce ADMIN role
const adminOnly = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access only' });
    }
    req.adminUser = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error checking admin privileges' });
  }
};

// GET /api/admin/stats — Retrieve platform-wide metrics
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalMessages = await prisma.message.count();
    const totalReports = await prisma.message.count({ where: { type: 'report' } });
    
    // Simulate active events from last 24h
    const recentDate = new Date(Date.now() - 24 * 3600000);
    const activeEvents = await prisma.disasterEvent.count({ where: { timestamp: { gte: recentDate } } });

    res.json({ totalUsers, totalMessages, totalReports, activeEvents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/reports — Retrieve all crowd-sourced hazard reports for moderation
router.get('/reports', authMiddleware, adminOnly, async (req, res) => {
  try {
    const reports = await prisma.message.findMany({
      where: { type: 'report' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, reputation: true } } }
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/admin/reports/:id/verify — Mark a report as an officially verified hazard
router.post('/reports/:id/verify', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await prisma.message.update({
      where: { id },
      data: { isVerified: true }
    });
    
    // Reward the reporter's trust rating
    if (report.userId) {
      await prisma.user.update({
        where: { id: report.userId },
        data: { reputation: { increment: 50 } }
      });
    }

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify report' });
  }
});

// DELETE /api/admin/reports/:id — Delete a false report
router.delete('/reports/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await prisma.message.findUnique({ where: { id } });
    if (report && report.userId) {
      // Penalize reporter for false intel
      await prisma.user.update({
        where: { id: report.userId },
        data: { reputation: { decrement: 20 } }
      });
    }

    await prisma.message.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

module.exports = router;
