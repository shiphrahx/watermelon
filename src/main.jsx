import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DayView from './pages/DayView.jsx'
import Settings from './pages/Settings.jsx'
import './index.css'

// HashRouter is used because GitHub Pages serves static files and cannot
// rewrite arbitrary paths to index.html — the hash keeps routing client-side.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
          <Route path="day/:dateKey" element={<DayView />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)
