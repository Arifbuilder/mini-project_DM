'use client';

import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    icon: '🗺️',
    title: 'Interactive Live Map',
    desc: 'Real-time disaster tracking with animated markers, heatmaps, and satellite views on a stunning interactive globe.',
    color: '#6366f1',
  },
  {
    icon: '📡',
    title: 'Multi-Source Intelligence',
    desc: 'Aggregated data from USGS, NASA EONET, GDACS, and OpenWeatherMap — normalized and deduplicated in real-time.',
    color: '#3b82f6',
  },
  {
    icon: '🧠',
    title: 'AI Risk Scoring',
    desc: 'Smart algorithms combine proximity, severity, and recency to calculate personalized risk scores for your area.',
    color: '#8b5cf6',
  },
  {
    icon: '⚡',
    title: 'Instant Alerts',
    desc: 'WebSocket-powered real-time alerts when disasters enter your monitoring radius. Zero delay.',
    color: '#f59e0b',
  },
  {
    icon: '🛡️',
    title: 'Safety Guidelines',
    desc: 'Contextual safety tips for every disaster type — Drop-Cover-Hold for earthquakes, evacuation for wildfires, and more.',
    color: '#10b981',
  },
  {
    icon: '🔬',
    title: 'Experimental Mode',
    desc: 'Test every feature with simulated high-density disaster scenarios — perfect for exploring capabilities.',
    color: '#ec4899',
  },
];

const disasterTypes = [
  { icon: '🫨', name: 'Earthquakes', color: '#ef4444', stat: '300+', desc: 'daily monitored' },
  { icon: '🔥', name: 'Wildfires', color: '#f97316', stat: '100+', desc: 'active fires' },
  { icon: '🌪️', name: 'Storms', color: '#8b5cf6', stat: '50+', desc: 'cyclone tracks' },
  { icon: '🌊', name: 'Floods', color: '#3b82f6', stat: '80+', desc: 'flood zones' },
  { icon: '🌋', name: 'Volcanoes', color: '#dc2626', stat: '20+', desc: 'active vents' },
  { icon: '🌊', name: 'Tsunamis', color: '#06b6d4', stat: '24/7', desc: 'coastal watch' },
];

const team = [
  { name: 'DisasterIntel Team', role: 'Building safer communities through technology', emoji: '🌍' },
];

