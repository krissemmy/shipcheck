import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'

const MAX_REDIRECTS = 5
const MAX_BODY_BYTES = 512 * 1024
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308])
const REQUEST_HEADERS = {
  'user-agent': 'ShipCheck/1.0 (+https://shipcheck.local)',
  accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'
}

const blockedV4 = new net.BlockList()
blockedV4.addSubnet('0.0.0.0', 8, 'ipv4')
blockedV4.addSubnet('10.0.0.0', 8, 'ipv4')
blockedV4.addSubnet('100.64.0.0', 10, 'ipv4')
blockedV4.addSubnet('127.0.0.0', 8, 'ipv4')
blockedV4.addSubnet('169.254.0.0', 16, 'ipv4')
blockedV4.addSubnet('172.16.0.0', 12, 'ipv4')
blockedV4.addSubnet('192.0.0.0', 24, 'ipv4')
blockedV4.addSubnet('192.0.2.0', 24, 'ipv4')
blockedV4.addSubnet('192.168.0.0', 16, 'ipv4')
blockedV4.addSubnet('198.18.0.0', 15, 'ipv4')
blockedV4.addSubnet('198.51.100.0', 24, 'ipv4')
blockedV4.addSubnet('203.0.113.0', 24, 'ipv4')
blockedV4.addSubnet('224.0.0.0', 4, 'ipv4')
blockedV4.addSubnet('240.0.0.0', 4, 'ipv4')
blockedV4.addAddress('255.255.255.255', 'ipv4')

const blockedV6 = new net.BlockList()
blockedV6.addAddress('::', 'ipv6')
blockedV6.addAddress('::1', 'ipv6')
blockedV6.addSubnet('100::', 64, 'ipv6')
blockedV6.addSubnet('2001:2::', 48, 'ipv6')
blockedV6.addSubnet('2001:10::', 28, 'ipv6')
blockedV6.addSubnet('2001:db8::', 32, 'ipv6')
blockedV6.addSubnet('fc00::', 7, 'ipv6')
blockedV6.addSubnet('fe80::', 10, 'ipv6')
blockedV6.addSubnet('ff00::', 8, 'ipv6')

export class UnsafeUrlError extends Error {
  constructor(message = 'URL targets a private or internal address') {
    super(message)
    this.name = 'UnsafeUrlError'
    this.code = 'ENOTPUBLIC'
  }
}

export function canonicalHostname(hostname) {
  if (!hostname) return ''
  let host = String(hostname).trim()
  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1)
  }
  return host.replace(/\.+$/, '').toLowerCase()
}

export function isRestrictedHostname(hostname) {
  const host = canonicalHostname(hostname)
  if (!host) return true
  if (host === 'localhost' || host.endsWith('.localhost')) return true
  if (host === 'internal' || host.endsWith('.internal')) return true
  if (host === 'local' || host.endsWith('.local')) return true
  if (host === 'lan' || host.endsWith('.lan')) return true
  if (host === 'intranet' || host.endsWith('.intranet')) return true
  return false
}

function parseIpv6Parts(ip) {
  let value = ip.toLowerCase()
  const mixed = value.match(/:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mixed) {
    const octets = mixed[1].split('.').map(Number)
    if (octets.length !== 4 || octets.some((part) => part > 255)) return null
    const hi = ((octets[0] << 8) | octets[1]).toString(16)
    const lo = ((octets[2] << 8) | octets[3]).toString(16)
    value = `${value.slice(0, -mixed[1].length)}${hi}:${lo}`
  }

  const sides = value.split('::')
  if (sides.length > 2) return null

  const head = sides[0] ? sides[0].split(':') : []
  const tail = sides.length === 2 && sides[1] ? sides[1].split(':') : []
  if (sides.length === 1 && head.length !== 8) return null

  const missing = sides.length === 1 ? 0 : 8 - head.length - tail.length
  if (missing < 0) return null

  const parts = [...head, ...Array(missing).fill('0'), ...tail]
  if (parts.length !== 8) return null

  const parsed = parts.map((part) => Number.parseInt(part || '0', 16))
  if (parsed.some((part) => Number.isNaN(part) || part < 0 || part > 0xffff)) return null
  return parsed
}

function ipv4FromIpv6Parts(parts) {
  if (!parts || parts.length !== 8) return null

  const mapped =
    parts[0] === 0 &&
    parts[1] === 0 &&
    parts[2] === 0 &&
    parts[3] === 0 &&
    parts[4] === 0 &&
    parts[5] === 0xffff
  if (mapped) {
    return `${parts[6] >> 8}.${parts[6] & 255}.${parts[7] >> 8}.${parts[7] & 255}`
  }

  const nat64 =
    parts[0] === 0x64 &&
    parts[1] === 0xff9b &&
    parts[2] === 0 &&
    parts[3] === 0 &&
    parts[4] === 0 &&
    parts[5] === 0
  if (nat64) {
    return `${parts[6] >> 8}.${parts[6] & 255}.${parts[7] >> 8}.${parts[7] & 255}`
  }

  if (parts[0] === 0x2002) {
    return `${parts[1] >> 8}.${parts[1] & 255}.${parts[2] >> 8}.${parts[2] & 255}`
  }

  return null
}

