// Central configuration. Public identifiers only — no secrets.
// Values come from Vite env vars at build time, with safe fallbacks so the
// app still boots (in a clearly-unconfigured state) when env is missing.

export const MS_CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID || ''
export const MS_AUTHORITY =
  import.meta.env.VITE_MS_AUTHORITY || 'https://login.microsoftonline.com/common'

export const SLACK_CLIENT_ID = import.meta.env.VITE_SLACK_CLIENT_ID || ''

// Default Slack proxy URL; the user can override this in Settings.
export const DEFAULT_SLACK_PROXY_URL = import.meta.env.VITE_SLACK_PROXY_URL || ''

// The OAuth redirect URI. Must exactly match what is registered in Azure AD
// and Slack. We use the app's own origin + base path.
export const REDIRECT_URI = window.location.origin + import.meta.env.BASE_URL

// Microsoft Graph delegated scopes required by the app.
export const MS_SCOPES = ['Calendars.Read', 'Chat.Read', 'User.Read']

// Slack OAuth scopes required by the app.
export const SLACK_SCOPES = ['channels:history', 'im:history', 'calls:read']

export const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