export default function LandingPage() {
  const router = useRouter();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Navbar */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 100, background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>🌍</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            DisasterIntel
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push('/login')} className="btn-ghost" style={{ color: 'var(--text-secondary)' }}>
            Sign In
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push('/login')} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.85rem' }}>
            Get Started →
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 20px 80px', position: 'relative', overflow: 'hidden' }}
      >
        {/* Animated gradient orbs */}
        {[
          { w: 600, h: 600, bg: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', top: '-15%', left: '10%' },
          { w: 500, h: 500, bg: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', bottom: '0%', right: '5%' },
          { w: 400, h: 400, bg: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', top: '30%', left: '60%' },
          { w: 350, h: 350, bg: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)', bottom: '20%', left: '5%' },
        ].map((orb, i) => (
          <motion.div
            key={i}
            style={{ position: 'absolute', width: orb.w, height: orb.h, borderRadius: '50%', background: orb.bg, top: orb.top, left: orb.left, right: orb.right, bottom: orb.bottom, filter: 'blur(60px)', pointerEvents: 'none' }}
            animate={{ x: [0, 40, -30, 50, 0], y: [0, -60, 30, 10, 0], scale: [1, 1.15, 0.9, 1.1, 1] }}
            transition={{ duration: 18 + i * 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} style={{ position: 'relative', zIndex: 10 }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px',
              borderRadius: 'var(--radius-full)', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
              fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 28, letterSpacing: '0.02em',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />
            Live Monitoring • 400+ Events Tracked
          </motion.div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em',
            maxWidth: 800, margin: '0 auto 20px',
          }}>
            Real-Time{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 200%', animation: 'gradientShift 4s ease infinite' }}>
              Disaster Intelligence
            </span>
            {' '}Platform
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Monitor natural disasters globally. Get personalized alerts based on your location.
            Make informed decisions with AI-powered risk scoring.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/login')} className="btn-primary" style={{ padding: '16px 36px', fontSize: '1rem', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
              🚀 Launch Platform
            </motion.button>
            <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/login?mode=demo')} className="btn-secondary" style={{ padding: '16px 36px', fontSize: '1rem' }}>
              🔬 Try Experimental Mode
            </motion.button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ position: 'absolute', bottom: 40, color: 'var(--text-tertiary)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
        >
          <span>Scroll to explore</span>
          <span style={{ fontSize: '1.2rem' }}>↓</span>
        </motion.div>
      </motion.section>

      {/* Disaster Types Section */}
      <section style={{ padding: '100px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <p style={{ color: '#ec4899', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>WHAT WE TRACK</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Every Disaster. <span style={{ color: 'var(--text-tertiary)' }}>Everywhere.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, marginBottom: 50, fontSize: '1.05rem' }}>
            We monitor all major disaster categories in real-time across the globe.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
          {disasterTypes.map((dt, i) => (
            <motion.div
              key={dt.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -6, scale: 1.03 }}
              style={{
                padding: '28px 22px', borderRadius: 'var(--radius-lg)',
                background: `linear-gradient(135deg, ${dt.color}12 0%, ${dt.color}06 100%)`,
                border: `1px solid ${dt.color}25`,
                textAlign: 'center', cursor: 'default',
                transition: 'box-shadow 0.3s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = `0 8px 32px ${dt.color}20`}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{dt.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{dt.name}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: dt.color, marginBottom: 2 }}>{dt.stat}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{dt.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <p style={{ color: '#6366f1', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>FEATURES</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 50 }}>
            Built for <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligence</span>
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="glass-card"
              style={{ padding: '30px 26px', cursor: 'default' }}
            >
              <div style={{
                width: 50, height: 50, borderRadius: 'var(--radius-md)',
                background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', marginBottom: 16,
              }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section style={{ padding: '80px 40px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <p style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>ABOUT US</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Our Mission
          </h2>
          <div className="glass-card" style={{ padding: '40px 36px', textAlign: 'left' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 20 }}>
              <strong style={{ color: 'var(--text-primary)' }}>DisasterIntel</strong> was born from a simple idea: everyone deserves
              instant access to critical disaster information, presented beautifully and actionable from the first glance.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 20 }}>
              We aggregate data from the world's most trusted sources — <strong style={{ color: '#3b82f6' }}>USGS</strong>,{' '}
              <strong style={{ color: '#ef4444' }}>NASA Earth Observatory</strong>,{' '}
              <strong style={{ color: '#f59e0b' }}>GDACS</strong>, and{' '}
              <strong style={{ color: '#10b981' }}>OpenWeatherMap</strong> — and transform it into a unified, real-time intelligence dashboard.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8 }}>
              Our goal is to bridge the gap between raw seismological data and human understanding.
              Whether you're a disaster response coordinator, a researcher, or simply a concerned citizen —
              DisasterIntel gives you the tools to <strong style={{ color: 'var(--text-primary)' }}>stay informed, stay prepared, stay safe</strong>.
            </p>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 40px 120px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Ready to Monitor the Planet?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
            Join thousands of users who trust DisasterIntel for real-time situational awareness.
          </p>
          <motion.button whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/login')} className="btn-primary" style={{ padding: '18px 48px', fontSize: '1.1rem', boxShadow: '0 12px 40px rgba(99,102,241,0.4)' }}>
            🌍 Get Started — Free
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '30px 40px', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        color: 'var(--text-tertiary)', fontSize: '0.8rem',
      }}>
        <span>© 2026 DisasterIntel. Built for a safer world.</span>
        <span>USGS • NASA • GDACS • OpenWeatherMap</span>
      </footer>
    </div>
  );
}
