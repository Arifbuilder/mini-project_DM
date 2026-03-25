const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Mathematical heuristic to calculate AI predictions for a specific event
function calculatePrediction(event) {
  const now = new Date();
  const eventTime = new Date(event.timestamp);
  const hoursSince = Math.max(0, (now - eventTime) / 3600000);

  let aftershockProbability = 0;
  let estimatedStabilizationHours = 0;
  let secondaryImpactRisk = 'Low';
  let severityRank = event.severity || 1;

  if (event.type === 'earthquake') {
    // Omori's law heuristic for earthquake aftershocks
    // Probability decays exponentially over time, scaled by initial magnitude
    aftershockProbability = Math.max(0, Math.min(99, (severityRank * 15) / Math.pow(hoursSince + 1, 1.2)));
    estimatedStabilizationHours = Math.round((severityRank * 24) / Math.pow(hoursSince + 1, 0.5));
    if (severityRank > 6.5) secondaryImpactRisk = 'High (Tsunami / Landslides)';
    else if (severityRank > 5.0) secondaryImpactRisk = 'Moderate (Structural Damage)';
  } else if (event.type === 'wildfire') {
    // Wildfires depend heavily on persistence over time rather than instant decay
    aftershockProbability = Math.max(0, Math.min(95, (severityRank * 10) - (hoursSince * 0.5)));
    estimatedStabilizationHours = Math.round(Math.max(24, (severityRank * 48) - hoursSince));
    if (severityRank > 7) secondaryImpactRisk = 'High (Air Quality / Evacuation)';
    else if (severityRank > 4) secondaryImpactRisk = 'Moderate (Property Threat)';
  } else if (event.type === 'flood') {
    aftershockProbability = Math.max(0, Math.min(90, (severityRank * 12) / Math.pow(hoursSince + 2, 0.8)));
    estimatedStabilizationHours = Math.round(Math.max(12, (severityRank * 36) - hoursSince));
    secondaryImpactRisk = severityRank > 6 ? 'High (Waterborne Disease / Infrastructure)' : 'Low';
  } else {
    // Generic hazard decay
    aftershockProbability = Math.max(0, Math.min(85, (severityRank * 10) / (hoursSince + 1)));
    estimatedStabilizationHours = Math.round(Math.max(12, (severityRank * 24) - hoursSince));
    secondaryImpactRisk = severityRank > 5 ? 'Moderate' : 'Low';
  }

  // Format the outputs
  return {
    eventId: event.id,
    aiModel: "Enterprise Heuristic v1.2",
    aftershockProbability: `${aftershockProbability.toFixed(1)}%`,
    estimatedStabilization: `${estimatedStabilizationHours} hours`,
    secondaryImpactRisk,
    threatDecayIndex: (100 - aftershockProbability).toFixed(1),
    timestamp: new Date().toISOString()
  };
}

// GET /api/ai/predict/:eventId
router.get('/predict/:eventId', optionalAuth, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Look up real disaster or generate fake for experimental
    let targetEvent = null;
    if (eventId.startsWith('exp-')) {
      // Experimental mode event, we'll reconstruct minimum required properties
      // Since we don't store exp-events in DB, we mock the prediction
      const idNum = parseInt(eventId.split('-')[1]) || 0;
      targetEvent = {
        id: eventId,
        type: ['earthquake', 'flood', 'wildfire', 'storm', 'volcano'][idNum % 5],
        severity: (idNum % 9) + 1,
        timestamp: new Date(Date.now() - (idNum * 3600000)).toISOString()
      };
    } else {
      // Real database event
      targetEvent = await prisma.disasterEvent.findUnique({
        where: { id: eventId }
      });
    }

    if (!targetEvent) {
      return res.status(404).json({ error: 'Event not found for AI modeling.' });
    }

    const prediction = calculatePrediction(targetEvent);

    // Artificial delay to simulate "AI computation" for UI loading effect
    await new Promise(resolve => setTimeout(resolve, 850));
    res.json(prediction);

  } catch (err) {
    console.error('AI Predictor error:', err);
    res.status(500).json({ error: 'Internal server error running AI simulation.' });
  }
});

module.exports = router;
