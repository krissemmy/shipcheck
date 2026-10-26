import assert from 'node:assert/strict'
import http from 'node:http'
import { test } from 'node:test'
import { handleCheckRequest, inspectUrl } from './inspect.js'

function listen(server, host = '127.0.0.1') {
  return new Promise((resolve) => {
    server.listen(0, host, () => resolve(server.address().port))
  })
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

async function postCheck(url) {
  const res = {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key] = value
    },
    end(body) {
      this.body = body
    }
  }

  await handleCheckRequest(
    {},
    res,
    `/api/check?url=${encodeURIComponent(url)}`
  )

  return {
    statusCode: res.statusCode,
    payload: JSON.parse(res.body)
  }
}

test('inspectUrl rejects loopback hosts before opening a connection', async (t) => {
  const hits = []
  const server = http.createServer((req, res) => {
    hits.push(req.url)
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end('<title>internal-secret</title>')
  })

  const port = await listen(server)
  t.after(() => close(server))

  await assert.rejects(
    () => inspectUrl(`http://127.0.0.1:${port}/secret`),
    /private or internal/i
  )
  assert.equal(hits.length, 0)
})

test('decimal loopback IPs are treated as private', async () => {
  await assert.rejects(() => inspectUrl('http://2130706433/'), /private or internal/i)
})

test('octal and hex loopback encodings are treated as private', async () => {
  await assert.rejects(() => inspectUrl('http://0x7f000001/'), /private or internal/i)
  await assert.rejects(() => inspectUrl('http://0177.0.0.1/'), /private or internal/i)
})

test('IPv6 loopback is treated as private', async () => {
  await assert.rejects(() => inspectUrl('http://[::1]/'), /private or internal/i)
})

test('IPv4-mapped loopback is treated as private', async () => {
  await assert.rejects(() => inspectUrl('http://[::ffff:127.0.0.1]/'), /private or internal/i)
})

test('link-local metadata address is rejected without waiting for the fetch timeout', async () => {
  const started = Date.now()
  await assert.rejects(
    () => inspectUrl('http://169.254.169.254/latest/meta-data/'),
    /private or internal/i
  )
  assert.ok(Date.now() - started < 1000)
})

test('private IPv4 ranges are rejected', async () => {
  for (const url of [
    'http://10.0.0.1/',
    'http://192.168.1.1/',
    'http://172.16.0.1/',
    'http://0.0.0.0/',
    'http://localhost/'
  ]) {
    await assert.rejects(() => inspectUrl(url), /private or internal/i)
  }
})

test('API returns 400 for private targets and does not include internal response bodies', async () => {
  const hits = []
  const server = http.createServer((req, res) => {
    hits.push(req.url)
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end('metadata-secret')
  })

  const port = await listen(server)
  const result = await postCheck(`http://127.0.0.1:${port}/latest/meta-data/iam`)
  await close(server)

  assert.equal(result.statusCode, 400)
  assert.match(result.payload.error, /private or internal/i)
  assert.equal(hits.length, 0)
  assert.equal(result.payload.httpStatus, undefined)
  assert.equal(result.payload.finalUrl, undefined)
})

test('redirects to loopback are not followed', async (t) => {
  const secretHits = []
  const secret = http.createServer((req, res) => {
    secretHits.push(req.url)
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end('metadata-secret')
  })
  const secretPort = await listen(secret)
  t.after(() => close(secret))

  const front = http.createServer((req, res) => {
    res.writeHead(302, {
      location: `http://127.0.0.1:${secretPort}/latest/meta-data/iam`
    })
    res.end()
  })
  const frontPort = await listen(front)
  t.after(() => close(front))

  await assert.rejects(
    () => inspectUrl(`http://127.0.0.1:${frontPort}/go`),
    /private or internal/i
  )
  assert.equal(secretHits.length, 0)
})
