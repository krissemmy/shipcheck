/**
 * ShipCheck frontend check adapter.
 * URL inspection happens server-side at /api/check so browser CORS limits do not
 * get reported as app failures.
 */

const FETCH_TIMEOUT = 15000

const WEIGHTS = {
  https: 15,
  reachable: 18,
  response_time: 12,
  csp: 9,
  hsts: 8,
  xframe: 5,
  xcto: 5,
  referrer: 5,
  health: 11,
  page_title: 6,
  meta_description: 6
}

const RECOMMENDATIONS = {
  csp: 'Add a Content-Security-Policy header to reduce XSS risk.',
  hsts: 'Enable Strict-Transport-Security to force HTTPS connections.',
  xframe: 'Add X-Frame-Options or an equivalent CSP frame-ancestors policy.',
  xcto: 'Set X-Content-Type-Options: nosniff to prevent MIME sniffing.',
  referrer: 'Set a Referrer-Policy header to control referrer leakage.',
  health: 'Expose /health, /api/health, or /readyz with a 200-399 response.',
  response_time: 'Review cold starts, caching, database calls, or upstream latency.',
  meta_description: 'Add a concise <meta name="description"> for share previews and search.',
  https: 'Serve the app over HTTPS.',
  reachable: 'Review whether the route should be public, restricted, or moved behind auth.',
  page_title: 'Add a <title> tag to readable HTML pages.'
}

function fetchWithTimeout(url, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

export async function checkUrlValid(url) {
  try {
    const parsed = new URL(url)
    const isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:'
    return {
      id: 'url_valid',
      label: 'URL Validation',
      status: isValid ? 'pass' : 'fail',
      detail: isValid
        ? `Valid URL: ${parsed.hostname}`
        : 'URL must use http:// or https:// protocol',
      inspected: true
    }
  } catch {
    return {
      id: 'url_valid',
      label: 'URL Validation',
      status: 'fail',
      detail: 'Could not parse URL. Check formatting.',
      inspected: true
    }
  }
}

export async function checkHttps(url) {
  const isHttps = url.startsWith('https://')
  return {
    id: 'https',
    label: 'HTTPS Enabled',
    status: isHttps ? 'pass' : 'fail',
    detail: isHttps
      ? 'Connection uses HTTPS/TLS'
      : 'URL uses HTTP. HTTPS is required for launch readiness.',
    inspected: true
  }
}

async function fetchServerReport(url) {
  const res = await fetchWithTimeout(`/api/check?url=${encodeURIComponent(url)}`)
  const payload = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(payload?.error || `Inspection failed with HTTP ${res.status}`)
  }

  return payload
}

function normalizeCheck(check) {
  return {
    inspected: check.status !== 'unknown',
    ...check,
    status: check.status === 'unknown' ? 'unknown' : check.status
  }
}

export function calculateScore(results) {
  let earned = 0
  let possible = 0

  for (const result of results) {
    const weight = WEIGHTS[result.id] || 0
    if (!weight || result.status === 'unknown') continue

    possible += weight
    if (result.status === 'pass') {
      earned += weight
    } else if (result.status === 'warning') {
      earned += weight * 0.6
    }
  }

  if (possible === 0) return 0
  return Math.round(Math.min(100, Math.max(0, (earned / possible) * 100)))
}

export function calculateInspectionConfidence(results) {
  let inspected = 0
  let possible = 0

  for (const result of results) {
    const weight = WEIGHTS[result.id] || 0
    if (!weight) continue

    possible += weight
    if (result.status !== 'unknown') inspected += weight
  }

  if (possible === 0) return 0
  return Math.round(Math.min(100, Math.max(0, (inspected / possible) * 100)))
}

export function getRecommendations(results) {
  return results
    .filter(r => r.status === 'fail' || r.status === 'warning')
    .map(r => ({ id: r.id, label: r.label, tip: RECOMMENDATIONS[r.id] || null }))
    .filter(r => r.tip)
}

export function getVerdict(score, results = []) {
  const criticalFailures = results.some((result) =>
    result.status === 'fail' && ['https', 'reachable', 'response_time'].includes(result.id)
  )
  const confirmedFailures = results.filter((result) => result.status === 'fail').length

  if (criticalFailures) return 'Confirmed critical issues'
  if (score >= 85 && confirmedFailures === 0) return 'Production ready'
  if (score >= 70) return 'Demo ready; verify remaining warnings'
  if (score >= 50) return 'Needs confirmed fixes before launch'
  return 'Not ready based on confirmed failures'
}

export async function runAllChecks(url, onProgress) {
  const allResults = []

  const urlCheck = await checkUrlValid(url)
  allResults.push(urlCheck)
  onProgress && onProgress([...allResults])

  if (urlCheck.status === 'fail') {
    return allResults
  }

  const httpsCheck = await checkHttps(url)
  allResults.push(httpsCheck)
  onProgress && onProgress([...allResults])

  try {
    const report = await fetchServerReport(url)
    const serverChecks = (report.checks || [])
      .filter((check) => check.id !== 'url_valid' && check.id !== 'https')
      .map(normalizeCheck)

    allResults.push(...serverChecks)
    onProgress && onProgress([...allResults])
    return allResults
  } catch (error) {
    const detail = error.message || 'ShipCheck could not inspect this URL from the current environment.'
    allResults.push(
      { id: 'reachable', label: 'App Reachable', status: 'unknown', detail, inspected: false },
      { id: 'response_time', label: 'Response Time', status: 'unknown', detail, inspected: false },
      { id: 'csp', label: 'Content-Security-Policy', status: 'unknown', detail, inspected: false },
      { id: 'hsts', label: 'Strict-Transport-Security', status: 'unknown', detail, inspected: false },
      { id: 'xframe', label: 'X-Frame-Options', status: 'unknown', detail, inspected: false },
      { id: 'xcto', label: 'X-Content-Type-Options', status: 'unknown', detail, inspected: false },
      { id: 'referrer', label: 'Referrer-Policy', status: 'unknown', detail, inspected: false },
      { id: 'health', label: 'Health Endpoint', status: 'unknown', detail, inspected: false },
      { id: 'page_title', label: 'Page Title', status: 'unknown', detail, inspected: false },
      { id: 'meta_description', label: 'Meta Description', status: 'unknown', detail, inspected: false }
    )
    onProgress && onProgress([...allResults])
    return allResults
  }
}
