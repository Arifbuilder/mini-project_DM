'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { motion, AnimatePresence } from 'framer-motion';

// Fix typical Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const TYPE_COLORS = { 
  earthquake: '#ef4444', flood: '#3b82f6', wildfire: '#f97316', 
  storm: '#8b5cf6', volcano: '#dc2626', tsunami: '#06b6d4', 
  landslide: '#a3741e', other: '#6b7280' 
};

function createCustomIcon(type, severity, isSelected) {
  const color = TYPE_COLORS[type] || TYPE_COLORS.other;
  const size = Math.max(16, Math.min(45, (severity || 5) * 4));
  const selectedPulse = isSelected ? `box-shadow: 0 0 0 8px ${color}30, 0 0 16px ${color};` : '';

  return L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="
            width: ${size}px; height: ${size}px;
            background: ${color}; border: 2px solid #fff;
            border-radius: 50%; opacity: 0.9;
            ${selectedPulse}
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; align-items: center; justify-content: center;
          "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function HeatmapLayer({ events }) {
  const map = useMap();
  
  useEffect(() => {
    if (!events || events.length === 0) return;
    const points = events.map(e => [e.latitude, e.longitude, (e.severity || 5) * 10]);
    // Create the heat layer with smaller radius
    const heat = L.heatLayer(points, {
      radius: 20,
      blur: 15,
      maxZoom: 6,
      gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'orange', 1.0: 'red' }
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, events]);

  return null;
}

function EvacuationRoute({ userLocation, extremeEvent }) {
  const map = useMap();
  const [routeCoords, setRouteCoords] = useState([]);

  useEffect(() => {
    if (!userLocation || !extremeEvent) {
      setRouteCoords([]);
      return;
    }

    // Attempt to calculate an opposite "safe zone" arbitrarily 150km away from the hazard
    const angle = Math.atan2(userLocation[0] - extremeEvent.latitude, userLocation[1] - extremeEvent.longitude);
    const safeLat = userLocation[0] + Math.sin(angle) * 1.5; // roughly ~150km displacement
    const safeLng = userLocation[1] + Math.cos(angle) * 1.5;

    // Fetch live OSRM driving route
    const osrmApi = `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${safeLng},${safeLat}?overview=full&geometries=geojson`;
    
    fetch(osrmApi)
      .then(r => r.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]); // OSRM gives [lng, lat]
          setRouteCoords(coords);
          // Gently bound map to route if active
          map.fitBounds(L.latLngBounds(coords), { padding: [50, 50], animate: true, duration: 1 });
        }
      })
      .catch(err => console.error("OSRM Routing failed", err));

  }, [userLocation, extremeEvent, map]);

  if (routeCoords.length === 0) return null;

  return (
    <>
      <Polyline positions={routeCoords} color="#10b981" weight={6} dashArray="10, 10" opacity={0.8} />
      <Marker position={routeCoords[routeCoords.length - 1]} icon={L.divIcon({
        className: 'safe-icon',
        html: `<div style="font-size:1.5rem; background: #10b981; border-radius:50%; padding: 4px;">✅</div>`
      })} />
    </>
  );
}

function RecenterOnce({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: false });
    }
  }, [map]); // Runs only exactly once on mount
  return null;
}

export default function MapView({ events, center, zoom, onSelectEvent, selectedEvent, mapStyle, showHeatmap }) {
  const TILE_URLS = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  const currentUrl = TILE_URLS[mapStyle] || TILE_URLS.dark;

  return (
    <div style={{ height: '100%', width: '100%', background: '#0a0a0f', overflow: 'hidden', position: 'absolute', zIndex: 1 }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        className="disaster-leaflet-map"
        worldCopyJump={false}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        minZoom={2}
        maxZoom={18}
      >
        <RecenterOnce center={center} zoom={zoom} />
        <TileLayer url={currentUrl} noWrap={true} bounds={[[-90, -180], [90, 180]]} />
        
        {showHeatmap && <HeatmapLayer events={events} />}

        {/* Using Marker Clustering for dense nodes */}
        <MarkerClusterGroup chunkedLoading maxClusterRadius={60}>
          {events.map((event) => (
            <Marker
              key={event.id}
              position={[event.latitude, event.longitude]}
              icon={createCustomIcon(event.type, event.severity, selectedEvent?.id === event.id)}
              eventHandlers={{
                click: () => onSelectEvent(event),
              }}
            >
              <Popup className="dark-popup">
                <div style={{ padding: '4px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>{event.title}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Magnitude: {event.severity?.toFixed(1) || 'N/A'}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* Render Evacuation Pathing if a very high risk event is selected */}
        {selectedEvent && selectedEvent.risk > 45 && (
          <EvacuationRoute userLocation={center} extremeEvent={selectedEvent} />
        )}
      </MapContainer>
    </div>
  );
}
