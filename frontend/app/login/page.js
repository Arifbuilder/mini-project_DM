'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../layout';
import { Suspense } from 'react';

const orbStyles = [
  { width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', top: '-10%', left: '-10%' },
  { width: 400, height: 400, background: 'radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 70%)', bottom: '-5%', right: '-5%' },
  { width: 300, height: 300, background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', top: '40%', right: '15%' },
];

function LoginForm() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, guestLogin } = useAuth();

  const isDemo = searchParams.get('mode') === 'demo';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      router.push('/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = async () => {
    setIsLoading(true);
    try {
      await guestLogin();
      if (isDemo) {
        localStorage.setItem('experimentalMode', 'true');
      }
      router.push('/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExperimental = async () => {
    setIsLoading(true);
    try {
      await guestLogin();
      localStorage.setItem('experimentalMode', 'true');
      router.push('/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: '20px',
    }}>
      {/* Animated orbs */}
      {orbStyles.map((orb, i) => (
        <motion.div key={i} style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none', ...orb }}
          animate={{ x: [0, 30, -20, 50, 0], y: [0, -50, 20, 10, 0], scale: [1, 1.1, 0.95, 1.05, 1] }}
          transition={{ duration: 20 + i * 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }} style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}>
        {/* Brand */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}>
            🌍
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #6366f1, #ec4899, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
            DisasterIntel
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {isDemo ? '🔬 Entering Experimental Mode' : 'Real-time disaster intelligence at your fingertips'}
          </p>
        </motion.div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '36px 32px', borderRadius: 'var(--radius-xl)' }}>
          {/* Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-glass)', borderRadius: 'var(--radius-full)', padding: 4, marginBottom: 28, border: '1px solid var(--border-subtle)' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: 600,
                  color: mode === m ? 'white' : 'var(--text-tertiary)',
                  background: mode === m ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(0,0,0,0)',
                  transition: 'all 0.25s ease',
                }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form key={mode} initial={{ opacity: 0, x: mode === 'register' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: mode === 'register' ? -20 : 20 }} transition={{ duration: 0.25 }} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mode === 'register' && <input className="input-glass" type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />}
              <input className="input-glass" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
              <input className="input-glass" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              {error && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 500 }}>{error}</motion.div>}
              <motion.button type="submit" className="btn-primary" disabled={isLoading} whileTap={{ scale: 0.97 }} style={{ width: '100%', marginTop: 4, opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <motion.button onClick={handleGuest} className="btn-secondary" whileTap={{ scale: 0.97 }} disabled={isLoading} style={{ width: '100%' }}>
              🚀 Continue as Guest
            </motion.button>
            <motion.button onClick={handleExperimental} whileTap={{ scale: 0.97 }} disabled={isLoading}
              style={{
                width: '100%', padding: '12px 28px', borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(245,158,11,0.15))',
                border: '1px solid rgba(236,72,153,0.3)', color: '#f472b6',
                fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.25s ease',
              }}
            >
              🔬 Experimental Mode (Demo Data)
            </motion.button>
          </div>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ textAlign: 'center', marginTop: 20, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          <a href="/" style={{ color: 'var(--text-accent)' }}>← Back to Home</a>
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
