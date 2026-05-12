# ShipCheck

ShipCheck is a deployment readiness checker for live web apps. Paste a URL and it reports verified launch signals such as HTTPS, reachability, response time, security headers, health endpoints, and page metadata.

## What It Checks

- URL validity
- HTTPS/TLS
- App reachability and final HTTP status
- Response time
- Required security headers:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
- Health endpoints:
  - `/health`
  - `/api/health`
  - `/readyz`
- HTML title
- Meta description

## Inspection Model

ShipCheck separates confirmed readiness results from checks it could not inspect.

Statuses:

- `Pass`: ShipCheck verified the signal is present or healthy.
- `Warning`: ShipCheck verified something reachable but risky or incomplete.
- `Fail`: ShipCheck inspected the signal and confirmed a launch-impacting failure.
- `Unknown`: ShipCheck could not verify the signal from the current inspection environment.

`Unknown` does not mean the app failed. It means ShipCheck could not verify that check.

## Scores

ShipCheck reports two scores:

- **Launch Score**: based only on verified readiness signals. Unknown checks do not heavily penalize this score.
- **Inspection Confidence**: based on how much ShipCheck could actually inspect. Unknown checks reduce this score.

This prevents browser restrictions, CORS, blocked automation, or unreadable HTML from being misreported as app failures.

## Server-Side API

URL inspection runs through a server/API route:

```txt
GET /api/check?url=https://example.com
```

The endpoint:

1. Fetches the main URL.
2. Follows redirects.
3. Captures the final URL.
4. Captures HTTP status.
5. Measures response time.
6. Reads response headers.
7. Reads HTML title and meta description where possible.
8. Checks `/health`, `/api/health`, and `/readyz` independently.
9. Returns structured JSON to the frontend.

Example response shape:

```json
{
  "inputUrl": "https://example.com/",
  "finalUrl": "https://example.com/",
  "httpStatus": 200,
  "responseTimeMs": 412,
  "headers": {
    "content-type": "text/html; charset=utf-8"
  },
  "healthProbes": [
    {
      "path": "/health",
      "url": "https://example.com/health",
      "ok": true,
      "status": 200,
      "responseTimeMs": 120
    }
  ],
  "checks": [
    {
      "id": "https",
      "label": "HTTPS Enabled",
      "status": "pass",
      "detail": "Connection uses HTTPS/TLS",
      "inspected": true
    }
  ]
}
```

## Health Endpoint Behavior

Health endpoints are checked independently from the homepage. A homepage returning `403` does not stop health checks.

For an input like:

```txt
https://restoreai.ghostdog.io
```

ShipCheck checks:

```txt
https://restoreai.ghostdog.io/health
https://restoreai.ghostdog.io/api/health
https://restoreai.ghostdog.io/readyz
```

The checker builds these URLs with `new URL(path, baseOrigin).toString()`. If any health endpoint returns HTTP `200-399`, the health check passes and the passing endpoint is shown.

## HTTP 403 Behavior

HTTP `403` is not treated as unreachable. It is reported as a warning:

```txt
Server responded with HTTP 403. The app is reachable, but restricted this automated check.
```

This reduces inspection confidence where appropriate, but it does not destroy the launch score by itself.

## Security Header Behavior

Security headers are marked `Fail` only when ShipCheck can inspect headers and confirm a required header is missing.

If headers cannot be inspected because the server request fails, the result is `Unknown`.

## Metadata Behavior

Page title and meta description are only judged when HTML is readable.

- Readable HTML with no title: `Fail`
- Readable HTML with no meta description: `Warning`
- Unreadable HTML, restricted route, or non-HTML response: `Unknown`

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run start
```

The Vite dev and preview servers both mount `/api/check` through a lightweight middleware in `vite.config.js`.

## Deployment

The repository includes `api/check.js` for platforms that support Node-style serverless API routes.

The shared inspection logic lives in:

```txt
server/inspect.js
```

If deploying to a static-only host, `/api/check` will not exist and ShipCheck will show server-dependent checks as `Unknown`. Use a platform with API/serverless route support for accurate inspection.

## No Database or Auth

ShipCheck does not use authentication, a database, background jobs, or heavy dependencies. Checks run on demand and return directly to the browser.
