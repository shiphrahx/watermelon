// Read/write user settings persisted in localStorage.
// Settings: working hours, and the Slack proxy URL override.

import { DEFAULT_SLACK_PROXY_URL } from '../config.js'

const SETTINGS_KEY = 'watermelon.settings'

const DEFAULTS = {
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  slackProxyUrl: DEFAULT_SLACK_PROXY_URL,
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(partial) {
  const next = { ...getSettings(), ...partial }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  return next
}

export function getSlackProxyUrl() {
  return getSettings().slackProxyUrl || ''
}
