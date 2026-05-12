import { performance } from 'node:perf_hooks'

const REQUIRED_HEADERS = [
  {
    id: 'csp',
    label: 'Content-Security-Policy',
    key: 'content-security-policy',
    missingDetail: 'Content-Security-Policy header not found'
  },
  {
    id: 'hsts',
    label: 'Strict-Transport-Security',
    key: 'strict-transport-security',
    missingDetail: 'Strict-Transport-Security header not found'
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

const HEALTH_PATHS = ['/health', '/api/health', '/readyz']
const MAIN_TIMEOUT_MS = 10000
const HEALTH_TIMEOUT_MS = 5000

function validateUrl(value) {
  if (!value || typeof value !== 'string') {
    throw new Error('Missing url query parameter')
  }

  const parsed = new URL(value)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must start with http:// or https://')
  }

  return parsed
}

function headersToObject(headers) {
  const out = {}
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value
  })
  return out
}

function truncate(value, length) {
  if (!value) return ''
  return value.length > length ? `${value.slice(0, length)}...` : value
}

async function fetchWithTiming(url, timeoutMs) {
  const controller = new AbortController()
  const startedAt = performance.now()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'ShipCheck/1.0 (+https://shipcheck.local)',
        accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'
      }
    })

    return {
      ok: true,
      response,
      responseTimeMs: Math.round(performance.now() - startedAt)
    }
  } catch (error) {
    return {
      ok: false,
      error,
      responseTimeMs: Math.round(performance.now() - startedAt)
    }
  } finally {
    clearTimeout(timeout)
  }
}

function buildUrlValidationCheck(parsed) {
  return {
    id: 'url_valid',
    label: 'URL Validation',
    status: 'pass',
    detail: `Valid URL: ${parsed.hostname}`,
    inspected: true
  }
}

