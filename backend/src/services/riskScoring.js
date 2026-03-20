/**
 * Risk Scoring Engine
 * Uses Haversine distance + severity + recency to calculate risk scores
 */

// Haversine formula — distance between two points on Earth (in km)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculate risk score for an event relative to user position
 * Score = severity × proximity_factor × recency_factor
 * Range: 0–100
 */
function calculateRiskScore(event, userLat, userLng) {
  const distance = haversineDistance(userLat, userLng, event.latitude, event.longitude);

  // Proximity factor: inverse decay — closer = higher risk
  // At 0km → 1.0, at 100km → 0.5, at 500km → 0.17
  const proximityFactor = 1 / (1 + distance / 100);

  // Recency factor: newer events score higher
  // At 0h → 1.0, at 24h → 0.5, at 72h → 0.25
  const ageMs = Date.now() - new Date(event.timestamp).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const recencyFactor = 1 / (1 + ageHours / 24);

  // Severity is 0–10, normalize to 0–1
  const severityFactor = (event.severity || 1) / 10;

  // Final score: 0–100
  const score = severityFactor * proximityFactor * recencyFactor * 100;
  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Sort events by priority (highest risk first)
 */
function sortByPriority(events, userLat, userLng) {
  return events
    .map(e => ({
      ...e,
      riskScore: calculateRiskScore(e, userLat, userLng),
      distance: haversineDistance(userLat, userLng, e.latitude, e.longitude),
    }))
    .sort((a, b) => b.riskScore - a.riskScore);
}

module.exports = { haversineDistance, calculateRiskScore, sortByPriority };
