// Default settings the app can load on first run while in mock mode.
// Mirrors the user-configurable settings persisted to localStorage.

export const defaultSettings = {
  workingHours: { start: '09:00', end: '18:00' },
  connectedAccounts: {
    microsoft: false,
    slack: false,
  },
  mockMode: true,
  cloudflareWorkerUrl: '',
}
