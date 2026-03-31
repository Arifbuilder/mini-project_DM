const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { dispatchAlerts } = require('../services/notificationService');

const router = express.Router();

/**
 * Manually trigger a test alert for the current user
 */
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const testEvent = {
        id: 'test-event-' + Date.now(),
        externalId: 'test-999',
        source: 'DEMO_SYSTEM',
        type: 'earthquake',
        severity: 9.5,
        title: '🔴 DEMO EMERGENCY: Major 9.5 Earthquake Simulated',
        description: 'This is a simulation to verify your REAL-TIME ALERT settings (Email/SMS). Please ignore if not expected.',
        latitude: 35.6895,  // Tokyo
        longitude: 139.6917,
        timestamp: new Date().toISOString()
    };

    console.log(`🧪 Triggering manual test alert for user: ${req.user.id}`);
    
    // We pass the event to the dispatcher. 
    // The dispatcher will find users with matching criteria (like this user).
    await dispatchAlerts(testEvent);

    res.json({ success: true, message: 'Test alert dispatched! Check your email, SMS, or server terminal.' });
  } catch (err) {
    console.error('Test alert error:', err);
    res.status(500).json({ error: 'Failed to dispatch test alert' });
  }
});

module.exports = router;