export function isBlockedIp(address) {
  const ip = canonicalHostname(address)
  const version = net.isIP(ip)

  if (version === 4) {
    return blockedV4.check(ip, 'ipv4')
  }

  if (version === 6) {
    if (blockedV6.check(ip, 'ipv6')) return true
    const mapped = ipv4FromIpv6Parts(parseIpv6Parts(ip))
    return Boolean(mapped && blockedV4.check(mapped, 'ipv4'))
  }

  return true
}

export function assertSafeUrl(value) {
  const parsed = new URL(value)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must start with http:// or https://')
  }
  if (parsed.username || parsed.password) {
    throw new UnsafeUrlError('URL must not include credentials')
  }

  const hostname = canonicalHostname(parsed.hostname)
  if (!hostname) {
    throw new UnsafeUrlError('URL targets a private or internal address')
  }

  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      throw new UnsafeUrlError('URL targets a private or internal address')
    }
  } else if (isRestrictedHostname(hostname)) {
    throw new UnsafeUrlError('URL targets a private or internal address')
  }

  return parsed
}

export function getUnsafeUrlError(error) {
  let current = error
  while (current) {
    if (current instanceof UnsafeUrlError) return current
    if (current.code === 'ENOTPUBLIC') {
      return new UnsafeUrlError('URL targets a private or internal address')
    }
    current = current.cause
  }
  return null
}

export function safeLookup(hostname, options, callback) {
  dns.lookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
    if (error) {
      callback(error)
      return
    }

    const records = Array.isArray(addresses) ? addresses : []
    if (records.length === 0 || records.some((record) => isBlockedIp(record.address))) {
      callback(new UnsafeUrlError('URL resolves to a private or internal address'))
      return
    }

    if (options?.all) {
      callback(null, records)
      return
    }

    callback(null, records[0].address, records[0].family)
  })
}

class SimpleHeaders {
  constructor(headers = {}) {
    this._headers = headers
  }

  get(name) {
    const value = this._headers[String(name).toLowerCase()]
    if (value == null) return null
    return Array.isArray(value) ? value.join(', ') : String(value)
  }

  forEach(fn) {
    for (const [key, value] of Object.entries(this._headers)) {
      fn(Array.isArray(value) ? value.join(', ') : String(value), key)
    }
  }
}

class SimpleResponse {
  constructor({ status, headers, url, redirected, body }) {
    this.status = status
    this.headers = new SimpleHeaders(headers)
    this.url = url
    this.redirected = redirected
    this._body = body
  }

  async text() {
    return this._body
  }
}

function readBody(res) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0

    res.on('data', (chunk) => {
      size += chunk.length
      if (size <= MAX_BODY_BYTES) {
        chunks.push(chunk)
      }
    })
    res.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    res.on('error', reject)
  })
}

function requestOnce(urlString, { signal } = {}) {
  const parsed = assertSafeUrl(urlString)
  const isHttps = parsed.protocol === 'https:'
  const lib = isHttps ? https : http
  const hostname = canonicalHostname(parsed.hostname)
  const port = parsed.port ? Number(parsed.port) : isHttps ? 443 : 80

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        protocol: parsed.protocol,
        hostname,
        port,
        path: `${parsed.pathname}${parsed.search}`,
        method: 'GET',
        headers: REQUEST_HEADERS,
        lookup: net.isIP(hostname) ? undefined : safeLookup,
        signal
      },
      async (res) => {
        try {
          const body = await readBody(res)
          resolve(
            new SimpleResponse({
              status: res.statusCode,
              headers: res.headers,
              url: parsed.toString(),
              redirected: false,
              body
            })
          )
        } catch (error) {
          reject(error)
        }
      }
    )

    req.on('error', reject)
    req.end()
  })
}

export async function safeFetch(urlString, { signal, request = requestOnce } = {}) {
  let current = assertSafeUrl(urlString).toString()
  let redirected = false

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await request(current, { signal })
    const location = response.headers.get('location')
    if (!REDIRECT_CODES.has(response.status) || !location) {
      response.redirected = redirected
      response.url = current
      return response
    }

    current = assertSafeUrl(new URL(location, current).toString()).toString()
    redirected = true
  }

  throw new Error('Too many redirects')
}
