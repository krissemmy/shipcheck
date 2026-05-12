/**
 * ShipCheck — Core check utilities
 * All checks are async, run client-side via fetch with corsproxy.io fallback
 */

const CORS_PROXY = 'https://corsproxy.io/?url='
const FETCH_TIMEOUT = 10000 // 10s timeout

/**
 * Wrap fetch with a timeout
 */
function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

/**
 * Fetch via CORS proxy
 */
function proxiedFetch(url, timeout = FETCH_TIMEOUT) {
  const proxied = CORS_PROXY + encodeURIComponent(url)
  return fetchWithTimeout(proxied, {}, timeout)
}

/**
 * Attempt direct fetch first, fall back to CORS proxy
 */
async function fetchWithFallback(url, timeout = FETCH_TIMEOUT) {
  try {
    const res = await fetchWithTimeout(url, { mode: 'no-cors' }, timeout / 2)
    return { res, proxied: false }
  } catch {
    const res = await proxiedFetch(url, timeout)
    return { res, proxied: true }
  }
}

// ─────────────────────────────────────────────
// CHECK 1: URL Validation
// ─────────────────────────────────────────────
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
        : 'URL must use http:// or https:// protocol'
    }
  } catch {
    return {
      id: 'url_valid',
      label: 'URL Validation',
      status: 'fail',
      detail: 'Could not parse URL — check formatting'
    }
  }
}

// ─────────────────────────────────────────────
// CHECK 2: HTTPS
// ─────────────────────────────────────────────
export async function checkHttps(url) {
  const isHttps = url.startsWith('https://')
  return {
    id: 'https',
    label: 'HTTPS Enabled',
    status: isHttps ? 'pass' : 'fail',
    detail: isHttps
      ? 'Connection is encrypted with HTTPS'
      : 'URL uses HTTP — HTTPS is required for security'
  }
}

// ─────────────────────────────────────────────
// CHECK 3: Reachability + HTTP Status
// ─────────────────────────────────────────────
export async function checkReachability(url) {
  try {
    const res = await proxiedFetch(url, 8000)
    const status = res.status

    if (status >= 200 && status <= 299) {
      return {
        id: 'reachable',
        label: 'App Reachable',
        status: 'pass',
        detail: `HTTP ${status} — App is responding`
      }
    } else if (status >= 300 && status <= 399) {
      return {
        id: 'reachable',
        label: 'App Reachable',
        status: 'warning',
        detail: `HTTP ${status} — Redirect detected`
      }
    } else {
      return {
        id: 'reachable',
        label: 'App Reachable',
        status: 'fail',
        detail: `HTTP ${status} — Server returned an error`
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return {
        id: 'reachable',
        label: 'App Reachable',
        status: 'fail',
        detail: 'Request timed out — app may be down or too slow'
      }
    }
    return {
      id: 'reachable',
      label: 'App Reachable',
      status: 'fail',
      detail: 'Could not reach the app — check if it\'s publicly deployed'
    }
  }
}

// ─────────────────────────────────────────────
// CHECK 4: Response Time
// ─────────────────────────────────────────────
export async function checkResponseTime(url) {
  const start = performance.now()
  try {
    await proxiedFetch(url, 8000)
    const ms = Math.round(performance.now() - start)

    if (ms < 800) {
      return {
        id: 'response_time',
        label: 'Response Time',
        status: 'pass',
        detail: `${ms}ms — Fast response`
      }
    } else if (ms <= 2000) {
      return {
        id: 'response_time',
        label: 'Response Time',
        status: 'warning',
        detail: `${ms}ms — Acceptable but could be faster`
      }
    } else {
      return {
        id: 'response_time',
        label: 'Response Time',
        status: 'fail',
        detail: `${ms}ms — Too slow (>2s)`
      }
    }
  } catch (err) {
    const ms = Math.round(performance.now() - start)
    if (err.name === 'AbortError') {
      return {
        id: 'response_time',
        label: 'Response Time',
        status: 'fail',
        detail: `>${ms}ms — Request timed out`
      }
    }
    return {
      id: 'response_time',
      label: 'Response Time',
      status: 'fail',
      detail: 'Could not measure — request failed'
    }
  }
}

// ─────────────────────────────────────────────
// CHECK 5: Security Headers (5 sub-checks)
// ─────────────────────────────────────────────
export async function checkSecurityHeaders(url) {
  let headers = null

  try {
    const res = await proxiedFetch(url, 8000)
    headers = res.headers
  } catch {
    // If fetch fails, all headers are missing
  }

  const headerChecks = [
    {
      id: 'csp',
      label: 'Content-Security-Policy',
      key: 'content-security-policy',
      missingDetail: 'CSP header not found'
    },
    {
      id: 'hsts',
      label: 'Strict-Transport-Security',
      key: 'strict-transport-security',
      missingDetail: 'HSTS header not found'
    },
    {
      id: 'xframe',
      label: 'X-Frame-Options',
      key: 'x-frame-options',
      missingDetail: 'X-Frame-Options header not found'
    },
    {
      id: 'xcto',
      label: 'X-Content-Type-Options',
      key: 'x-content-type-options',
      missingDetail: 'X-Content-Type-Options header not found'
    },
    {
      id: 'referrer',
      label: 'Referrer-Policy',
      key: 'referrer-policy',
      missingDetail: 'Referrer-Policy header not found'
    }
  ]

  return headerChecks.map(({ id, label, key, missingDetail }) => {
    if (!headers) {
      return { id, label, status: 'fail', detail: 'Could not fetch headers' }
    }
    const value = headers.get(key)
    if (value) {
      return {
        id,
        label,
        status: 'pass',
        detail: `${label}: ${value.length > 60 ? value.slice(0, 60) + '…' : value}`
      }
    }
    return { id, label, status: 'fail', detail: missingDetail }
  })
}

// ─────────────────────────────────────────────
// CHECK 6: Health Endpoints
// ─────────────────────────────────────────────
export async function checkHealthEndpoints(url) {
  let base
  try {
    const parsed = new URL(url)
    base = `${parsed.protocol}//${parsed.host}`
  } catch {
    return {
      id: 'health',
      label: 'Health Endpoint',
      status: 'fail',
      detail: 'Could not determine base URL'
    }
  }

  const endpoints = ['/health', '/api/health', '/readyz']

  const results = await Promise.allSettled(
    endpoints.map(async (path) => {
      const fullUrl = base + path
      const res = await proxiedFetch(fullUrl, 5000)
      return { path, status: res.status }
    })
  )

  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'fulfilled' && r.value.status >= 200 && r.value.status < 300) {
      return {
        id: 'health',
        label: 'Health Endpoint',
        status: 'pass',
        detail: `Health endpoint found at ${r.value.path}`
      }
    }
  }

  return {
    id: 'health',
    label: 'Health Endpoint',
    status: 'warning',
    detail: 'No health endpoint found at /health, /api/health, or /readyz'
  }
}

