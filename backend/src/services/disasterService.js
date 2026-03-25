/**
 * Disaster Data Service
 * Aggregates, normalizes, deduplicates events from all connectors
 */
const cache = require('./cache');
const { PrismaClient } = require('@prisma/client');
const { fetchUSGSEarthquakes } = require('../connectors/usgs');
const { fetchEONETEvents } = require('../connectors/eonet');
const { fetchGDACSEvents } = require('../connectors/gdacs');

const prisma = new PrismaClient();
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

  // Save/Upsert to Database
  try {
    for (const event of allEvents) {
      await prisma.disasterEvent.upsert({
        where: {
          source_externalId: {
            source: event.source,
            externalId: event.externalId,
          },
        },
        update: {
          severity: event.severity,
          title: event.title,
          description: event.description,
          latitude: event.latitude,
          longitude: event.longitude,
        },
        create: {
          id: event.id,
          externalId: event.externalId,
          source: event.source,
          type: event.type,
          severity: event.severity,
          title: event.title,
          description: event.description,
          latitude: event.latitude,
          longitude: event.longitude,
          timestamp: new Date(event.timestamp),
          imageUrl: event.imageUrl,
          rawPayload: event.rawPayload,
        },
      });
    }
    console.log(`💾 Database updated with ${allEvents.length} events`);
  } catch (dbErr) {
    console.error('  ⚠️ Database sync failed:', dbErr.message);
  }

  // Update cache
  cachedEvents = allEvents;
  cache.set(CACHE_KEY, allEvents);

  console.log(`✅ Total events: ${allEvents.length} (${newEvents.length} new)`);

  // Broadcast new events via WebSocket (Personalized alerts)
  if (io && newEvents.length > 0) {
    const sockets = await io.fetchSockets();
    const { calculateRiskScore, haversineDistance } = require('./riskScoring');
    
    let broadcastCount = 0;
    for (const socket of sockets) {
      const u = socket.userData;
      if (u && u.latitude && u.longitude) {
        // Filter new events for this specific user's radius
        const radius = u.radiusKm || 500;
        const personalNewEvents = newEvents.filter(e => 
          haversineDistance(u.latitude, u.longitude, e.latitude, e.longitude) <= radius
        ).map(e => ({
          ...e,
          risk: calculateRiskScore(e, u.latitude, u.longitude)
        }));

        if (personalNewEvents.length > 0) {
          socket.emit('events:new', personalNewEvents);
          broadcastCount++;
        }
      } else {
        // Fallback: send all to unlocalized clients
        socket.emit('events:new', newEvents.slice(0, 5));
      }
    }
    console.log(`📢 Sent personalized alerts to ${broadcastCount} clients (${newEvents.length} total new)`);
  }

  // Broadcast full event list update notification
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
