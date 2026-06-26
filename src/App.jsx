// App shell: nav + routed pages. Completes a pending Slack OAuth redirect on
// first load. Pages manage their own date range / day selection.

import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { hasSlackRedirectParams, completeSlackLogin } from './auth/slack.js'
import { initMicrosoft } from './auth/microsoft.js'
import { toDateKey } from './utils/time.js'
import { USE_MOCK } from './mock/index.js'

export default function App() {
  const navigate = useNavigate()
  const todayKey = toDateKey(new Date())

  // On load: finish any Microsoft redirect handling and complete a Slack
  // OAuth callback if we were redirected back with a code.
  useEffect(() => {
    initMicrosoft().catch(() => {})

    // In mock mode, seed a few weeks of history so trend/comparison features
    // have data on first run. Lazy-loaded to keep it out of the main bundle.
    if (USE_MOCK) {
      import('./mock/seedHistory.js').then((m) => m.seedMockHistory()).catch(() => {})
    }

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
          <NavLink to={`/day/${todayKey}`}>Today</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </header>

      <main className="app__main">
        <Outlet />
      </main>

      <footer className="app__footer">
        <span>Watermelon · focus &amp; productivity from your calendar and chat</span>
      </footer>
    </div>
  )
}
