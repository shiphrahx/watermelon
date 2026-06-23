// Slack authentication via OAuth 2.0 with PKCE.
//
// Browser-only flow:
//   1. loginSlack() generates a PKCE verifier/challenge, stashes the verifier
//      in localStorage, and redirects the browser to Slack's authorize URL.
//   2. Slack redirects back to REDIRECT_URI with ?code=... (and our state).
//   3. completeSlackLogin() exchanges that code for an access token by calling
//      oauth.v2.access *through the Cloudflare Worker proxy* (Slack's token
//      endpoint does not send CORS headers, so a direct browser call fails).
//   4. The resulting token is stored in localStorage.

import { SLACK_CLIENT_ID, SLACK_SCOPES, REDIRECT_URI } from '../config.js'
import { getSlackProxyUrl } from '../utils/settings.js'

const TOKEN_KEY = 'watermelon.slack.token'
const VERIFIER_KEY = 'watermelon.slack.pkce_verifier'
const STATE_KEY = 'watermelon.slack.oauth_state'

const SLACK_AUTHORIZE_URL = 'https://slack.com/oauth/v2/authorize'

// --- PKCE helpers ---------------------------------------------------------

function base64UrlEncode(bytes) {
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomString(length = 64) {
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return base64UrlEncode(arr).slice(0, length)
}

async function sha256Challenge(verifier) {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

// --- Token storage --------------------------------------------------------

export function getSlackToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function isSlackConnected() {
  return !!getSlackToken()
}

export function logoutSlack() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(VERIFIER_KEY)
  localStorage.removeItem(STATE_KEY)
}

// --- OAuth flow -----------------------------------------------------------

export async function loginSlack() {
  const verifier = randomString(64)
  const challenge = await sha256Challenge(verifier)
  const state = randomString(24)

  localStorage.setItem(VERIFIER_KEY, verifier)
  localStorage.setItem(STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: SLACK_CLIENT_ID,
    // Slack puts conversation-history scopes under "user_scope" for user tokens.
    user_scope: SLACK_SCOPES.join(','),
    redirect_uri: REDIRECT_URI,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  window.location.assign(`${SLACK_AUTHORIZE_URL}?${params.toString()}`)
}

// Returns true if the current URL looks like a Slack OAuth redirect.
export function hasSlackRedirectParams() {
  const params = new URLSearchParams(window.location.search)
  return params.has('code') && params.get('state') === localStorage.getItem(STATE_KEY)
}

// Exchanges the authorization code for a token via the proxy. Should be called
// on app load when hasSlackRedirectParams() is true. Cleans up the URL after.
export async function completeSlackLogin() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  const expectedState = localStorage.getItem(STATE_KEY)
  const verifier = localStorage.getItem(VERIFIER_KEY)

  if (!code || !state || state !== expectedState || !verifier) {
    throw new Error('Invalid Slack OAuth callback state')
  }

  const proxyUrl = getSlackProxyUrl()
  if (!proxyUrl) {
    throw new Error('Slack proxy URL is not configured (set it in Settings)')
  }

  // oauth.v2.access does not require the bearer token header; it takes the
  // client_id, code, verifier and redirect_uri as query/body params. We route
  // it through the proxy so the response carries the right CORS headers.
  const exchange = new URLSearchParams({
    client_id: SLACK_CLIENT_ID,
    code,
    code_verifier: verifier,
    redirect_uri: REDIRECT_URI,
  })

  const url = `${proxyUrl.replace(/\/$/, '')}/?path=oauth.v2.access`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: exchange.toString(),
  })
  const data = await res.json()

  if (!data.ok) {
    throw new Error(`Slack token exchange failed: ${data.error || 'unknown error'}`)
  }

  // User token lives under authed_user.access_token for user_scope grants.
  const token = data.authed_user?.access_token || data.access_token
  if (!token) throw new Error('Slack token exchange returned no access token')

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.removeItem(VERIFIER_KEY)
  localStorage.removeItem(STATE_KEY)

  // Strip OAuth params from the URL without reloading.
  window.history.replaceState({}, document.title, REDIRECT_URI)

  return token
}
