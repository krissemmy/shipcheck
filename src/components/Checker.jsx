import React, { useState, useRef } from 'react'
import Hero from './Hero.jsx'
import ScoreRing from './ScoreRing.jsx'
import CheckTable from './CheckTable.jsx'
import ShareButton from './ShareButton.jsx'
import ResultCard from './ResultCard.jsx'
import {
  runAllChecks,
  calculateScore,
  calculateInspectionConfidence,
  getRecommendations,
  getVerdict
} from '../utils/checks.js'

const EXAMPLE_URL = 'https://example.com'
const CHECK_CARDS = [
  {
    title: 'Availability',
    detail: 'HTTP status',
    copy: 'Confirms the app responds with a usable public status code.'
  },
  {
    title: 'HTTPS/TLS',
    detail: 'TLS',
    copy: 'Flags plain HTTP before a demo link reaches customers or teammates.'
  },
  {
    title: 'Response time',
    detail: 'Latency',
    copy: 'Measures how quickly the deployed URL answers from the browser.'
  },
  {
    title: 'Security headers',
    detail: 'Headers',
    copy: 'Checks CSP, HSTS, frame, content type, and referrer policy headers.'
  },
  {
    title: 'Health endpoints',
    detail: '/health',
    copy: 'Looks for common readiness endpoints such as /health and /readyz.'
  }
]

