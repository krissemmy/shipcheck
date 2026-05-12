import React, { useEffect, useState } from 'react'

export default function ScoreRing({ score, verdict, isLoading }) {
  const [displayScore, setDisplayScore] = useState(0)
  const [mounted, setMounted] = useState(false)

  const size = 180
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = displayScore / 100
  const strokeDashoffset = circumference - progress * circumference

  const getColor = (s) => {
    if (s >= 75) return '#22c55e'
    if (s >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const ringColor = getColor(displayScore)

  useEffect(() => {
    if (score === null || score === undefined) return
    setMounted(true)
    const duration = 1200
    const start = performance.now()
    const startVal = 0

    function animate(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startVal + (score - startVal) * eased)
      setDisplayScore(current)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [score])

  if (isLoading) {
    return (
      <div style={styles.loadingWrapper}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.loadingSvg}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(56, 189, 248, 0.15)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.7}
            style={{
              transformOrigin: 'center',
              animation: 'spin 1.4s linear infinite'
            }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div style={styles.loadingText}>Running checks…</div>
      </div>
    )
  }

  return (
    <div style={{ ...styles.wrapper, opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>
      <div style={styles.scoreLabel}>Launch Score</div>
      <div style={styles.ringContainer}>
        {/* Glow behind the ring */}
        <div
          style={{
            ...styles.glow,
            background: `radial-gradient(circle, ${ringColor}22 0%, transparent 70%)`
          }}
          aria-hidden="true"
        />

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={styles.svg}
          role="img"
          aria-label={`Score: ${displayScore} out of 100`}
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Colored progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              filter: `drop-shadow(0 0 8px ${ringColor}88)`,
              transition: 'stroke-dashoffset 0.05s linear, stroke 0.4s ease'
            }}
          />

          {/* Score text */}
          <text
            x={size / 2}
            y={size / 2 - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#f8fafc"
            fontSize="42"
            fontWeight="800"
            fontFamily="'Syne', system-ui, sans-serif"
            letterSpacing="-2"
          >
            {displayScore}
          </text>
          <text
            x={size / 2}
            y={size / 2 + 24}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#64748b"
            fontSize="12"
            fontFamily="'DM Mono', monospace"
            letterSpacing="1"
          >
            / 100
          </text>
        </svg>
      </div>

      <div style={{ ...styles.verdict, color: ringColor }}>
        {verdict}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    padding: '32px 0 24px'
  },
  ringContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scoreLabel: {
    color: '#94a3b8',
    fontFamily: "'DM Mono', monospace",
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase'
  },
  glow: {
    position: 'absolute',
    width: '240px',
    height: '240px',
    borderRadius: '50%',
    pointerEvents: 'none',
    transition: 'background 0.4s ease'
  },
  svg: {
    position: 'relative',
    zIndex: 1
  },
  verdict: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    textAlign: 'center',
    transition: 'color 0.4s ease'
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '32px 0 24px'
  },
  loadingSvg: {
    animation: 'none'
  },
  loadingText: {
    color: '#64748b',
    fontFamily: "'DM Mono', monospace",
    fontSize: '13px',
    letterSpacing: '0.05em'
  }
}
