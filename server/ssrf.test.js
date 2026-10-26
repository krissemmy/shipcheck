import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertSafeUrl, isBlockedIp, isRestrictedHostname, safeFetch, safeLookup } from './ssrf.js'

test('isBlockedIp covers loopback, RFC1918, link-local, and metadata-adjacent ranges', () => {
  const blocked = [
    '127.0.0.1',
    '127.255.255.255',
    '10.1.2.3',
    '192.168.0.1',
    '172.16.0.1',
    '172.31.255.255',
    '169.254.169.254',
    '0.0.0.0',
    '100.64.0.1',
    '255.255.255.255',
    '::1',
    '::',
    'fc00::1',
    'fd00:ec2::254',
    'fe80::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:a9fe:a9fe',
    '64:ff9b::a9fe:a9fe',
    '2002:a9fe:a9fe::1'
  ]

  for (const ip of blocked) {
    assert.equal(isBlockedIp(ip), true, `expected ${ip} to be blocked`)
  }
})

test('isBlockedIp allows ordinary public addresses', () => {
  const allowed = ['1.1.1.1', '8.8.8.8', '142.250.190.78', '172.32.0.1', '2001:4860:4860::8888']
  for (const ip of allowed) {
    assert.equal(isBlockedIp(ip), false, `expected ${ip} to be allowed`)
  }
})

test('restricted hostnames include localhost and local resolver names', () => {
  assert.equal(isRestrictedHostname('localhost'), true)
  assert.equal(isRestrictedHostname('LOCALHOST.'), true)
  assert.equal(isRestrictedHostname('app.localhost'), true)
  assert.equal(isRestrictedHostname('metadata.google.internal'), true)
  assert.equal(isRestrictedHostname('printer.local'), true)
  assert.equal(isRestrictedHostname('example.com'), false)
  assert.equal(isRestrictedHostname('shipcheck.krissemmy.com'), false)
})

test('assertSafeUrl rejects credentials, non-http schemes, and private literals', () => {
  assert.throws(() => assertSafeUrl('file:///etc/passwd'), /http/)
  assert.throws(() => assertSafeUrl('http://user:pass@example.com/'), /credentials/)
  assert.throws(() => assertSafeUrl('http://127.0.0.1/'), /private or internal/i)
  assert.throws(() => assertSafeUrl('http://localhost/'), /private or internal/i)
  assert.doesNotThrow(() => assertSafeUrl('https://example.com/path?q=1'))
})

test('redirect Location values that point at private hosts are rejected', () => {
  const next = new URL('http://127.0.0.1/latest/meta-data/', 'https://example.com/go').toString()
  assert.throws(() => assertSafeUrl(next), /private or internal/i)
  assert.doesNotThrow(() => assertSafeUrl(new URL('/readyz', 'https://example.com').toString()))
})

test('safeLookup rejects hostnames that resolve to loopback', async () => {
  await new Promise((resolve, reject) => {
    safeLookup('localhost', { all: true }, (error, addresses) => {
      if (!error) {
        reject(new Error(`expected lookup to fail, got ${JSON.stringify(addresses)}`))
        return
      }
      try {
        assert.equal(error.name, 'UnsafeUrlError')
        assert.match(error.message, /private or internal/i)
        resolve()
      } catch (assertionError) {
        reject(assertionError)
      }
    })
  })
})

test('safeFetch follows relative redirects on the same public host', async () => {
  const calls = []
  const request = async (url) => {
    calls.push(url)
    if (url.endsWith('/go')) {
      return {
        status: 302,
        headers: {
          get(name) {
            return String(name).toLowerCase() === 'location' ? '/readyz' : null
          }
        }
      }
    }
    return {
      status: 200,
      headers: { get: () => null }
    }
  }

  const response = await safeFetch('https://example.com/go', { request })
  assert.equal(response.status, 200)
  assert.equal(response.redirected, true)
  assert.equal(response.url, 'https://example.com/readyz')
  assert.deepEqual(calls, ['https://example.com/go', 'https://example.com/readyz'])
})

test('safeFetch does not follow a redirect onto a private host', async () => {
  const calls = []
  const request = async (url) => {
    calls.push(url)
    return {
      status: 302,
      headers: {
        get(name) {
          return String(name).toLowerCase() === 'location'
            ? 'http://169.254.169.254/latest/meta-data/'
            : null
        }
      }
    }
  }

  await assert.rejects(
    () => safeFetch('https://example.com/go', { request }),
    /private or internal/i
  )
  assert.deepEqual(calls, ['https://example.com/go'])
})