function ChecksSection() {
  return (
    <section style={styles.checksSection} aria-labelledby="checks-heading">
      <div style={styles.sectionHeader}>
        <h2 id="checks-heading" style={styles.sectionTitle}>What ShipCheck checks</h2>
        <p style={styles.sectionCopy}>
          A compact pre-launch pass over the signals that usually break first.
        </p>
      </div>

      <div style={styles.checksGrid} className="checks-grid">
        {CHECK_CARDS.map((check) => (
          <article key={check.title} style={styles.checkCard}>
            <div style={styles.checkDetail}>{check.detail}</div>
            <h3 style={styles.checkTitle}>{check.title}</h3>
            <p style={styles.checkCopy}>{check.copy}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function Checker() {
  const [url, setUrl] = useState('')
  const [inputError, setInputError] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [liveResults, setLiveResults] = useState([])
  const [checkedUrl, setCheckedUrl] = useState('')

  const resultsRef = useRef(null)
  const inputRef = useRef(null)

  function validateInput(value) {
    if (!value.trim()) {
      return 'Please enter a URL'
    }
    try {
      const u = new URL(value.trim())
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return 'URL must start with http:// or https://'
      }
    } catch {
      // Try with https:// prepended
      try {
        new URL('https://' + value.trim())
        return null // valid if we prepend
      } catch {
        return 'Please enter a valid URL (e.g. https://myapp.com)'
      }
    }
    return null
  }

  function normalizeUrl(value) {
    const trimmed = value.trim()
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return 'https://' + trimmed
    }
    return trimmed
  }

  async function runChecks(rawUrl) {
    const normalized = normalizeUrl(rawUrl)
    const validationErr = validateInput(normalized)
    if (validationErr) {
      setInputError(validationErr)
      inputRef.current?.focus()
      return
    }

    setInputError('')
    setIsRunning(true)
    setResults(null)
    setLiveResults([])
    setCheckedUrl(normalized)
    setUrl(normalized)

    // Scroll to results area
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

    try {
      const finalResults = await runAllChecks(normalized, (partial) => {
        setLiveResults([...partial])
      })
      setResults(finalResults)
    } catch (err) {
      console.error('Check runner failed:', err)
      setResults([{
        id: 'error',
        label: 'Error',
        status: 'fail',
        detail: 'Checks failed unexpectedly. Please try again.'
      }])
    } finally {
      setIsRunning(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    runChecks(url)
  }

  function handleExample(e) {
    e.preventDefault()
    setUrl(EXAMPLE_URL)
    runChecks(EXAMPLE_URL)
  }

  function handleInputChange(e) {
    setUrl(e.target.value)
    if (inputError) setInputError('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  const score = results ? calculateScore(results) : null
  const confidence = results ? calculateInspectionConfidence(results) : null
  const verdict = score !== null ? getVerdict(score, results || []) : ''
  const recommendations = results ? getRecommendations(results) : []
  const displayResults = isRunning ? liveResults : (results || [])

  const passed = displayResults.filter(r => r.status === 'pass').length
  const warnings = displayResults.filter(r => r.status === 'warning').length
  const failed = displayResults.filter(r => r.status === 'fail').length
  const unknown = displayResults.filter(r => r.status === 'unknown').length

  const inputSlot = (
    <div style={styles.inputCard}>
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        <div style={styles.inputRow} className="input-row">
          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon} aria-hidden="true">URL</span>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="https://your-app.com"
              style={{
                ...styles.input,
                borderColor: inputError
                  ? 'rgba(251, 113, 133, 0.55)'
                  : url
                  ? 'rgba(56, 189, 248, 0.42)'
                  : 'rgba(148, 163, 184, 0.14)'
              }}
              aria-label="App URL to check"
              aria-invalid={!!inputError}
              aria-describedby={inputError ? 'url-error' : undefined}
              disabled={isRunning}
              autoComplete="url"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            disabled={isRunning}
            style={{
              ...styles.button,
              opacity: isRunning ? 0.72 : 1,
              cursor: isRunning ? 'not-allowed' : 'pointer'
            }}
          >
            {isRunning ? (
              <>
                <span style={styles.spinner} aria-hidden="true" />
                Checking
              </>
            ) : (
              'Run Check'
            )}
          </button>
        </div>

        {inputError && (
          <p id="url-error" style={styles.errorMsg} role="alert">
            {inputError}
          </p>
        )}
      </form>

      <div style={styles.exampleRow}>
        <span style={styles.exampleText}>Example target</span>
        <button onClick={handleExample} style={styles.exampleLink} disabled={isRunning}>
          https://example.com
        </button>
      </div>
    </div>
  )

  return (
    <div style={styles.wrapper}>
      <Hero inputSlot={inputSlot} />
      <ChecksSection />

      {/* Results section */}
      {(isRunning || results) && (
        <div ref={resultsRef} style={styles.results}>
          {/* URL being checked */}
          <div style={styles.checkedUrlBar}>
            <span style={styles.checkedUrlLabel}>Checking</span>
            <span style={styles.checkedUrlValue}>{checkedUrl}</span>
            {!isRunning && (
              <button
                style={styles.rerunBtn}
                onClick={() => runChecks(checkedUrl)}
              >
                ↻ Re-run
              </button>
            )}
          </div>

          {/* Score Card with glassmorphism */}
          <div style={styles.scoreCard}>
            <ScoreRing
              score={score}
              verdict={verdict}
              isLoading={isRunning && score === null}
            />

            {/* Summary cards */}
            {confidence !== null && (
              <div style={styles.confidenceRow}>
                <span style={styles.confidenceLabel}>Inspection Confidence</span>
                <span style={styles.confidenceValue}>{confidence}/100</span>
              </div>
            )}

            {unknown > 0 && (
              <p style={styles.unknownNote}>
                Unknown means ShipCheck could not verify this from the current inspection environment.
                It does not mean the app failed.
              </p>
            )}

            {(passed > 0 || warnings > 0 || failed > 0 || unknown > 0) && (
              <div style={styles.summaryRow} className="summary-row">
                <ResultCard type="pass" count={passed} label="Passed" />
                <ResultCard type="warning" count={warnings} label="Warnings" />
                <ResultCard type="fail" count={failed} label="Failed" />
                <ResultCard type="unknown" count={unknown} label="Unknown" />
              </div>
            )}
          </div>

          {/* Detailed checklist */}
          {displayResults.length > 0 && (
            <CheckTable results={displayResults} />
          )}

          {/* Recommendations */}
          {!isRunning && recommendations.length > 0 && (
            <div style={styles.recommendations}>
              <h3 style={styles.recHeading}>
                <span style={styles.recIcon}>⚡</span>
                Recommendations
              </h3>
              <div style={styles.recList}>
                {recommendations.map((rec, i) => (
                  <div key={rec.id} style={{ ...styles.recItem, animationDelay: `${i * 80}ms` }}>
                    <div style={styles.recBullet} aria-hidden="true">→</div>
                    <div>
                      <span style={styles.recLabel}>{rec.label}</span>
                      <span style={styles.recSep}> — </span>
                      <span style={styles.recTip}>{rec.tip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share button */}
          {!isRunning && results && score !== null && (
            <div style={styles.shareRow}>
              <ShareButton
                url={checkedUrl}
                score={score}
                confidence={confidence}
                results={results}
                verdict={verdict}
              />
              <button
                style={styles.newCheckBtn}
                onClick={() => {
                  setResults(null)
                  setLiveResults([])
                  setUrl('')
                  inputRef.current?.focus()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                Check another URL
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    paddingBottom: '80px'
  },
  inputCard: {
    background: 'rgba(15, 23, 42, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 18px 48px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  inputRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'stretch'
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '13px',
    fontSize: '11px',
    fontFamily: "'DM Mono', monospace",
    color: '#64748b',
    zIndex: 1,
    pointerEvents: 'none',
    letterSpacing: '0.06em'
  },
  input: {
    width: '100%',
    background: '#08111b',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    borderRadius: '10px',
    padding: '13px 16px 13px 52px',
    fontSize: '15px',
    fontFamily: "'DM Mono', monospace",
    color: '#e5eef8',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 0 0 0 rgba(56,189,248,0)'
  },
  button: {
    background: '#e2e8f0',
    color: '#0b1117',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: '10px',
    padding: '13px 22px',
    fontSize: '15px',
    fontWeight: 700,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    letterSpacing: '0',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 10px 24px rgba(226, 232, 240, 0.1)',
    transition: 'filter 0.2s ease, transform 0.2s ease'
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite'
  },
  errorMsg: {
    color: '#fb7185',
    fontSize: '13px',
    fontFamily: "'DM Mono', monospace",
    padding: '8px 12px',
    background: 'rgba(244, 63, 94, 0.08)',
    border: '1px solid rgba(251, 113, 133, 0.22)',
    borderRadius: '8px'
  },
  exampleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)'
  },
  exampleText: {
    fontSize: '13px',
    fontFamily: "'DM Mono', monospace",
    color: '#64748b'
  },
  exampleLink: {
    background: 'none',
    border: 'none',
    color: '#7dd3fc',
    fontFamily: "'DM Mono', monospace",
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    textUnderlineOffset: '3px',
    transition: 'color 0.15s ease'
  },
  checksSection: {
    paddingTop: '8px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    alignItems: 'end',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  sectionTitle: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: '22px',
    fontWeight: 750,
    lineHeight: 1.2,
    color: '#f8fafc',
    letterSpacing: '0'
  },
  sectionCopy: {
    fontSize: '14px',
    color: '#7b8ba3',
    lineHeight: 1.5,
    maxWidth: '420px'
  },
  checksGrid: {
    display: 'grid',
    gap: '12px'
  },
  checkCard: {
    minHeight: '154px',
    background: 'rgba(15, 23, 42, 0.58)',
    border: '1px solid rgba(148, 163, 184, 0.13)',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
  },
  checkDetail: {
    display: 'inline-flex',
    marginBottom: '20px',
    color: '#7dd3fc',
    background: 'rgba(14, 165, 233, 0.08)',
    border: '1px solid rgba(125, 211, 252, 0.14)',
    borderRadius: '999px',
    padding: '4px 8px',
    fontSize: '11px',
    fontFamily: "'DM Mono', monospace"
  },
  checkTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#e5eef8',
    marginBottom: '8px',
    letterSpacing: '0'
  },
  checkCopy: {
    fontSize: '13px',
    lineHeight: 1.55,
    color: '#8795aa'
  },
  results: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    animation: 'fadeInUp 0.4s ease forwards'
  },
  checkedUrlBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    background: 'rgba(14, 165, 233, 0.07)',
    border: '1px solid rgba(125, 211, 252, 0.14)',
    borderRadius: '8px',
    flexWrap: 'wrap'
  },
  checkedUrlLabel: {
    fontSize: '11px',
    fontFamily: "'DM Mono', monospace",
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#64748b',
    fontWeight: 500
  },
  checkedUrlValue: {
    fontSize: '13px',
    fontFamily: "'DM Mono', monospace",
    color: '#bae6fd',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  rerunBtn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#94a3b8',
    fontSize: '12px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transition: 'all 0.15s ease'
  },
  scoreCard: {
    background: 'rgba(15, 23, 42, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    borderRadius: '14px',
    padding: '28px 24px',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)'
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginTop: '8px'
  },
  confidenceRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: '10px',
    marginTop: '-8px',
    marginBottom: '18px'
  },
  confidenceLabel: {
    color: '#94a3b8',
    fontSize: '12px',
    fontFamily: "'DM Mono', monospace",
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  confidenceValue: {
    color: '#e2e8f0',
    fontSize: '18px',
    fontWeight: 700,
    fontFamily: "'Syne', system-ui, sans-serif"
  },
  unknownNote: {
    maxWidth: '640px',
    margin: '0 auto 18px',
    padding: '10px 12px',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    borderRadius: '8px',
    background: 'rgba(148, 163, 184, 0.06)',
    color: '#94a3b8',
    fontSize: '13px',
    lineHeight: 1.5,
    textAlign: 'center'
  },
  recommendations: {
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(245, 158, 11, 0.15)',
    borderRadius: '12px',
    padding: '24px',
    animation: 'fadeInUp 0.4s ease forwards'
  },
  recHeading: {
    fontFamily: "'Syne', system-ui, sans-serif",
    fontSize: '18px',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    letterSpacing: '-0.01em'
  },
  recIcon: {
    fontSize: '20px'
  },
  recList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  recItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.025)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.05)',
    animation: 'slideInRow 0.35s ease both'
  },
  recBullet: {
    color: '#6366f1',
    fontWeight: 700,
    fontSize: '16px',
    marginTop: '1px',
    flexShrink: 0
  },
  recLabel: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#cbd5e1'
  },
  recSep: {
    color: '#475569'
  },
  recTip: {
    fontSize: '13.5px',
    color: '#94a3b8',
    lineHeight: 1.5
  },
  shareRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  newCheckBtn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 500,
    padding: '10px 18px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transition: 'all 0.2s ease'
  }
}
