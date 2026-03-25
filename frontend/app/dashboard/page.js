'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useTheme } from '../layout';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('../components/MapView'), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />,
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function riskScore(event, userLat, userLng) {
  const dist = haversine(userLat, userLng, event.latitude, event.longitude);
  const proximity = 1 / (1 + dist / 100);
  const ageH = (Date.now() - new Date(event.timestamp).getTime()) / 3600000;
  const recency = 1 / (1 + ageH / 24);
  return Math.round(Math.min(100, (event.severity || 1) / 10 * proximity * recency * 100));
}

const TYPE_ICONS = { earthquake: '🫨', flood: '🌊', wildfire: '🔥', storm: '🌪️', volcano: '🌋', tsunami: '🌊', landslide: '⛰️', other: '⚠️', drought: '☀️', ice: '🧊', extreme_temp: '🌡️' };
const TYPE_COLORS = { earthquake: '#ef4444', flood: '#3b82f6', wildfire: '#f97316', storm: '#8b5cf6', volcano: '#dc2626', tsunami: '#06b6d4', landslide: '#a3741e', other: '#6b7280' };
const TYPE_IMAGES = {
  earthquake: 'https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=400&q=80',
  flood: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=400&q=80',
  wildfire: 'https://images.unsplash.com/photo-1621570169477-aa1cd0145846?w=400&q=80',
  storm: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=400&q=80',
  volcano: 'https://images.unsplash.com/photo-1554232456-8727aae0cfa4?w=400&q=80',
  tsunami: 'https://images.unsplash.com/photo-1559060017-445fb29af6ba?w=400&q=80',
};

function severityLabel(s) {
  if (s >= 7) return { text: 'Critical', cls: 'badge-danger' };
  if (s >= 4) return { text: 'Moderate', cls: 'badge-warning' };
  return { text: 'Low', cls: 'badge-success' };
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function generateExperimentalData() {
  const types = ['earthquake', 'flood', 'wildfire', 'storm', 'volcano', 'tsunami', 'landslide'];
  const cities = [
    { name: 'Tokyo', lat: 35.68, lng: 139.69 }, { name: 'San Francisco', lat: 37.77, lng: -122.42 },
    { name: 'Mexico City', lat: 19.43, lng: -99.13 }, { name: 'Jakarta', lat: -6.21, lng: 106.85 },
    { name: 'Istanbul', lat: 41.01, lng: 28.98 }, { name: 'Mumbai', lat: 19.08, lng: 72.88 },
    { name: 'Manila', lat: 14.6, lng: 120.98 }, { name: 'Santiago', lat: -33.45, lng: -70.67 },
    { name: 'Los Angeles', lat: 34.05, lng: -118.24 }, { name: 'Naples', lat: 40.85, lng: 14.27 },
    { name: 'Dhaka', lat: 23.81, lng: 90.41 }, { name: 'Lima', lat: -12.05, lng: -77.04 },
    { name: 'Kathmandu', lat: 27.71, lng: 85.32 }, { name: 'Auckland', lat: -36.85, lng: 174.76 },
    { name: 'Taipei', lat: 25.03, lng: 121.57 }, { name: 'Sydney', lat: -33.87, lng: 151.21 },
    { name: 'London', lat: 51.51, lng: -0.13 }, { name: 'Lisbon', lat: 38.72, lng: -9.14 },
    { name: 'Reykjavik', lat: 64.15, lng: -21.94 }, { name: 'Anchorage', lat: 61.22, lng: -149.9 },
  ];
  const descriptions = {
    earthquake: 'Seismic activity detected. Residents advised to take protective actions.',
    flood: 'Rising water levels threaten low-lying areas. Evacuations underway.',
    wildfire: 'Rapidly spreading fire affecting surrounding forests.',
    storm: 'Severe weather system with high winds and heavy precipitation.',
    volcano: 'Increased volcanic activity. Ash plume reaching commercial flight altitudes.',
    tsunami: 'Tsunami warning issued following offshore seismic event.',
    landslide: 'Slope instability with risk of debris flow in mountainous terrain.',
  };
  const events = [];
  for (let i = 0; i < 85; i++) {
    const city = cities[i % cities.length];
    const type = types[Math.floor(Math.random() * types.length)];
    const severity = +(Math.random() * 9 + 1).toFixed(1);
    events.push({
      id: `exp-${i}`, externalId: `exp-${i}`, source: 'experimental', type, severity,
      title: `${type === 'earthquake' ? `M${severity.toFixed(1)}` : severity >= 7 ? 'CRITICAL' : 'Active'} ${type.charAt(0).toUpperCase() + type.slice(1)} near ${city.name}`,
      description: descriptions[type] || 'Event detected by experimental monitoring.',
      latitude: city.lat + (Math.random() - 0.5) * 4, longitude: city.lng + (Math.random() - 0.5) * 4,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 48) * 3600000).toISOString(),
    });
  }
  return events;
}

