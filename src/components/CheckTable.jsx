import React from 'react'

function StatusBadge({ status }) {
  const config = {
    pass: {
      icon: '✓',
      label: 'Pass',
      bg: 'rgba(34, 197, 94, 0.12)',
      color: '#22c55e',
      border: 'rgba(34, 197, 94, 0.25)'
    },
    warning: {
      icon: '⚠',
      label: 'Warning',
      bg: 'rgba(245, 158, 11, 0.12)',
      color: '#f59e0b',
      border: 'rgba(245, 158, 11, 0.25)'
    },
    fail: {
      icon: '✗',
      label: 'Fail',
      bg: 'rgba(239, 68, 68, 0.12)',
      color: '#ef4444',
      border: 'rgba(239, 68, 68, 0.25)'
    },
    unknown: {
      icon: '?',
      label: 'Unknown',
      bg: 'rgba(148, 163, 184, 0.1)',
      color: '#94a3b8',
      border: 'rgba(148, 163, 184, 0.22)'
    }
  }

  const c = config[status] || config.fail

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      borderRadius: '6px',
      padding: '3px 9px',
      fontSize: '12px',
      fontFamily: "'DM Mono', monospace",
      fontWeight: 500,
      whiteSpace: 'nowrap'
    }}>
      <span style={{ fontSize: '13px' }}>{c.icon}</span>
      {c.label}
    </span>
  )
}

export default function CheckTable({ results }) {
  if (!results || results.length === 0) return null

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Detailed Results</h3>

      <div style={styles.tableWrapper} role="table" aria-label="Check results">
        {/* Header */}
        <div style={styles.headerRow} role="row">
          <div style={{ ...styles.headerCell, flex: 3 }} role="columnheader">Check</div>
          <div style={{ ...styles.headerCell, flex: 1.5, textAlign: 'center' }} role="columnheader">Status</div>
          <div style={{ ...styles.headerCell, flex: 4 }} role="columnheader">Details</div>
        </div>

        {/* Rows */}
        {results.map((result, i) => (
          <div
            key={result.id}
            style={{
              ...styles.row,
              background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
              animationDelay: `${i * 60}ms`
            }}
            className="check-row"
            role="row"
          >
            <div style={{ ...styles.cell, flex: 3 }} role="cell">
              <span style={styles.checkLabel}>{result.label}</span>
            </div>
            <div style={{ ...styles.cell, flex: 1.5, justifyContent: 'center' }} role="cell">
              <StatusBadge status={result.status} />
            </div>
            <div style={{ ...styles.cell, flex: 4 }} role="cell">
              <span style={styles.detailText}>{result.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: {
    marginTop: '0',
    animation: 'fadeInUp 0.4s ease forwards'
  },
  heading: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: '18px',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: '16px',
    letterSpacing: '-0.01em'
  },
  tableWrapper: {
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    background: 'rgba(14, 165, 233, 0.06)'
  },
  headerCell: {
    fontSize: '11px',
    fontFamily: "'DM Mono', monospace",
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '13px 20px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.07)',
    transition: 'background 0.15s ease',
    animation: 'slideInRow 0.35s ease both'
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
    paddingRight: '12px'
  },
  checkLabel: {
    fontSize: '13.5px',
    fontWeight: 500,
    color: '#cbd5e1',
    fontFamily: "'DM Sans', system-ui, sans-serif"
  },
  detailText: {
    fontSize: '12.5px',
    color: '#64748b',
    fontFamily: "'DM Mono', monospace",
    lineHeight: 1.5,
    wordBreak: 'break-word'
  }
}
