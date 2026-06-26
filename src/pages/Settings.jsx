// Settings: connect/disconnect Microsoft and Slack, configure working hours
// and the Slack proxy URL. All persisted to localStorage.

import { useEffect, useState } from 'react'
import {
  isMicrosoftConnected,
  loginMicrosoft,
  logoutMicrosoft,
  initMicrosoft,
} from '../auth/microsoft.js'
import { isSlackConnected, loginSlack, logoutSlack } from '../auth/slack.js'
import { getSettings, saveSettings } from '../utils/settings.js'
import { clearHistory } from '../storage/history.js'
import { eraseLocalData } from '../storage/erase.js'
import { MS_SCOPES, SLACK_SCOPES } from '../config.js'

export default function Settings() {
  const [msConnected, setMsConnected] = useState(false)
  const [slackConnected, setSlackConnected] = useState(isSlackConnected())
  const [settings, setSettings] = useState(getSettings())
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    initMicrosoft().then(() => setMsConnected(isMicrosoftConnected()))
  }, [])

  async function handleConnectMicrosoft() {
    setBusy(true)
    try {
      await loginMicrosoft()
      setMsConnected(isMicrosoftConnected())
    } catch (err) {
      alert(`Microsoft sign-in failed: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleDisconnectMicrosoft() {
    setBusy(true)
    try {
      await logoutMicrosoft()
    } finally {
      setMsConnected(isMicrosoftConnected())
      setBusy(false)
    }
  }

  async function handleConnectSlack() {
    // Make sure the proxy URL is saved before we leave the page to Slack.
    saveSettings(settings)
    await loginSlack() // redirects away
  }

  function handleDisconnectSlack() {
    logoutSlack()
    setSlackConnected(isSlackConnected())
  }

  function handleField(key, value) {
    setSettings((s) => ({ ...s, [key]: value }))
    setSaved(false)
  }

  function handleSave(e) {
    e.preventDefault()
    saveSettings(settings)
    setSaved(true)
  }

  const [historyCleared, setHistoryCleared] = useState(false)
  function handleClearHistory() {
    if (!window.confirm('Clear all stored weekly summaries? This cannot be undone.')) return
    clearHistory()
    setHistoryCleared(true)
  }

  const [erased, setErased] = useState(false)
  async function handleEraseEverything() {
    if (
      !window.confirm(
        'Disconnect all accounts and erase every stored summary, correction, goal and setting on this device? This cannot be undone.',
      )
    )
      return
    eraseLocalData()
    try {
      if (isMicrosoftConnected()) await logoutMicrosoft()
    } catch {
      // best-effort sign-out
    }
    logoutSlack()
    setMsConnected(false)
    setSlackConnected(false)
    setSettings(getSettings())
    setErased(true)
  }

  const SCOPE_PURPOSE = {
    'Calendars.Read': 'Read your calendar event times to detect meetings',
    'Chat.Read': 'Read Teams message timestamps to detect messaging activity',
    'User.Read': 'Read your basic profile to identify your own messages',
    'channels:history': 'Read channel message timestamps to detect messaging activity',
    'im:history': 'Read DM message timestamps to detect messaging activity',
    'calls:read': 'Detect Slack call activity',
  }

  return (
    <section className="settings">
      <h1>Settings</h1>

      <div className="card">
        <h2>Connections</h2>
        <p className="muted">
          Connect either or both. Watermelon works with just Microsoft, just
          Slack, or both.
        </p>

        <div className="connection-row">
          <div>
            <strong>Microsoft</strong>
            <span className={`badge ${msConnected ? 'badge--on' : 'badge--off'}`}>
              {msConnected ? 'Connected' : 'Not connected'}
            </span>
          </div>
          {msConnected ? (
            <button onClick={handleDisconnectMicrosoft} disabled={busy}>
              Disconnect
            </button>
          ) : (
            <button onClick={handleConnectMicrosoft} disabled={busy}>
              Connect Microsoft
            </button>
          )}
        </div>

        <div className="connection-row">
          <div>
            <strong>Slack</strong>
            <span className={`badge ${slackConnected ? 'badge--on' : 'badge--off'}`}>
              {slackConnected ? 'Connected' : 'Not connected'}
            </span>
          </div>
          {slackConnected ? (
            <button onClick={handleDisconnectSlack}>Disconnect</button>
          ) : (
            <button onClick={handleConnectSlack}>Connect Slack</button>
          )}
        </div>
      </div>

      <form className="card" onSubmit={handleSave}>
        <h2>Working hours</h2>
        <div className="field-row">
          <label>
            <span>Start</span>
            <input
              type="time"
              value={settings.workingHoursStart}
              onChange={(e) => handleField('workingHoursStart', e.target.value)}
            />
          </label>
          <label>
            <span>End</span>
            <input
              type="time"
              value={settings.workingHoursEnd}
              onChange={(e) => handleField('workingHoursEnd', e.target.value)}
            />
          </label>
        </div>

        <h2>Goals &amp; focus</h2>
        <div className="field-row">
          <label>
            <span>Weekly deep focus goal (hours)</span>
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="e.g. 15"
              value={settings.focusGoalHours}
              onChange={(e) => handleField('focusGoalHours', e.target.value)}
            />
          </label>
          <label>
            <span>Low-focus day threshold (hours)</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={settings.lowFocusThresholdHours}
              onChange={(e) => handleField('lowFocusThresholdHours', Number(e.target.value))}
            />
          </label>
        </div>

        <h2>Slack proxy</h2>
        <label className="field-full">
          <span>Cloudflare Worker URL</span>
          <input
            type="url"
            placeholder="https://watermelon-slack-proxy.your-name.workers.dev"
            value={settings.slackProxyUrl}
            onChange={(e) => handleField('slackProxyUrl', e.target.value)}
          />
        </label>

        <div className="actions">
          <button type="submit">Save settings</button>
          {saved && <span className="muted">Saved ✓</span>}
        </div>
      </form>

      <div className="card">
        <h2>History</h2>
        <p className="muted">
          Watermelon stores a small aggregated summary of each analysed week on this device to
          power trends and comparisons. No message or event content is ever stored.
        </p>
        <div className="actions">
          <button className="danger" onClick={handleClearHistory}>
            Clear history
          </button>
          {historyCleared && <span className="muted">History cleared ✓</span>}
        </div>
      </div>

      <div className="card">
        <h2>Privacy</h2>
        <p className="muted">
          Watermelon runs entirely in your browser. It reads only <strong>metadata</strong> —
          event times and message timestamps, never message text or event details. Only small
          aggregated weekly summaries are stored locally on this device. Nothing is ever sent to any
          third-party server (Slack data passes through a proxy you control purely for CORS).
        </p>

        <h3 style={{ fontSize: '0.95rem', margin: '0.75rem 0 0.4rem' }}>Requested permissions</h3>
        <ul className="scope-list">
          {[...MS_SCOPES, ...SLACK_SCOPES].map((scope) => (
            <li key={scope}>
              <code>{scope}</code> — {SCOPE_PURPOSE[scope] || 'Used to analyse your activity'}
            </li>
          ))}
        </ul>

        <div className="actions">
          <button className="danger" onClick={handleEraseEverything}>
            Disconnect and erase everything
          </button>
          {erased && <span className="muted">Everything erased ✓</span>}
        </div>
      </div>
    </section>
  )
}
