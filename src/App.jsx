import React from 'react'
import Hero from './components/Hero.jsx'
import Checker from './components/Checker.jsx'

function CreateOSBadge() {
  return (
    <>
      <style>{`
        #createos-badge-react {
          position: fixed;
          bottom: 12px;
          right: 12px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 999px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
          font-size: 11px;
          font-weight: 500;
          color: #374151;
          text-decoration: none;
          font-family: system-ui, sans-serif;
        }
        #createos-badge-react:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        #createos-badge-react img { width: 14px; height: 14px; }
      `}</style>
      <a
        id="createos-badge-react"
        href="https://createos.sh/app"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src="https://nodeops.network/SymbolBlack.svg" alt="" />
        Built with CreateOS
      </a>
    </>
  )
}

export default function App() {
  return (
    <div style={styles.app}>
      {/* Ambient background effects */}
      <div style={styles.bgGradient1} aria-hidden="true" />
      <div style={styles.bgGradient2} aria-hidden="true" />

      <main style={styles.main}>
        <div style={styles.container}>
          <Hero />
          <Checker />
        </div>
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <span style={styles.footerLogo}>
            <span style={styles.footerLogoAccent}>Ship</span>Check
          </span>
          <span style={styles.footerSep}>·</span>
          <span style={styles.footerText}>
            Open-source deployment readiness checker
          </span>
          <span style={styles.footerSep}>·</span>
          <span style={styles.footerText}>
            All checks run in your browser
          </span>
        </div>
      </footer>

      <CreateOSBadge />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRow {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(99, 102, 241, 0.8); }
          50% { opacity: 0.6; box-shadow: 0 0 4px rgba(99, 102, 241, 0.4); }
        }

        .check-row:hover {
          background: rgba(255,255,255,0.04) !important;
        }

        input:focus {
          border-color: rgba(99, 102, 241, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
          outline: none !important;
        }

        input::placeholder {
          color: #3f4a68;
          font-family: 'DM Mono', monospace;
        }

        button:hover:not(:disabled) {
          filter: brightness(1.08);
        }

        button:active:not(:disabled) {
          transform: scale(0.98);
        }

        @media (max-width: 640px) {
          .input-row {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  },
  bgGradient1: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '500px',
    background: 'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 100%)',
    pointerEvents: 'none',
    zIndex: 0
  },
  bgGradient2: {
    position: 'fixed',
    bottom: 0,
    right: 0,
    width: '400px',
    height: '400px',
    background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0
  },
  main: {
    flex: 1,
    position: 'relative',
    zIndex: 1
  },
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '0 20px'
  },
  footer: {
    position: 'relative',
    zIndex: 1,
    borderTop: '1px solid rgba(255,255,255,0.05)',
    padding: '24px 20px',
    marginTop: '40px'
  },
  footerInner: {
    maxWidth: '720px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  footerLogo: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: '14px',
    fontWeight: 700,
    color: '#94a3b8'
  },
  footerLogoAccent: {
    color: '#6366f1'
  },
  footerSep: {
    color: '#334155',
    fontSize: '16px'
  },
  footerText: {
    fontSize: '13px',
    color: '#475569'
  }
}