// ─────────────────────────────────────────────
// CHECK 7 & 8: Page Title + Meta Description (shared fetch)
// ─────────────────────────────────────────────
export async function checkPageMeta(url) {
  let html = null

  try {
    const res = await proxiedFetch(url, 8000)
    html = await res.text()
  } catch {
    return [
      {
        id: 'page_title',
        label: 'Page Title',
        status: 'fail',
        detail: 'Could not fetch page HTML'
      },
      {
        id: 'meta_description',
        label: 'Meta Description',
        status: 'warning',
        detail: 'Could not fetch page HTML'
      }
    ]
  }

  let titleResult, metaResult

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Title check
    const titleEl = doc.querySelector('title')
    const titleText = titleEl ? titleEl.textContent.trim() : ''
    if (titleText) {
      titleResult = {
        id: 'page_title',
        label: 'Page Title',
        status: 'pass',
        detail: `"${titleText.length > 60 ? titleText.slice(0, 60) + '…' : titleText}"`
      }
    } else {
      titleResult = {
        id: 'page_title',
        label: 'Page Title',
        status: 'fail',
        detail: 'No <title> tag found'
      }
    }

    // Meta description check
    const metaEl = doc.querySelector('meta[name="description"]')
    const metaContent = metaEl ? metaEl.getAttribute('content')?.trim() : ''
    if (metaContent) {
      metaResult = {
        id: 'meta_description',
        label: 'Meta Description',
        status: 'pass',
        detail: `"${metaContent.length > 80 ? metaContent.slice(0, 80) + '…' : metaContent}"`
      }
    } else {
      metaResult = {
        id: 'meta_description',
        label: 'Meta Description',
        status: 'warning',
        detail: 'No <meta name="description"> tag found'
      }
    }
  } catch {
    titleResult = {
      id: 'page_title',
      label: 'Page Title',
      status: 'fail',
      detail: 'Failed to parse HTML'
    }
    metaResult = {
      id: 'meta_description',
      label: 'Meta Description',
      status: 'warning',
      detail: 'Failed to parse HTML'
    }
  }

  return [titleResult, metaResult]
}