function buildHttpsCheck(parsed) {
  const isHttps = parsed.protocol === 'https:'
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

function buildReachabilityCheck(mainFetch) {
  if (!mainFetch.ok) {
    const aborted = mainFetch.error?.name === 'AbortError'
    return {
      id: 'reachable',
      label: 'App Reachable',
      status: aborted ? 'fail' : 'unknown',
      detail: aborted
        ? `Request timed out after ${mainFetch.responseTimeMs}ms`
        : `Could not complete the automated request: ${mainFetch.error?.message || 'fetch failed'}`,
      inspected: aborted
    }
  }

  const { response } = mainFetch
  const redirected = response.redirected ? ` Final URL: ${response.url}` : ''

  if (response.status >= 200 && response.status <= 299) {
    return {
      id: 'reachable',
      label: 'App Reachable',
      status: 'pass',
      detail: `Server responded with HTTP ${response.status}.${redirected}`,
      inspected: true
    }
  }

  if (response.status === 401 || response.status === 403) {
    return {
      id: 'reachable',
      label: 'App Reachable',
      status: 'warning',
      detail: `Server responded with HTTP ${response.status}. The app is reachable, but restricted this automated check.`,
      inspected: true
    }
  }

  if (response.status >= 300 && response.status <= 399) {
    return {
      id: 'reachable',
      label: 'App Reachable',
      status: 'warning',
      detail: `Server responded with HTTP ${response.status}. Redirect handling may need review.${redirected}`,
      inspected: true
    }
  }

  return {
    id: 'reachable',
    label: 'App Reachable',
    status: response.status >= 500 ? 'fail' : 'warning',
    detail: `Server responded with HTTP ${response.status}.`,
    inspected: true
  }
}

function buildResponseTimeCheck(mainFetch) {
  if (!mainFetch.ok) {
    const aborted = mainFetch.error?.name === 'AbortError'
    return {
      id: 'response_time',
      label: 'Response Time',
      status: aborted ? 'fail' : 'unknown',
      detail: aborted
        ? `>${mainFetch.responseTimeMs}ms. Request timed out.`
        : 'Could not measure response time because the request failed.',
      inspected: aborted
    }
  }

  const ms = mainFetch.responseTimeMs
  if (ms < 800) {
    return {
      id: 'response_time',
      label: 'Response Time',
      status: 'pass',
      detail: `${ms}ms. Fast response.`,
      inspected: true
    }
  }

  if (ms <= 2000) {
    return {
      id: 'response_time',
      label: 'Response Time',
      status: 'warning',
      detail: `${ms}ms. Acceptable, but worth watching.`,
      inspected: true
    }
  }

  return {
    id: 'response_time',
    label: 'Response Time',
    status: 'fail',
    detail: `${ms}ms. Too slow for launch readiness.`,
    inspected: true
  }
}

function buildHeaderChecks(mainFetch, headerMap) {
  if (!mainFetch.ok || !headerMap) {
    return REQUIRED_HEADERS.map(({ id, label }) => ({
      id,
      label,
      status: 'unknown',
      detail: 'Headers could not be inspected from this environment.',
      inspected: false
    }))
  }

  return REQUIRED_HEADERS.map(({ id, label, key, missingDetail }) => {
    const value = headerMap[key]
    if (value) {
      return {
        id,
        label,
        status: 'pass',
        detail: `${label}: ${truncate(value, 80)}`,
        inspected: true
      }
    }

    return {
      id,
      label,
      status: 'fail',
      detail: missingDetail,
      inspected: true
    }
  })
}

async function buildMetaChecks(mainFetch) {
  if (!mainFetch.ok) {
    return [
      {
        id: 'page_title',
        label: 'Page Title',
        status: 'unknown',
        detail: 'HTML could not be read from this environment.',
        inspected: false
      },
      {
        id: 'meta_description',
        label: 'Meta Description',
        status: 'unknown',
        detail: 'HTML could not be read from this environment.',
        inspected: false
      }
    ]
  }

  if (mainFetch.response.status === 401 || mainFetch.response.status === 403) {
    return [
      {
        id: 'page_title',
        label: 'Page Title',
        status: 'unknown',
        detail: `HTML metadata was not verified because the main route returned HTTP ${mainFetch.response.status}.`,
        inspected: false
      },
      {
        id: 'meta_description',
        label: 'Meta Description',
        status: 'unknown',
        detail: `HTML metadata was not verified because the main route returned HTTP ${mainFetch.response.status}.`,
        inspected: false
      }
    ]
  }

  const contentType = mainFetch.response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('html')) {
    return [
      {
        id: 'page_title',
        label: 'Page Title',
        status: 'unknown',
        detail: `Response is not HTML (${contentType || 'unknown content type'}).`,
        inspected: false
      },
      {
        id: 'meta_description',
        label: 'Meta Description',
        status: 'unknown',
        detail: `Response is not HTML (${contentType || 'unknown content type'}).`,
        inspected: false
      }
    ]
  }

  let html = ''
  try {
    html = await mainFetch.response.text()
  } catch {
    return [
      {
        id: 'page_title',
        label: 'Page Title',
        status: 'unknown',
        detail: 'HTML body could not be read.',
        inspected: false
      },
      {
        id: 'meta_description',
        label: 'Meta Description',
        status: 'unknown',
        detail: 'HTML body could not be read.',
        inspected: false
      }
    ]
  }

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()
  const meta = html
    .match(/<meta\s+[^>]*name=["']description["'][^>]*>/i)?.[0]
    ?.match(/content=["']([^"']*)["']/i)?.[1]
    ?.trim()

  return [
    title
      ? {
          id: 'page_title',
          label: 'Page Title',
          status: 'pass',
          detail: `"${truncate(title.replace(/\s+/g, ' '), 70)}"`,
          inspected: true
        }
      : {
          id: 'page_title',
          label: 'Page Title',
          status: 'warning',
          detail: 'Readable HTML did not include a <title> tag.',
          inspected: true
        },
    meta
      ? {
          id: 'meta_description',
          label: 'Meta Description',
          status: 'pass',
          detail: `"${truncate(meta.replace(/\s+/g, ' '), 90)}"`,
          inspected: true
        }
      : {
          id: 'meta_description',
          label: 'Meta Description',
          status: 'warning',
          detail: 'Readable HTML did not include a meta description.',
          inspected: true
        }
  ]
}

async function buildHealthCheck(parsed) {
  const baseOrigin = parsed.origin
  const probes = await Promise.all(
    HEALTH_PATHS.map(async (path) => {
      const url = new URL(path, baseOrigin).toString()
      const result = await fetchWithTiming(url, HEALTH_TIMEOUT_MS)

      if (!result.ok) {
        return {
          path,
          url,
          ok: false,
          status: null,
          error: result.error?.name === 'AbortError' ? 'timeout' : result.error?.message || 'fetch failed',
          responseTimeMs: result.responseTimeMs
        }
      }

      return {
        path,
        url,
        ok: true,
        status: result.response.status,
        responseTimeMs: result.responseTimeMs
      }
    })
  )

  const passing = probes.find((probe) => probe.ok && probe.status >= 200 && probe.status <= 399)
  if (passing) {
    return {
      id: 'health',
      label: 'Health Endpoint',
      status: 'pass',
      detail: `Health endpoint passed at ${passing.path} with HTTP ${passing.status}.`,
      inspected: true,
      probes
    }
  }

  const inspected = probes.some((probe) => probe.ok)
  if (!inspected) {
    return {
      id: 'health',
      label: 'Health Endpoint',
      status: 'unknown',
      detail: 'Could not inspect /health, /api/health, or /readyz from this environment.',
      inspected: false,
      probes
    }
  }

  const statuses = probes
    .filter((probe) => probe.ok)
    .map((probe) => `${probe.path}: HTTP ${probe.status}`)
    .join(', ')

  return {
    id: 'health',
    label: 'Health Endpoint',
    status: 'warning',
    detail: `No passing health endpoint found. ${statuses}`,
    inspected: true,
    probes
  }
}

export async function inspectUrl(rawUrl) {
  const parsed = validateUrl(rawUrl)
  const mainFetch = await fetchWithTiming(parsed.toString(), MAIN_TIMEOUT_MS)
  const headerMap = mainFetch.ok ? headersToObject(mainFetch.response.headers) : null

  const [healthCheck, metaChecks] = await Promise.all([
    buildHealthCheck(parsed),
    buildMetaChecks(mainFetch)
  ])

  const checks = [
    buildUrlValidationCheck(parsed),
    buildHttpsCheck(parsed),
    buildReachabilityCheck(mainFetch),
    buildResponseTimeCheck(mainFetch),
    ...buildHeaderChecks(mainFetch, headerMap),
    healthCheck,
    ...metaChecks
  ]

  return {
    inputUrl: parsed.toString(),
    finalUrl: mainFetch.ok ? mainFetch.response.url : null,
    httpStatus: mainFetch.ok ? mainFetch.response.status : null,
    responseTimeMs: mainFetch.responseTimeMs,
    headers: headerMap,
    healthProbes: healthCheck.probes || [],
    checks
  }
}

export function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  res.statusCode = statusCode
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(body)
}

export async function handleCheckRequest(req, res, rawUrl = req.url) {
  try {
    const requestUrl = new URL(rawUrl, 'http://shipcheck.local')
    const targetUrl = requestUrl.searchParams.get('url')
    const report = await inspectUrl(targetUrl)
    sendJson(res, 200, report)
  } catch (error) {
    sendJson(res, 400, {
      error: error.message || 'Unable to inspect URL'
    })
  }
}
