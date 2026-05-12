import React from 'react'

const STATUS_STYLES = {
  pass: {
    label: 'Pass',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(52, 211, 153, 0.24)'
  },
  warning: {
    label: 'Warning',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.13)',
    border: 'rgba(251, 191, 36, 0.24)'
  },
  fail: {
    label: 'Fail',
    color: '#fb7185',
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(251, 113, 133, 0.24)'
  }
}

function StatusPill({ status }) {
  const c = STATUS_STYLES[status]

  return (
    <span
      style={{
        ...styles.statusPill,
        color: c.color,
        background: c.bg,
        borderColor: c.border
      }}
    >
      {c.label}
    </span>
  )
}

function ReportPreview() {
  const checks = [
    { label: 'HTTPS', detail: 'TLS', status: 'pass' },
    { label: 'Response Time', detail: '1.42s', status: 'warning' },
    { label: 'Security Headers', detail: 'Headers', status: 'fail' },
    { label: 'Health Endpoint', detail: '/health', status: 'warning' }
  ]

  return (
    <aside style={styles.previewCard} aria-label="Example readiness report">
      <div style={styles.previewHeader}>
        <div>
          <div style={styles.previewEyebrow}>Readiness report</div>
          <div style={styles.previewUrl}>app.example.com</div>
        </div>
        <div style={styles.httpStatus}>HTTP 200</div>
      </div>

      <div style={styles.scoreBlock}>
        <div>
          <div style={styles.scoreLabel}>Launch Score</div>
          <div style={styles.scoreValue}>82<span style={styles.scoreTotal}>/100</span></div>
        </div>
        <div style={styles.scoreMeter} aria-hidden="true">
          <div style={styles.scoreMeterFill} />
        </div>
      </div>

      <div style={styles.previewRows}>
        {checks.map((check) => (
          <div key={check.label} style={styles.previewRow} className="report-preview-row">
            <div>
              <div style={styles.previewCheck}>{check.label}</div>
              <div style={styles.previewDetail}>{check.detail}</div>
            </div>
            <StatusPill status={check.status} />
          </div>
        ))}
      </div>

      <div style={styles.verdictRow}>
        <span style={styles.verdictLabel}>Verdict</span>
        <span style={styles.verdictText}>Demo ready, not production ready</span>
      </div>
    </aside>
  )
}

export default function Hero({ inputSlot }) {
  return (
    <header style={styles.header}>
      <div style={styles.heroGrid} className="hero-grid">
        <section style={styles.copy}>
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            Deployment Readiness Checker
          </div>

          <h1 style={styles.headline}>
            Know if your app is ready before you share it.
          </h1>

          <p style={styles.subheadline}>
            Paste a live app URL and get a clear readiness report for HTTPS,
            response time, security headers, health endpoints, metadata, and
            launch risk.
          </p>

          {inputSlot}
        </section>

        <ReportPreview />
      </div>
    </header>
  )
}

const styles = {
  header: {
    position: 'relative',
    paddingTop: '68px',
    paddingBottom: '32px'
  },
  heroGrid: {
    display: 'grid',
    gap: '28px',
    alignItems: 'center'
  },
  copy: {
    position: 'relative',
    minWidth: 0
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(15, 23, 42, 0.72)',
    border: '1px solid rgba(125, 211, 252, 0.24)',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '11px',
    fontFamily: "'DM Mono', monospace",
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: '#bae6fd',
    marginBottom: '22px',
    boxShadow: '0 0 28px rgba(14, 165, 233, 0.08)'
  },
  badgeDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 12px rgba(34, 197, 94, 0.55)',
    display: 'inline-block'
  },
  headline: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: 'clamp(34px, 5vw, 54px)',
    fontWeight: 800,
    lineHeight: 1.08,
    color: '#f8fafc',
    maxWidth: '720px',
    marginBottom: '18px',
    letterSpacing: '0'
  },
  subheadline: {
    fontSize: '16px',
    lineHeight: 1.72,
    color: '#a8b3c7',
    maxWidth: '620px',
    marginBottom: '24px',
    fontWeight: 400
  },
  previewCard: {
    background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.94), rgba(10, 16, 24, 0.94))',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 24px 70px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255,255,255,0.04)',
    minWidth: 0
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '20px'
  },
  previewEyebrow: {
    fontSize: '11px',
    fontFamily: "'DM Mono', monospace",
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: '5px'
  },
  previewUrl: {
    fontSize: '14px',
    fontFamily: "'DM Mono', monospace",
    color: '#dbeafe'
  },
  httpStatus: {
    fontSize: '11px',
    fontFamily: "'DM Mono', monospace",
    color: '#34d399',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(52, 211, 153, 0.22)',
    borderRadius: '999px',
    padding: '5px 9px',
    whiteSpace: 'nowrap'
  },
  scoreBlock: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '18px',
    alignItems: 'center',
    padding: '18px',
    background: 'rgba(2, 6, 23, 0.46)',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    borderRadius: '10px',
    marginBottom: '14px'
  },
  scoreLabel: {
    fontSize: '12px',
    fontFamily: "'DM Mono', monospace",
    color: '#7dd3fc',
    marginBottom: '4px'
  },
  scoreValue: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: '42px',
    lineHeight: 1,
    fontWeight: 800,
    color: '#f8fafc',
    letterSpacing: '0'
  },
  scoreTotal: {
    fontSize: '16px',
    color: '#64748b',
    marginLeft: '2px'
  },
  scoreMeter: {
    height: '8px',
    borderRadius: '999px',
    background: 'rgba(148, 163, 184, 0.12)',
    overflow: 'hidden'
  },
  scoreMeterFill: {
    width: '82%',
    height: '100%',
    borderRadius: 'inherit',
    background: 'linear-gradient(90deg, #34d399, #fbbf24)'
  },
  previewRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  previewRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '12px',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(148, 163, 184, 0.09)'
  },
  previewCheck: {
    fontSize: '14px',
    fontWeight: 650,
    color: '#dbe4ef',
    marginBottom: '3px'
  },
  previewDetail: {
    fontSize: '12px',
    fontFamily: "'DM Mono', monospace",
    color: '#64748b'
  },
  statusPill: {
    display: 'inline-flex',
    justifyContent: 'center',
    border: '1px solid',
    borderRadius: '999px',
    padding: '5px 9px',
    fontSize: '11px',
    fontFamily: "'DM Mono', monospace",
    fontWeight: 500,
    minWidth: '72px'
  },
  verdictRow: {
    display: 'grid',
    gap: '7px',
    marginTop: '16px',
    padding: '14px',
    background: 'rgba(251, 191, 36, 0.08)',
    border: '1px solid rgba(251, 191, 36, 0.16)',
    borderRadius: '10px'
  },
  verdictLabel: {
    fontSize: '11px',
    fontFamily: "'DM Mono', monospace",
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#fbbf24'
  },
  verdictText: {
    fontSize: '14px',
    fontWeight: 650,
    color: '#f8fafc',
    lineHeight: 1.4
  }
}
