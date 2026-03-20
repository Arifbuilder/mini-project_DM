'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const TYPE_COLORS = {
  earthquake: '#ef4444', flood: '#3b82f6', wildfire: '#f97316', storm: '#8b5cf6',
  volcano: '#dc2626', tsunami: '#06b6d4', landslide: '#a3741e', other: '#6b7280',
  drought: '#eab308', ice: '#67e8f9', extreme_temp: '#f97316',
};
const TYPE_ICONS = {
  earthquake: '🫨', flood: '🌊', wildfire: '🔥', storm: '🌪️', volcano: '🌋',
  tsunami: '🌊', landslide: '⛰️', other: '⚠️', drought: '☀️', ice: '🧊', extreme_temp: '🌡️',
};

const MAP_STYLES = {
  dark: { name: 'Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '© CARTO' },
  satellite: { name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
  terrain: { name: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '© OpenTopoMap' },
  light: { name: 'Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '© CARTO' },
  streets: { name: 'Streets', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OSM' },
};

function RecenterOnce({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom, { animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function PulseMarker({ event, onSelect, isSelected }) {
  const color = TYPE_COLORS[event.type] || '#6b7280';
  const r = Math.max(5, Math.min(14, (event.severity || 3) * 1.6));
  return (
    <>
      <CircleMarker center={[event.latitude, event.longitude]} radius={r + 8}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 0, className: 'pulse-ring' }} />
      <CircleMarker center={[event.latitude, event.longitude]} radius={r}
        pathOptions={{ color: isSelected ? '#fff' : color, fillColor: color, fillOpacity: 0.8, weight: isSelected ? 3 : 1.5 }}
        eventHandlers={{ click: () => onSelect(event) }}>
        <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
          <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px 2px', minWidth: 120 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 2 }}>
              {TYPE_ICONS[event.type] || '⚠️'} {event.title?.slice(0, 40)}
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
              Severity: {event.severity?.toFixed(1)} • {event.source?.toUpperCase()}
            </div>
          </div>
        </Tooltip>
      </CircleMarker>
    </>
  );
}

export default function MapView({ events = [], center = [35.68, 139.69], zoom = 6, onSelectEvent, selectedEvent, mapStyle }) {
  const style = MAP_STYLES[mapStyle] || MAP_STYLES.dark;

  return (
    <>
      <style>{`
        .map-root { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1; overflow: hidden; }
        .map-root .leaflet-container {
          width: 100% !important; height: 100% !important;
          z-index: 1 !important; background: #0a0a0f !important;
        }
        .pulse-ring { animation: mpulse 2s ease-out infinite; }
        @keyframes mpulse { 0%{opacity:.6} 50%{opacity:.15} 100%{opacity:.6} }
        .leaflet-tooltip {
          background: rgba(10,10,15,0.92) !important; color: #f0f0f5 !important;
          border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 10px !important;
          padding: 8px 12px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
          backdrop-filter: blur(12px) !important; font-family: 'Inter', sans-serif !important;
        }
        .leaflet-tooltip-top:before { border-top-color: rgba(10,10,15,0.92) !important; }
      `}</style>
      <div className="map-root">
        <MapContainer
          center={center}
          zoom={zoom}
          minZoom={2}
          maxZoom={18}
          maxBounds={[[-85, -180], [85, 180]]}
          maxBoundsViscosity={1.0}
          worldCopyJump={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
          zoomControl={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            key={mapStyle}
            url={style.url}
            attribution={style.attr}
            noWrap={true}
            bounds={[[-85, -180], [85, 180]]}
          />
          <RecenterOnce center={center} zoom={zoom} />
          {events.map(ev => (
            <PulseMarker key={ev.id} event={ev} onSelect={onSelectEvent} isSelected={selectedEvent?.id === ev.id} />
          ))}
        </MapContainer>
      </div>
    </>
  );
}
