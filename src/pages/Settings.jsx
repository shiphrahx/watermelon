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
    </section>
  )
}
