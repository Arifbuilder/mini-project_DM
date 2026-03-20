// USGS Earthquake API Connector
// https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson

async function fetchUSGSEarthquakes() {
  try {
    const response = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
    );

    if (!response.ok) throw new Error(`USGS API returned ${response.status}`);

    const data = await response.json();
    const events = (data.features || []).map(feature => {
      const props = feature.properties;
      const [lng, lat, depth] = feature.geometry.coordinates;
      const mag = props.mag || 0;

      // Map magnitude to severity 0-10
      let severity = Math.min(10, Math.max(0, mag));

      return {
        externalId: feature.id,
        source: 'usgs',
        type: 'earthquake',
        severity,
        title: props.title || `M${mag} Earthquake`,
        description: `Magnitude ${mag} earthquake at depth ${depth?.toFixed(1) || '?'}km. ${props.place || ''}`,
        latitude: lat,
        longitude: lng,
        timestamp: new Date(props.time),
        imageUrl: null,
        rawPayload: JSON.stringify({ mag, depth, place: props.place, url: props.url }),
      };
    });

    console.log(`  📊 USGS: ${events.length} earthquakes fetched`);
    return events;
  } catch (err) {
    console.error('  ❌ USGS fetch error:', err.message);
    return [];
  }
}

module.exports = { fetchUSGSEarthquakes };