const MAP_STYLES = ['dark', 'satellite', 'terrain', 'light', 'streets'];
const MAP_STYLE_NAMES = { dark: 'Dark', satellite: 'Satellite', terrain: 'Terrain', light: 'Light', streets: 'Streets' };

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [showAlerts, setShowAlerts] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [experimentalMode, setExperimentalMode] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [mapStyle, setMapStyle] = useState('dark');
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' or 'chat'
  const [messages, setMessages] = useState([]);
  const [draftMessage, setDraftMessage] = useState('');
  const chatScrollRef = useRef(null);
  const [aiData, setAiData] = useState(null);
  const [fetchingAi, setFetchingAi] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('userPrefs');
    if (stored) setPrefs(JSON.parse(stored));
    else setPrefs({ latitude: 35.68, longitude: 139.69, radiusKm: 500, locationName: 'Default' });
    if (localStorage.getItem('experimentalMode') === 'true') setExperimentalMode(true);
  }, []);

  const fetchRealEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (prefs?.latitude) params.set('lat', prefs.latitude);
      if (prefs?.longitude) params.set('lng', prefs.longitude);
      if (prefs?.radiusKm) params.set('radius', prefs.radiusKm);
      if (filterType !== 'all') params.set('type', filterType);
      const res = await fetch(`${API_BASE}/api/events?${params}`);
      const data = await res.json();
      return data.events || [];
    } catch { return []; }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/messages`);
      const data = await res.json();
      setMessages(data);
    } catch { }
  };

  const fetchEvents = useCallback(async () => {
    try {
      const real = await fetchRealEvents();
      if (experimentalMode) {
        setEvents([...generateExperimentalData(), ...real]);
      } else {
        setEvents(real);
      }
    } catch { } finally { setLoading(false); }
  }, [prefs, filterType, experimentalMode]);

  const fetchStats = useCallback(async () => {
    try { const res = await fetch(`${API_BASE}/api/events/stats`); setStats(await res.json()); } catch { }
  }, []);

  useEffect(() => {
    if (prefs) {
      fetchEvents(); fetchStats(); fetchMessages();
      const iv = setInterval(() => { fetchEvents(); fetchStats(); }, 60000);
      return () => clearInterval(iv);
    }
  }, [prefs, fetchEvents, fetchStats]);

  useEffect(() => {
    if (selectedEvent) {
      setAiData(null);
      setFetchingAi(true);
      fetch(`${API_BASE}/api/ai/predict/${selectedEvent.id}`)
        .then(res => res.json())
        .then(data => { setAiData(data); setFetchingAi(false); })
        .catch(() => setFetchingAi(false));
    }
  }, [selectedEvent?.id]);

  useEffect(() => {
    let socket;
    const connect = async () => {
      try {
        const { io } = await import('socket.io-client');
        socket = io(API_BASE, { transports: ['websocket', 'polling'] });
        
        // Subscribe to local alerts
        if (prefs?.latitude) {
          socket.emit('subscribe:location', {
            latitude: prefs.latitude,
            longitude: prefs.longitude,
            radiusKm: prefs.radiusKm || 500
          });
        }

        socket.on('events:new', (n) => {
          setNotifications(prev => [...n.slice(0, 3).map(e => ({ ...e, id: e.id + '-n-' + Date.now() })), ...prev].slice(0, 20));
          fetchEvents();
        });
        socket.on('events:update', () => fetchEvents());
        socket.on('message:new', (msg) => {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (activeTab === 'chat' && chatScrollRef.current) {
            setTimeout(() => chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight, 100);
          }
        });
      } catch { }
    };
    connect();
    return () => { if (socket) socket.disconnect(); };
  }, [prefs, activeTab]);

  const toggleExperimental = () => {
    const next = !experimentalMode;
    setExperimentalMode(next);
    localStorage.setItem('experimentalMode', next.toString());
    setLoading(true);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!draftMessage.trim()) return;
    try {
      await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text: draftMessage, userName: user?.name || 'Guest' })
      });
      setDraftMessage('');
    } catch (err) { console.error('Failed to send msg', err); }
  };

  const reportDisaster = async () => {
    const desc = prompt('Describe the emergency or hazard:');
    if (!desc) return;
    try {
      await fetch(`${API_BASE}/api/messages/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          description: desc,
          disasterType: 'other',
          latitude: prefs?.latitude,
          longitude: prefs?.longitude,
          locationName: prefs?.locationName || 'Unknown',
          userName: user?.name || 'Guest'
        })
      });
      setActiveTab('chat');
      // Toast or simple alert
      alert('Hazard report successfully transmitted to Global Command!');
    } catch (err) { console.error('Failed to report', err); alert('Failed to connect to Command Center.'); }
  };

  const overallRisk = events.length > 0 && prefs?.latitude
    ? Math.round(events.slice(0, 50).reduce((s, e) => s + riskScore(e, prefs.latitude, prefs.longitude), 0) / Math.min(50, events.length))
    : 0;
  const riskLevel = overallRisk >= 60 ? { text: 'High Risk', color: '#ef4444' } : overallRisk >= 30 ? { text: 'Moderate', color: '#f59e0b' } : { text: 'Low Risk', color: '#10b981' };
  const topEvents = events.map(e => ({ ...e, risk: prefs?.latitude ? riskScore(e, prefs.latitude, prefs.longitude) : 0 })).sort((a, b) => b.risk - a.risk);

  const timelineGroups = {};
  if (showTimeline) {
    topEvents.slice(0, 100).forEach(e => {
      const h = new Date(e.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
      if (!timelineGroups[h]) timelineGroups[h] = [];
      timelineGroups[h].push(e);
    });
  }

  // Overlay styles
  const cardOverlayStyle = {
    padding: '14px 18px', pointerEvents: 'auto',
    background: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      {/* ── HEADER ── */}
      <header style={{
        padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)',
        zIndex: 50, flexShrink: 0, height: 52,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.3rem' }}>🌍</span>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DisasterIntel</h1>
          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>LIVE</span>
          {experimentalMode && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(245,158,11,0.2))', border: '1px solid rgba(236,72,153,0.3)', color: '#f472b6', fontSize: '0.65rem', fontWeight: 700 }}>
              🔬 EXPERIMENTAL
            </motion.span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={reportDisaster} style={{
            background: 'linear-gradient(135deg, #ef4444, #f97316)', color: 'white', border: 'none',
            padding: '6px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', fontWeight: 700,
            cursor: 'pointer', marginRight: 10, boxShadow: '0 4px 12px rgba(239,68,68,0.4)'
          }}>
            🚨 Report Hazard
          </button>
          <ToolbarBtn icon="🔥" active={showHeatmap} onClick={() => setShowHeatmap(p => !p)} title="Toggle Heatmap" />
          <ToolbarBtn icon="🔬" active={experimentalMode} onClick={toggleExperimental} title="Experimental Mode" activeColor="rgba(236,72,153,0.2)" activeBorder="rgba(236,72,153,0.3)" />
          <ToolbarBtn icon="📊" active={showTimeline} onClick={() => setShowTimeline(p => !p)} title="Timeline View" />
          <ToolbarBtn icon="🔔" active={showAlerts} onClick={() => setShowAlerts(p => !p)} title="Alerts" badge={notifications.length} />
          <ToolbarBtn icon={theme === 'dark' ? '☀️' : '🌙'} onClick={toggleTheme} title="Toggle Theme" />
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => { logout(); router.push('/'); }} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
            👤 {user?.name || 'Guest'}
          </motion.button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── MAP AREA ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {prefs && (
            <MapView
              events={topEvents.slice(0, 200)}
              center={[prefs.latitude || 35.68, prefs.longitude || 139.69]}
              zoom={prefs.radiusKm > 300 ? 4 : prefs.radiusKm > 100 ? 6 : 8}
              onSelectEvent={setSelectedEvent}
              selectedEvent={selectedEvent}
              mapStyle={mapStyle}
              showHeatmap={showHeatmap}
            />
          )}

          {/* Overlays */}
          <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 5, zIndex: 10, flexWrap: 'wrap', maxWidth: 'calc(100% - 320px)', pointerEvents: 'none' }}>
            {['all', 'earthquake', 'flood', 'wildfire', 'storm', 'volcano', 'tsunami'].map(t => (
              <motion.button key={t} whileTap={{ scale: 0.95 }} onClick={() => setFilterType(t)}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                  background: filterType === t ? (t === 'all' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : TYPE_COLORS[t]) : 'rgba(10,10,15,0.85)',
                  color: filterType === t ? 'white' : 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
                  textTransform: 'capitalize', transition: 'all 0.2s ease', pointerEvents: 'auto',
                }}>
                {t === 'all' ? '🌐 All' : `${TYPE_ICONS[t] || '⚠️'} ${t}`}
              </motion.button>
            ))}
          </div>

          <div style={{
            position: 'absolute', top: 14, right: 14, zIndex: 10,
            display: 'flex', gap: 3, padding: 3, background: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'auto',
          }}>
            {MAP_STYLES.map(key => (
              <button key={key} onClick={() => setMapStyle(key)}
                style={{
                  padding: '5px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
                  background: mapStyle === key ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(0,0,0,0)',
                  color: mapStyle === key ? 'white' : 'rgba(255,255,255,0.5)', border: 'none', transition: 'all 0.2s ease',
                }}>{MAP_STYLE_NAMES[key]}</button>
            ))}
          </div>

          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', gap: 10, zIndex: 10, pointerEvents: 'none', flexWrap: 'wrap' }}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ ...cardOverlayStyle, minWidth: 140 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>Area Risk</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: riskLevel.color, lineHeight: 1 }}>{overallRisk}</span>
                <span style={{ fontSize: '0.65rem', color: riskLevel.color, fontWeight: 600 }}>{riskLevel.text}</span>
              </div>
              <div style={{ marginTop: 5, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${overallRisk}%` }} transition={{ duration: 1 }} style={{ height: '100%', borderRadius: 2, background: riskLevel.color }} />
              </div>
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ ...cardOverlayStyle, minWidth: 150 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>Active Events</div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1, background: 'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{events.length}</span>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>monitored</div>
                </div>
                <div>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1, color: 'rgba(255,255,255,0.5)' }}>{stats?.total || '—'}</span>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>global</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <AnimatePresence>
          {showAlerts && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 380, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                flexShrink: 0, borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 40,
              }}>
              {/* Sidebar Tabs */}
              <div style={{ padding: '4px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 4, flexShrink: 0, background: 'var(--bg-tertiary)' }}>
                <button onClick={() => setActiveTab('alerts')} style={{
                  flex: 1, padding: '8px 0', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: activeTab === 'alerts' ? 'var(--bg-glass)' : 'transparent',
                  color: activeTab === 'alerts' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: activeTab === 'alerts' ? 700 : 500, fontSize: '0.8rem', transition: 'all 0.2s',
                  boxShadow: activeTab === 'alerts' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                }}>
                  {showTimeline ? '📊 Timeline' : '⚡ Live Alerts'}
                </button>
                <button onClick={() => { setActiveTab('chat'); setTimeout(() => chatScrollRef.current && (chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight), 50); }} style={{
                  flex: 1, padding: '8px 0', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: activeTab === 'chat' ? 'var(--bg-glass)' : 'transparent',
                  color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: activeTab === 'chat' ? 700 : 500, fontSize: '0.8rem', transition: 'all 0.2s',
                  boxShadow: activeTab === 'chat' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                }}>
                  💬 Community
                </button>
              </div>

              {activeTab === 'alerts' && (
                <>
                  {/* SELECTED EVENT DETAIL */}
                  <AnimatePresence>
                    {selectedEvent && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)' }}>
                        {TYPE_IMAGES[selectedEvent.type] && (
                          <div style={{ width: '100%', height: 120, background: `url(${TYPE_IMAGES[selectedEvent.type]}) center/cover`, position: 'relative' }}>
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, var(--bg-secondary))' }} />
                          </div>
                        )}
                        <div style={{ padding: '16px 20px', maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: `${TYPE_COLORS[selectedEvent.type] || '#6b7280'}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                {TYPE_ICONS[selectedEvent.type] || '⚠️'}
                              </span>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>{selectedEvent.title}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{selectedEvent.source?.toUpperCase()} • {timeAgo(selectedEvent.timestamp)}</div>
                              </div>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                          </div>
                          
                          {/* Expanded detail box */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                            <div style={{ padding: '8px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>MAGNITUDE / LEVEL</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: TYPE_COLORS[selectedEvent.type] || '#fff' }}>{selectedEvent.severity?.toFixed(1) || 'N/A'}</div>
                            </div>
                            <div style={{ padding: '8px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>RISK INDEX</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: selectedEvent.risk >= 60 ? '#ef4444' : selectedEvent.risk >= 30 ? '#f59e0b' : '#10b981' }}>{selectedEvent.risk ?? '—'}</div>
                            </div>
                            <div style={{ padding: '8px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>LATITUDE</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{selectedEvent.latitude?.toFixed(4)}°</div>
                            </div>
                            <div style={{ padding: '8px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>LONGITUDE</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{selectedEvent.longitude?.toFixed(4)}°</div>
                            </div>
                          </div>

                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                            {selectedEvent.description || 'No extended description available for this incident.'}
                          </p>

                          <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a5b4fc', marginBottom: 4 }}>🛡️ Safety Guidelines</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              {selectedEvent.type === 'earthquake' && 'Drop, Cover, Hold On. Stay away from windows and heavy furniture. Expect aftershocks.'}
                              {selectedEvent.type === 'flood' && 'Move to higher ground immediately. Do not walk, swim, or drive through floodwaters. Follow local evacuation orders.'}
                              {selectedEvent.type === 'wildfire' && 'Evacuate immediately if instructed. Cover your nose and mouth. Keep vehicle windows closed.'}
                              {selectedEvent.type === 'storm' && 'Seek shelter indoors, away from windows. Wait for official all-clear signals before going out.'}
                              {selectedEvent.type === 'volcano' && 'Evacuate following designated routes. Wear a mask to avoid inhaling ash. Protect your eyes.'}
                              {selectedEvent.type === 'tsunami' && 'If you feel an earthquake near the coast, move immediately inland or to higher ground. Do not wait for a warning.'}
                              {selectedEvent.type === 'landslide' && 'Stay alert and awake. Listen for unusual sounds. If you suspect imminent danger, evacuate immediately.'}
                              {!['earthquake', 'flood', 'wildfire', 'storm', 'volcano', 'tsunami', 'landslide'].includes(selectedEvent.type) && 'Review local emergency protocols. Stay tuned to official radio or television broadcasts.'}
                            </p>
                          </div>

                          {/* AI PREDICTOR BLOCK */}
                          {fetchingAi && (
                            <div style={{ marginTop: 14, padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', gap: 10 }}>
                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(236,72,153,0.4)', borderTopColor: '#f472b6' }} />
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>AI analyzing heuristics...</div>
                            </div>
                          )}
                          {!fetchingAi && aiData && !aiData.error && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop: 14, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.1))', border: '1px solid rgba(236,72,153,0.2)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f472b6', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  🤖 AI Risk Predictor
                                </div>
                                <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>{aiData.aiModel}</div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                  <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>AFTERSHOCK PROB.</div>
                                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{aiData.aftershockProbability}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>STABILIZATION EST.</div>
                                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{aiData.estimatedStabilization}</div>
                                </div>
                                <div style={{ gridColumn: 'span 2', marginTop: 2 }}>
                                  <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>SECONDARY IMPACT RISK</div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: 2, color: aiData.secondaryImpactRisk.includes('High') ? '#ef4444' : aiData.secondaryImpactRisk.includes('Moderate') ? '#f59e0b' : '#10b981' }}>{aiData.secondaryImpactRisk}</div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Event list */}
                  <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px' }}>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 5, borderRadius: 'var(--radius-sm)' }} />)
                    ) : showTimeline ? (
                      Object.entries(timelineGroups).slice(0, 12).map(([time, evts]) => (
                        <div key={time} style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4, padding: '0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-primary)' }} /> {time} <span style={{ fontSize: '0.6rem' }}>({evts.length})</span>
                          </div>
                          {evts.slice(0, 4).map(e => <EventRow key={e.id} event={e} selected={selectedEvent?.id === e.id} onClick={() => setSelectedEvent(e)} />)}
                        </div>
                      ))
                    ) : topEvents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-tertiary)' }}>
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 10 }}>✅</span>
                        <p style={{ fontWeight: 600 }}>All Clear</p><p style={{ fontSize: '0.8rem' }}>No active disasters</p>
                      </div>
                    ) : topEvents.slice(0, 50).map((event, i) => (
                      <EventRow key={event.id} event={event} selected={selectedEvent?.id === event.id} onClick={() => setSelectedEvent(event)} delay={i * 0.015} />
                    ))}
                  </div>

                  {/* Notification toasts */}
                  <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
                    <AnimatePresence>
                      {notifications.slice(0, 2).map((n) => (
                        <motion.div key={n.id} initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }}
                          style={{ marginBottom: 5, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.75rem', fontWeight: 600, backdropFilter: 'blur(10px)' }}>
                          🆕 {n.title}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {activeTab === 'chat' && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                  <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: 40, fontSize: '0.8rem' }}>
                        No live messages yet. Be the first to report!
                      </div>
                    ) : messages.map((m, i) => (
                      <div key={m.id || i} style={{
                        background: m.type === 'report' ? 'rgba(239,68,68,0.1)' : 'var(--bg-glass)',
                        border: `1px solid ${m.type === 'report' ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)'}`,
                        padding: '10px 14px', borderRadius: 'var(--radius-lg)',
                        borderBottomLeftRadius: m.userName === (user?.name || 'Guest') ? 'var(--radius-lg)' : 0,
                        borderBottomRightRadius: m.userName === (user?.name || 'Guest') ? 0 : 'var(--radius-lg)',
                        alignSelf: m.userName === (user?.name || 'Guest') ? 'flex-end' : 'flex-start',
                        maxWidth: '85%'
                      }}>
                        <div style={{ fontSize: '0.65rem', color: m.type === 'report' ? '#fca5a5' : 'var(--text-tertiary)', marginBottom: 4, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{m.userName}</span>
                          <span style={{ fontWeight: 400, opacity: 0.7 }}>{new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={sendMessage} style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={draftMessage}
                        onChange={(e) => setDraftMessage(e.target.value)}
                        placeholder="Type a message..."
                        style={{
                          flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-full)',
                          border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)',
                          color: 'var(--text-primary)', fontSize: '0.85rem'
                        }}
                      />
                      <button type="submit" disabled={!draftMessage.trim()} style={{
                        width: 40, height: 40, borderRadius: '50%', border: 'none',
                        background: draftMessage.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-glass)',
                        color: 'white', cursor: draftMessage.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                        opacity: draftMessage.trim() ? 1 : 0.5
                      }}>
                        ➤
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToolbarBtn({ icon, active, onClick, title, badge, activeColor, activeBorder }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} title={title}
      style={{
        position: 'relative', width: 34, height: 34, borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? (activeColor || 'var(--accent-glow)') : 'var(--bg-glass)',
        border: `1px solid ${active ? (activeBorder || 'var(--accent-primary)') : 'var(--border-subtle)'}`,
        fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s ease',
      }}>
      {icon}
      {badge > 0 && <span style={{ position: 'absolute', top: -3, right: -3, width: 15, height: 15, borderRadius: '50%', background: '#ef4444', color: 'white', fontSize: '0.55rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Math.min(badge, 9)}</span>}
    </motion.button>
  );
}

function EventRow({ event, selected, onClick, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }} onClick={onClick}
      style={{
        display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: 2,
        background: selected ? 'var(--bg-glass)' : 'transparent',
        border: selected ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition: 'all 0.12s ease',
      }}>
      <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: `${TYPE_COLORS[event.type] || '#6b7280'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', flexShrink: 0 }}>
        {TYPE_ICONS[event.type] || '⚠️'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 3, alignItems: 'center' }}>
          <span className={`badge ${severityLabel(event.severity).cls}`} style={{ fontSize: '0.6rem', padding: '1px 5px' }}>{severityLabel(event.severity).text}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{timeAgo(event.timestamp)}</span>
        </div>
      </div>
      {event.risk > 0 && <div style={{ fontSize: '0.65rem', fontWeight: 700, color: event.risk >= 60 ? '#ef4444' : event.risk >= 30 ? '#f59e0b' : '#10b981', alignSelf: 'center' }}>{event.risk}</div>}
    </motion.div>
  );
}
