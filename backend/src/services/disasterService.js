/**
 * Disaster Data Service
 * Aggregates, normalizes, deduplicates events from all connectors
 */
const cache = require('./cache');
const { fetchUSGSEarthquakes } = require('../connectors/usgs');
const { fetchEONETEvents } = require('../connectors/eonet');
const { fetchGDACSEvents } = require('../connectors/gdacs');

const CACHE_KEY = 'disaster_events';

// In-memory event store
let cachedEvents = [];

/**
 * Deduplicate events by source + externalId
 */
function deduplicateEvents(events) {
  const seen = new Map();
  for (const event of events) {
    const key = `${event.source}:${event.externalId}`;
    if (!seen.has(key)) {
      seen.set(key, event);
    }
  }
  return Array.from(seen.values());
}

/**
 * Normalize all events into consistent format
 */
function normalizeEvent(event) {
  return {
    id: `${event.source}-${event.externalId}`,
    externalId: event.externalId,
    source: event.source,
    type: event.type || 'other',
    severity: Math.min(10, Math.max(0, event.severity || 0)),
    title: event.title || 'Unknown Event',
    description: event.description || '',
    latitude: parseFloat(event.latitude) || 0,
    longitude: parseFloat(event.longitude) || 0,
    timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp,
    imageUrl: event.imageUrl || null,
    rawPayload: event.rawPayload || null,
  };
}

/**
 * Poll all data sources and update cached events
 */
async function pollAllSources(io) {
  console.log('📡 Fetching disaster data from all sources...');

  const results = await Promise.allSettled([
    fetchUSGSEarthquakes(),
    fetchEONETEvents(),
    fetchGDACSEvents(),
  ]);

  let allEvents = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allEvents.push(...result.value);
    }
  }

  // Normalize and deduplicate
  allEvents = deduplicateEvents(allEvents).map(normalizeEvent);

  // Sort by timestamp (newest first)
  allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Find new events
  const previousIds = new Set(cachedEvents.map(e => e.id));
  const newEvents = allEvents.filter(e => !previousIds.has(e.id));

  // Update cache
  cachedEvents = allEvents;
  cache.set(CACHE_KEY, allEvents);

  console.log(`✅ Total events: ${allEvents.length} (${newEvents.length} new)`);

  // Broadcast new events via WebSocket
  if (io && newEvents.length > 0) {
    io.emit('events:new', newEvents);
    console.log(`📢 Broadcasted ${newEvents.length} new events`);
  }

  // Broadcast full event list
  if (io) {
    io.emit('events:update', { count: allEvents.length, timestamp: new Date().toISOString() });
  }

  return allEvents;
}

/**
 * Get cached events
 */
function getCachedEvents() {
  return cachedEvents;
}

module.exports = { pollAllSources, getCachedEvents };