// ─────────────────────────────────────────────
// SCORING ENGINE
// ─────────────────────────────────────────────
const WEIGHTS = {
  https: 15,
  reachable: 20,
  response_time: 10,
  csp: 10,
  hsts: 8,
  xframe: 5,
  xcto: 5,
  referrer: 5,
  health: 8,
  page_title: 7,
  meta_description: 7
}

export function calculateScore(results) {
  let score = 0
  for (const result of results) {
    const weight = WEIGHTS[result.id] || 0
    if (result.status === 'pass') {
      score += weight
    } else if (result.status === 'warning') {
      score += weight * 0.5
    }
  }
  return Math.round(Math.min(100, Math.max(0, score)))
}

// ─────────────────────────────────────────────
// RECOMMENDATIONS
// ─────────────────────────────────────────────
const RECOMMENDATIONS = {
  csp: "Add a Content-Security-Policy header to protect against XSS attacks.",
  hsts: "Enable Strict-Transport-Security to force HTTPS connections.",
  xframe: "Add X-Frame-Options: DENY to prevent clickjacking.",
  xcto: "Set X-Content-Type-Options: nosniff to prevent MIME sniffing.",
  referrer: "Set a Referrer-Policy to control referrer information.",
  health: "Add a /health endpoint returning 200 OK for uptime monitoring.",
  response_time: "Optimize server response time — consider caching or a CDN.",
  meta_description: "Add a <meta name='description'> tag for SEO.",
  https: "Deploy with HTTPS. Most platforms (Vercel, Railway, CreateOS) provide this for free.",
  reachable: "Make sure your app is publicly deployed and not behind authentication.",
  page_title: "Add a <title> tag to your page for SEO and usability."
}

export function getRecommendations(results) {
  return results
    .filter(r => r.status === 'fail' || r.status === 'warning')
    .map(r => ({ id: r.id, label: r.label, tip: RECOMMENDATIONS[r.id] || null }))
    .filter(r => r.tip)
}

export function getVerdict(score) {
  if (score >= 85) return 'Production Ready 🚀'
  if (score >= 70) return 'Safe to share for demos'
  if (score >= 50) return 'Needs work before sharing'
  return 'Not ready — fix critical issues first'
}

// ─────────────────────────────────────────────
// MAIN RUNNER
// ─────────────────────────────────────────────
export async function runAllChecks(url, onProgress) {
  const allResults = []

  // Validate URL first
  const urlCheck = await checkUrlValid(url)
  allResults.push(urlCheck)
  onProgress && onProgress([...allResults])

  if (urlCheck.status === 'fail') {
    return allResults
  }

  // Run HTTPS check (instant)
  const httpsCheck = await checkHttps(url)
  allResults.push(httpsCheck)
  onProgress && onProgress([...allResults])

  // Run network checks in parallel
  const [reachability, responseTime, securityHeaders, healthEndpoints, pageMeta] =
    await Promise.allSettled([
      checkReachability(url),
      checkResponseTime(url),
      checkSecurityHeaders(url),
      checkHealthEndpoints(url),
      checkPageMeta(url)
    ])

  if (reachability.status === 'fulfilled') {
    allResults.push(reachability.value)
  } else {
    allResults.push({
      id: 'reachable',
      label: 'App Reachable',
      status: 'fail',
      detail: 'Check failed unexpectedly'
    })
  }
  onProgress && onProgress([...allResults])

  if (responseTime.status === 'fulfilled') {
    allResults.push(responseTime.value)
  } else {
    allResults.push({
      id: 'response_time',
      label: 'Response Time',
      status: 'fail',
      detail: 'Check failed unexpectedly'
    })
  }
  onProgress && onProgress([...allResults])

  if (securityHeaders.status === 'fulfilled') {
    allResults.push(...securityHeaders.value)
  } else {
    ;['csp', 'hsts', 'xframe', 'xcto', 'referrer'].forEach(id => {
      allResults.push({ id, label: id.toUpperCase(), status: 'fail', detail: 'Check failed' })
    })
  }
  onProgress && onProgress([...allResults])

  if (healthEndpoints.status === 'fulfilled') {
    allResults.push(healthEndpoints.value)
  } else {
    allResults.push({
      id: 'health',
      label: 'Health Endpoint',
      status: 'warning',
      detail: 'Check failed unexpectedly'
    })
  }
  onProgress && onProgress([...allResults])

  if (pageMeta.status === 'fulfilled') {
    allResults.push(...pageMeta.value)
  } else {
    allResults.push(
      { id: 'page_title', label: 'Page Title', status: 'fail', detail: 'Check failed' },
      { id: 'meta_description', label: 'Meta Description', status: 'warning', detail: 'Check failed' }
    )
  }
  onProgress && onProgress([...allResults])

  return allResults
}
