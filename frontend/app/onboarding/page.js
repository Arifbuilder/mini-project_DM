'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../layout';

const DISASTER_TYPES = [
  { id: 'earthquake', label: 'Earthquakes', icon: '🫨', color: '#ef4444' },
  { id: 'flood', label: 'Floods', icon: '🌊', color: '#3b82f6' },
  { id: 'wildfire', label: 'Wildfires', icon: '🔥', color: '#f97316' },
  { id: 'storm', label: 'Storms', icon: '🌪️', color: '#8b5cf6' },
  { id: 'tsunami', label: 'Tsunamis', icon: '🌊', color: '#06b6d4' },
  { id: 'landslide', label: 'Landslides', icon: '⛰️', color: '#a3741e' },
  { id: 'volcano', label: 'Volcanoes', icon: '🌋', color: '#dc2626' },
];

const SENSITIVITY_LEVELS = [
  { id: 'low', label: 'Low', desc: 'Only major events', color: '#10b981' },
  { id: 'medium', label: 'Medium', desc: 'Moderate + major', color: '#f59e0b' },
  { id: 'high', label: 'High', desc: 'All events', color: '#ef4444' },
];

const steps = ['Location', 'Disasters', 'Range', 'Sensitivity', 'Notifications'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);
  const [prefs, setPrefs] = useState({
    latitude: null,
    longitude: null,
    locationName: '',
    disasterTypes: ['earthquake', 'flood', 'wildfire', 'storm'],
    radiusKm: 100,
    sensitivity: 'medium',
    notificationChannels: ['in-app'],
  });

  const { token, API } = useAuth();
  const router = useRouter();

  const detectLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setPrefs(p => ({ ...p, latitude, longitude, locationName: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°` }));
          setLocationLoading(false);
        },
        () => {
          setPrefs(p => ({ ...p, latitude: 35.68, longitude: 139.69, locationName: 'Tokyo, Japan (default)' }));
          setLocationLoading(false);
        },
        { timeout: 10000 }
      );
    } else {
      setPrefs(p => ({ ...p, latitude: 35.68, longitude: 139.69, locationName: 'Tokyo, Japan (default)' }));
      setLocationLoading(false);
    }
  };

  const toggleDisasterType = (id) => {
    setPrefs(p => ({
      ...p,
      disasterTypes: p.disasterTypes.includes(id)
        ? p.disasterTypes.filter(t => t !== id)
        : [...p.disasterTypes, id],
    }));
  };

  const toggleChannel = (ch) => {
    setPrefs(p => ({
      ...p,
      notificationChannels: p.notificationChannels.includes(ch)
        ? p.notificationChannels.filter(c => c !== ch)
        : [...p.notificationChannels, ch],
    }));
  };

  const saveAndContinue = async () => {
    try {
      if (token) {
        await fetch(`${API}/api/preferences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(prefs),
        });
      }
      // Also save to localStorage for quick access
      localStorage.setItem('userPrefs', JSON.stringify(prefs));
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to save preferences:', err);
      localStorage.setItem('userPrefs', JSON.stringify(prefs));
      router.push('/dashboard');
    }
  };

  const nextStep = () => {
    if (step === steps.length - 1) {
      saveAndContinue();
    } else {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(s => s - 1);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          maxWidth: 520,
          width: '100%',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Customize Your Experience
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Step {step + 1} of {steps.length} — {steps[step]}
          </p>
        </div>

        {/* Progress */}
        <div style={{
          display: 'flex',
          gap: 6,
          marginBottom: 32,
        }}>
          {steps.map((_, i) => (
            <motion.div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i <= step ? 'var(--accent-primary)' : 'var(--border-subtle)',
              }}
              animate={{ background: i <= step ? '#6366f1' : 'rgba(255,255,255,0.06)' }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '32px 28px', borderRadius: 'var(--radius-xl)', minHeight: 300 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {/* Step 0: Location */}
              {step === 0 && (
                <div>
                  <h2 className="heading-md" style={{ marginBottom: 8 }}>📍 Your Location</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
                    We use this to show disasters near you and calculate risk scores.
                  </p>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="btn-primary"
                    onClick={detectLocation}
                    disabled={locationLoading}
                    style={{ width: '100%', marginBottom: 16 }}
                  >
                    {locationLoading ? '🔍 Detecting...' : '📡 Auto-Detect Location'}
                  </motion.button>

                  {prefs.locationName && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--success-soft)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--success)',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        marginBottom: 16,
                      }}
                    >
                      ✅ {prefs.locationName}
                    </motion.div>
                  )}

                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '12px 0' }}>
                      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>or enter manually</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                    </div>
                  </div>

                  <input
                    className="input-glass"
                    placeholder="Location name (e.g., Tokyo, Japan)"
                    value={prefs.locationName}
                    onChange={e => setPrefs(p => ({ ...p, locationName: e.target.value }))}
                    style={{ marginBottom: 12 }}
                  />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      className="input-glass"
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={prefs.latitude || ''}
                      onChange={e => setPrefs(p => ({ ...p, latitude: parseFloat(e.target.value) || null }))}
                    />
                    <input
                      className="input-glass"
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={prefs.longitude || ''}
                      onChange={e => setPrefs(p => ({ ...p, longitude: parseFloat(e.target.value) || null }))}
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Disaster Types */}
              {step === 1 && (
                <div>
                  <h2 className="heading-md" style={{ marginBottom: 8 }}>🔔 Disaster Types</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
                    Select which events you want to monitor.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {DISASTER_TYPES.map(dt => {
                      const active = prefs.disasterTypes.includes(dt.id);
                      return (
                        <motion.button
                          key={dt.id}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => toggleDisasterType(dt.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '14px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${active ? dt.color : 'var(--border-subtle)'}`,
                            background: active ? `${dt.color}18` : 'var(--bg-glass)',
                            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                            transition: 'all var(--transition-fast)',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ fontSize: '1.3rem' }}>{dt.icon}</span>
                          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{dt.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Range */}
              {step === 2 && (
                <div>
                  <h2 className="heading-md" style={{ marginBottom: 8 }}>📏 Monitoring Range</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 32 }}>
                    How far from your location should we monitor?
                  </p>

                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <motion.div
                      key={prefs.radiusKm}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      style={{
                        fontSize: '3.5rem',
                        fontWeight: 800,
                        background: 'var(--accent-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {prefs.radiusKm}
                    </motion.div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>kilometers</span>
                  </div>

                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={prefs.radiusKm}
                    onChange={e => setPrefs(p => ({ ...p, radiusKm: parseInt(e.target.value) }))}
                    style={{
                      width: '100%',
                      height: 6,
                      borderRadius: 3,
                      outline: 'none',
                      appearance: 'none',
                      background: `linear-gradient(to right, #6366f1 ${(prefs.radiusKm - 5) / 495 * 100}%, var(--border-subtle) ${(prefs.radiusKm - 5) / 495 * 100}%)`,
                      cursor: 'pointer',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                    <span>5 km</span>
                    <span>500 km</span>
                  </div>
                </div>
              )}

              {/* Step 3: Sensitivity */}
              {step === 3 && (
                <div>
                  <h2 className="heading-md" style={{ marginBottom: 8 }}>⚡ Alert Sensitivity</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
                    Control how many alerts you receive.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {SENSITIVITY_LEVELS.map(level => {
                      const active = prefs.sensitivity === level.id;
                      return (
                        <motion.button
                          key={level.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setPrefs(p => ({ ...p, sensitivity: level.id }))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '18px 20px',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${active ? level.color : 'var(--border-subtle)'}`,
                            background: active ? `${level.color}18` : 'var(--bg-glass)',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{level.label}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{level.desc}</div>
                          </div>
                          <div style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: `2px solid ${active ? level.color : 'var(--border-medium)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {active && <div style={{ width: 10, height: 10, borderRadius: '50%', background: level.color }} />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 4: Notification Channels */}
              {step === 4 && (
                <div>
                  <h2 className="heading-md" style={{ marginBottom: 8 }}>🔔 Notification Channels</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
                    How would you like to receive alerts?
                  </p>
                  {['in-app', 'push', 'email'].map(ch => {
                    const active = prefs.notificationChannels.includes(ch);
                    const labels = { 'in-app': '📱 In-App Notifications', push: '🔔 Push Notifications', email: '📧 Email Alerts' };
                    const descs = { 'in-app': 'Always available', push: 'Browser push (coming soon)', email: 'Email digest (coming soon)' };
                    return (
                      <motion.button
                        key={ch}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggleChannel(ch)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '16px 18px',
                          borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          background: active ? 'rgba(99,102,241,0.1)' : 'var(--bg-glass)',
                          marginBottom: 10,
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{labels[ch]}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{descs[ch]}</div>
                        </div>
                        <div style={{
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          background: active ? 'var(--accent-primary)' : 'var(--border-medium)',
                          transition: 'all var(--transition-fast)',
                          position: 'relative',
                        }}>
                          <motion.div
                            animate={{ x: active ? 20 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'white',
                              position: 'absolute',
                              top: 2,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 24,
          gap: 12,
        }}>
          {step > 0 ? (
            <motion.button whileTap={{ scale: 0.97 }} onClick={prevStep} className="btn-secondary" style={{ flex: 1 }}>
              ← Back
            </motion.button>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={nextStep}
            className="btn-primary"
            style={{ flex: 1 }}
          >
            {step === steps.length - 1 ? '🚀 Launch Dashboard' : 'Continue →'}
          </motion.button>
        </div>

        {/* Skip */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={saveAndContinue}
          className="btn-ghost"
          style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}
        >
          Skip for now
        </motion.button>
      </motion.div>
    </div>
  );
}
