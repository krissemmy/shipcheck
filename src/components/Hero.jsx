import React from 'react'

export default function Hero() {
  return (
    <header style={styles.header}>
      {/* Grid pattern background */}
      <div style={styles.gridPattern} aria-hidden="true" />

      {/* Glowing orb */}
      <div style={styles.orb} aria-hidden="true" />

      <div style={styles.badge}>
        <span style={styles.badgeDot} />
        Deployment Readiness Checker
      </div>

      <h1 style={styles.headline}>
        Check if your app is
        <br />
        <span style={styles.accent}>ready to share.</span>
      </h1>

      <p style={styles.subheadline}>
        Paste a live URL and get a deployment readiness report in seconds.
        <br />
        HTTPS, security headers, response time, and more — all checked instantly.
      </p>
    </header>
  )
}

const styles = {
  header: {
    position: 'relative',
    textAlign: 'center',
    paddingTop: '72px',
    paddingBottom: '48px',
    overflow: 'hidden'
  },
  gridPattern: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(99, 102, 241, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99, 102, 241, 0.04) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)',
    WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)',
    pointerEvents: 'none'
  },
  orb: {
    position: 'absolute',
    top: '-60px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '400px',
    height: '300px',
    background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
    filter: 'blur(20px)'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    borderRadius: '999px',
    padding: '5px 14px',
    fontSize: '12px',
    fontFamily: "'DM Mono', monospace",
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: '#a5b4fc',
    marginBottom: '28px',
    position: 'relative'
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#6366f1',
    boxShadow: '0 0 8px rgba(99, 102, 241, 0.8)',
    display: 'inline-block',
    animation: 'pulse-dot 2s ease-in-out infinite'
  },
  headline: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: 'clamp(36px, 6vw, 60px)',
    fontWeight: 800,
    lineHeight: 1.1,
    color: '#f8fafc',
    marginBottom: '20px',
    letterSpacing: '-0.02em',
    position: 'relative'
  },
  accent: {
    background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a78bfa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subheadline: {
    fontSize: '17px',
    lineHeight: 1.7,
    color: '#94a3b8',
    maxWidth: '520px',
    margin: '0 auto',
    position: 'relative',
    fontWeight: 400
  }
}
