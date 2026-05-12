import React from 'react'

const TYPE_CONFIG = {
  pass: {
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.2)',
    icon: '✓',
    iconBg: 'rgba(34, 197, 94, 0.15)'
  },
  warning: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.2)',
    icon: '⚠',
    iconBg: 'rgba(245, 158, 11, 0.15)'
  },
  fail: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.2)',
    icon: '✗',
    iconBg: 'rgba(239, 68, 68, 0.15)'
  },
  unknown: {
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.08)',
    border: 'rgba(148, 163, 184, 0.2)',
    icon: '?',
    iconBg: 'rgba(148, 163, 184, 0.14)'
  }
}

export default function ResultCard({ type, count, label }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.fail

  return (
    <div
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: '10px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        animation: 'fadeInUp 0.3s ease forwards'
      }}
      role="status"
      aria-label={`${count} ${label}`}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: config.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '15px',
          color: config.color,
          fontWeight: 700
        }}
        aria-hidden="true"
      >
        {config.icon}
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 800,
          fontFamily: "'Syne', system-ui, sans-serif",
          color: config.color,
          lineHeight: 1,
          letterSpacing: '-0.02em'
        }}
      >
        {count}
      </div>
      <div
        style={{
          fontSize: '11px',
          fontFamily: "'DM Mono', monospace",
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: config.color,
          opacity: 0.8
        }}
      >
        {label}
      </div>
    </div>
  )
}
