// Cloudflare Worker: CORS-friendly proxy for the Slack Web API.
//
// The browser cannot call slack.com/api/* directly because Slack does not send
// CORS headers. This worker forwards each request to
// https://slack.com/api/{path} and adds CORS headers permitting the GitHub
// Pages origin.
//
// Contract with the browser client:
//   - `path` query param   -> the Slack method, e.g. ?path=conversations.history
//   - `token` request header -> the user's Slack token, sent as Bearer auth
//   - any other query params -> forwarded to Slack as-is
//   - POST bodies            -> forwarded to Slack as-is
//
// No secrets are stored in the worker; the user's token is supplied per request
// from the browser and never persisted.
//
// Configure ALLOWED_ORIGIN to your GitHub Pages origin (no trailing slash),
// e.g. "https://your-username.github.io".

const ALLOWED_ORIGIN = 'https://your-username.github.io'
const SLACK_API_BASE = 'https://slack.com/api'

function corsHeaders(origin) {
  // Echo the allowed origin if it matches; otherwise fall back to the configured one.
  const allow = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, token',
    'Access-Control-Max-Age': '86400',
  }
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || ''
    const cors = corsHeaders(origin)

    // Preflight.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(request.url)
    const path = url.searchParams.get('path')
    if (!path) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_path' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // Build the upstream Slack URL, forwarding all query params except `path`.
    const slackUrl = new URL(`${SLACK_API_BASE}/${path}`)
    for (const [key, value] of url.searchParams) {
      if (key !== 'path') slackUrl.searchParams.set(key, value)
    }

    // Forward the token as Bearer auth when present.
    const token = request.headers.get('token')
    const upstreamHeaders = {}
    if (token) upstreamHeaders['Authorization'] = `Bearer ${token}`

    // Preserve method and body (e.g. POST form bodies for oauth.v2.access).
    const init = { method: request.method, headers: upstreamHeaders }
    if (request.method === 'POST') {
      const contentType = request.headers.get('Content-Type')
      if (contentType) upstreamHeaders['Content-Type'] = contentType
      init.body = await request.text()
    }

    let upstream
    try {
      upstream = await fetch(slackUrl.toString(), init)
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, error: 'upstream_fetch_failed', detail: String(err) }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    const body = await upstream.text()
    return new Response(body, {
      status: upstream.status,
      headers: {
        ...cors,
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      },
    })
  },
}
