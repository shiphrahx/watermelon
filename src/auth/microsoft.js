// Microsoft authentication via MSAL.js using the PKCE (auth code) flow.
// Tokens are cached by MSAL in localStorage. We expose small helpers the
// rest of the app uses: login, logout, isConnected, getAccessToken.

import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser'
import { MS_CLIENT_ID, MS_AUTHORITY, REDIRECT_URI, MS_SCOPES } from '../config.js'

const msalConfig = {
  auth: {
    clientId: MS_CLIENT_ID,
    authority: MS_AUTHORITY,
    redirectUri: REDIRECT_URI,
  },
  cache: {
    // localStorage so the session survives page reloads / GitHub Pages routing.
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
}

const msalInstance = new PublicClientApplication(msalConfig)

let initialized = false

// MSAL v3 requires an explicit initialize() before any other call, and
// handleRedirectPromise() to complete a redirect-based login.
export async function initMicrosoft() {
  if (initialized) return
  await msalInstance.initialize()
  await msalInstance.handleRedirectPromise()
  initialized = true
}

function getActiveAccount() {
  const accounts = msalInstance.getAllAccounts()
  return accounts.length > 0 ? accounts[0] : null
}

export function isMicrosoftConnected() {
  return getActiveAccount() !== null
}

export function getMicrosoftAccount() {
  return getActiveAccount()
}

export async function loginMicrosoft() {
  await initMicrosoft()
  // Popup keeps the SPA state intact, which avoids re-running redirect handling.
  const result = await msalInstance.loginPopup({ scopes: MS_SCOPES })
  if (result?.account) {
    msalInstance.setActiveAccount(result.account)
  }
  return result?.account ?? null
}

export async function logoutMicrosoft() {
  await initMicrosoft()
  const account = getActiveAccount()
  // logoutPopup clears the local MSAL cache without a full page redirect.
  await msalInstance.logoutPopup({ account })
}

// Returns a valid Graph access token, silently refreshing when possible and
// falling back to an interactive popup if the refresh requires interaction.
export async function getMicrosoftToken() {
  await initMicrosoft()
  const account = getActiveAccount()
  if (!account) throw new Error('Microsoft account not connected')

  try {
    const result = await msalInstance.acquireTokenSilent({
      scopes: MS_SCOPES,
      account,
    })
    return result.accessToken
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      const result = await msalInstance.acquireTokenPopup({ scopes: MS_SCOPES })
      return result.accessToken
    }
    throw err
  }
}
