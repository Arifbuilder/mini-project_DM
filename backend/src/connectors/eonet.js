// NASA EONET (Earth Observatory Natural Event Tracker) Connector
// https://eonet.gsfc.nasa.gov/api/v3/events

const TYPE_MAP = {
  'Wildfires': 'wildfire',
  'Severe Storms': 'storm',
  'Floods': 'flood',
  'Volcanoes': 'volcano',
  'Earthquakes': 'earthquake',
  'Drought': 'drought',
  'Sea and Lake Ice': 'ice',
  'Landslides': 'landslide',
  'Snow': 'storm',
  'Temperature Extremes': 'extreme_temp',
  'Water Color': 'other',
  'Dust and Haze': 'other',
};

const SEVERITY_MAP = {
  wildfire: 6,
  storm: 5,
  flood: 7,
  volcano: 8,
  earthquake: 6,
  landslide: 6,
  drought: 4,
  ice: 3,
  extreme_temp: 4,
  other: 2,
};

async function fetchEONETEvents() {
  try {
    const response = await fetch(
      'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100'
    );

    if (!response.ok) throw new Error(`EONET API returned ${response.status}`);

    const data = await response.json();
    const events = [];

    for (const event of (data.events || [])) {
      const categoryTitle = event.categories?.[0]?.title || 'Other';
      const type = TYPE_MAP[categoryTitle] || 'other';
      const severity = SEVERITY_MAP[type] || 3;

      // Get latest geometry
      const lastGeo = event.geometry?.[event.geometry.length - 1];
      if (!lastGeo || !lastGeo.coordinates) continue;

      const [lng, lat] = lastGeo.coordinates;

      events.push({
        externalId: event.id,
        source: 'eonet',
        type,
        severity,
        title: event.title,
        description: `${categoryTitle} event tracked by NASA EONET.`,
        latitude: lat,
        longitude: lng,
        timestamp: new Date(lastGeo.date || event.geometry?.[0]?.date || Date.now()),
        imageUrl: null,
        rawPayload: JSON.stringify({
          categories: event.categories,
          sources: event.sources,
          link: event.link,
        }),
      });
    }

    console.log(`  🛰️  EONET: ${events.length} events fetched`);
    return events;
  } catch (err) {
    console.error('  ❌ EONET fetch error:', err.message);
    return [];
  }
}

module.exports = { fetchEONETEvents };
