// GDACS (Global Disaster Alert and Coordination System) Connector
// Parses RSS feed from https://www.gdacs.org/xml/rss.xml

const { parseStringPromise } = require('xml2js');

const TYPE_MAP = {
  EQ: 'earthquake',
  TC: 'storm',
  FL: 'flood',
  VO: 'volcano',
  DR: 'drought',
  WF: 'wildfire',
  TS: 'tsunami',
};

const SEVERITY_MAP = {
  Green: 3,
  Orange: 6,
  Red: 9,
};

async function fetchGDACSEvents() {
  try {
    const response = await fetch('https://www.gdacs.org/xml/rss.xml');
    if (!response.ok) throw new Error(`GDACS RSS returned ${response.status}`);

    const xml = await response.text();
    const result = await parseStringPromise(xml, { explicitArray: false });

    const items = result?.rss?.channel?.item;
    if (!items) return [];

    const itemArray = Array.isArray(items) ? items : [items];
    const events = [];

    for (const item of itemArray) {
      const lat = parseFloat(item['geo:lat'] || item['gdacs:lat'] || 0);
      const lng = parseFloat(item['geo:long'] || item['gdacs:long'] || 0);
      if (!lat && !lng) continue;

      const alertLevel = item['gdacs:alertlevel'] || 'Green';
      const eventType = item['gdacs:eventtype'] || '';
      const type = TYPE_MAP[eventType] || 'other';
      const severity = SEVERITY_MAP[alertLevel] || 3;

      events.push({
        externalId: item['gdacs:eventid'] || item.guid?._ || item.guid || `gdacs-${Date.now()}-${Math.random()}`,
        source: 'gdacs',
        type,
        severity,
        title: item.title || 'GDACS Alert',
        description: item.description || '',
        latitude: lat,
        longitude: lng,
        timestamp: new Date(item.pubDate || Date.now()),
        imageUrl: null,
        rawPayload: JSON.stringify({
          link: item.link,
          alertLevel,
          eventType,
          country: item['gdacs:country'],
        }),
      });
    }

    console.log(`  🌐 GDACS: ${events.length} events fetched`);
    return events;
  } catch (err) {
    console.error('  ❌ GDACS fetch error:', err.message);
    return [];
  }
}

module.exports = { fetchGDACSEvents };
