import React from 'react'
import Checker from './components/Checker.jsx'

function CreateOSBadge() {
  return (
    <a
      id="createos-badge-react"
      href="https://createos.sh/app"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Built with CreateOS"
    >
      <img src="https://nodeops.network/SymbolBlack.svg" alt="" />
      Built with CreateOS
    </a>
  )
}

export default function App() {
  return (
    <div style={styles.app}>
      <div style={styles.gridLayer} aria-hidden="true" />
      <div style={styles.topGlow} aria-hidden="true" />
      <div style={styles.sideGlow} aria-hidden="true" />

      <main style={styles.main}>
        <div style={styles.container}>
          <Checker />
        </div>
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerInner} className="footer-inner">
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
        #createos-badge-react {
          position: fixed;
          bottom: 12px;
          right: 12px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.94);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 999px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          text-decoration: none;
          font-family: system-ui, sans-serif;
        }

        #createos-badge-react:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.16);
        }

        #createos-badge-react img {
          width: 14px;
          height: 14px;
        }

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
          border-color: rgba(56, 189, 248, 0.65) !important;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12) !important;
          outline: none !important;
        }

        input::placeholder {
          color: #56657f;
          font-family: 'DM Mono', monospace;
        }

        button:hover:not(:disabled) {
          filter: brightness(1.08);
        }

        button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .hero-grid {
          grid-template-columns: minmax(0, 1.06fr) minmax(360px, 0.94fr);
        }

        .checks-grid {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }

        @media (max-width: 640px) {
          .input-row {
            flex-direction: column !important;
          }
          .summary-row {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 920px) {
          .hero-grid {
            grid-template-columns: 1fr;
          }
          .checks-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .checks-grid {
            grid-template-columns: 1fr;
          }
          .report-preview-row {
            grid-template-columns: 1fr !important;
          }
          .footer-inner {
            gap: 8px !important;
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
    flexDirection: 'column',
    background: '#0b1117'
  },
  gridLayer: {
    position: 'fixed',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(148, 163, 184, 0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.055) 1px, transparent 1px)
    `,
    backgroundSize: '44px 44px',
    maskImage: 'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.78) 42%, transparent 92%)',
    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.78) 42%, transparent 92%)',
    pointerEvents: 'none',
    zIndex: 0
  },
  topGlow: {
    position: 'fixed',
    top: '-180px',
    left: '10%',
    right: '10%',
    height: '420px',
    background: 'radial-gradient(ellipse at 50% 0%, rgba(20, 184, 166, 0.16), rgba(14, 165, 233, 0.08) 38%, transparent 72%)',
    pointerEvents: 'none',
    zIndex: 0
  },
  sideGlow: {
    position: 'fixed',
    top: '260px',
    right: '-180px',
    width: '520px',
    height: '520px',
    background: 'radial-gradient(ellipse, rgba(34, 197, 94, 0.08) 0%, transparent 68%)',
    pointerEvents: 'none',
    zIndex: 0
  },
  main: {
    flex: 1,
    position: 'relative',
    zIndex: 1
  },
  container: {
    maxWidth: '1120px',
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
    maxWidth: '1120px',
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
    color: '#38bdf8'
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
