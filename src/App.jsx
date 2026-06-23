// App shell: nav + routed pages. Holds the shared date range in state and
// passes it to pages via the router outlet context. Completes a pending Slack
// OAuth redirect on first load.

import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { hasSlackRedirectParams, completeSlackLogin } from './auth/slack.js'
import { initMicrosoft } from './auth/microsoft.js'
import { toDateKey } from './utils/time.js'

export default function App() {
  const today = toDateKey(new Date())
  const [startKey, setStartKey] = useState(today)
  const [endKey, setEndKey] = useState(today)
  const navigate = useNavigate()

  function setRange(s, e) {
    setStartKey(s)
    setEndKey(e)
  }

  // On load: finish any Microsoft redirect handling and complete a Slack
  // OAuth callback if we were redirected back with a code.
  useEffect(() => {
    initMicrosoft().catch(() => {})

    if (hasSlackRedirectParams()) {
      completeSlackLogin()
        .then(() => navigate('/settings'))
        .catch((err) => {
          console.error(err)
          alert(`Slack connection failed: ${err.message}`)
        })
    }
  }, [navigate])

  return (
    <div className="app">
      <header className="app__header">
        <div className="brand">
          <span className="brand__emoji" aria-hidden="true">🍉</span>
          <span className="brand__name">Watermelon</span>
        </div>
        <nav className="app__nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/day">Day view</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </header>

      <main className="app__main">
        <Outlet context={{ startKey, endKey, setRange }} />
      </main>

      <footer className="app__footer">
        <span>Watermelon · focus &amp; productivity from your calendar and chat</span>
      </footer>
    </div>
  )
}
