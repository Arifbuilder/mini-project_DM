'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../layout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fake chart data to demonstrate "Advanced Analytics"
  const chartData = [
    { time: '00:00', events: 12 }, { time: '04:00', events: 19 },
    { time: '08:00', events: 15 }, { time: '12:00', events: 34 },
    { time: '16:00', events: 28 }, { time: '20:00', events: 45 },
    { time: '24:00', events: 38 },
  ];

  useEffect(() => {
    // If not admin, we would ideally redirect, but for demonstration logic we just try to fetch
    // Realistically the backend guards the data via 403 Forbidden.
    if (!token) return;

    Promise.all([
      fetch(`${API_BASE}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
      fetch(`${API_BASE}/api/admin/reports`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json())
    ])
      .then(([statsData, reportsData]) => {
        if (statsData.error) throw new Error(statsData.error);
        setStats(statsData);
        setReports(reportsData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  const verifyReport = async (id) => {
    await fetch(`${API_BASE}/api/admin/reports/${id}/verify`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    setReports(prev => prev.map(r => r.id === id ? { ...r, isVerified: true } : r));
  };

  const deleteReport = async (id) => {
    await fetch(`${API_BASE}/api/admin/reports/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    setReports(prev => prev.filter(r => r.id !== id));
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="skeleton" style={{ width: 60, height: 60, borderRadius: '50%' }} /></div>;
  }

  if (!stats) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 20 }}>🛑 Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)' }}>You do not have the required Administrator clearance.</p>
        <button onClick={() => router.push('/dashboard')} className="btn-primary" style={{ marginTop: 20 }}>Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 40 }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>🛡️ Global Command Center</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Enterprise Administrator Dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: 15 }}>
          <button onClick={() => router.push('/dashboard')} className="btn-ghost">View Live Map</button>
          <button onClick={logout} className="btn-secondary">Sign Out</button>
        </div>
      </header>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
        {[
          { label: 'Active Personnel', val: stats.totalUsers, color: '#3b82f6' },
          { label: 'Total Comms Logged', val: stats.totalMessages, color: '#8b5cf6' },
          { label: 'Hazards Reported', val: stats.totalReports, color: '#ef4444' },
          { label: '24h Global Incidents', val: stats.activeEvents, color: '#f59e0b' },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: card.color, marginTop: 10 }}>{card.val}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 30 }}>
        {/* Analytics Graph */}
        <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>📈 24h Incident Velocity</h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
                <Line type="monotone" dataKey="events" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hazard Moderation Queue */}
        <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 20 }}>🚨 Crowd Intelligence Validation</h2>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 15 }}>
            {reports.length === 0 ? <p style={{ color: 'var(--text-tertiary)' }}>No unverified reports pending.</p> : null}
            {reports.map(r => (
              <div key={r.id} style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: `1px solid ${r.isVerified ? '#10b98140' : 'var(--border-subtle)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{r.user?.name || r.userName || 'Guest'} <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>★ {r.user?.reputation || 0}</span></span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: '0.9rem', marginBottom: 15 }}>{r.text}</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {!r.isVerified && (
                    <button onClick={() => verifyReport(r.id)} style={{ flex: 1, padding: '6px', background: '#10b98120', color: '#10b981', border: '1px solid #10b98140', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      ✓ Verify
                    </button>
                  )}
                  {r.isVerified && <div style={{ flex: 1, color: '#10b981', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>✓ Officially Verified</div>}
                  <button onClick={() => deleteReport(r.id)} style={{ flex: 1, padding: '6px', background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
