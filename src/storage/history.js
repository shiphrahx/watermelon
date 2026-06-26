// Weekly-summary history store.
//
// Persists one compact, aggregated summary per ISO week so the app can show
// trends and comparisons. localStorage is the default backend; all access goes
// through this module so the backend (e.g. a Cloudflare Worker) can be swapped
// later without touching feature code.
//
// PRIVACY: only aggregated numbers are stored here — never raw message text or
// event details.

const STORAGE_KEY = 'watermelon.history'

// --- backend abstraction --------------------------------------------------
// A backend implements read()/write(map). Swap localStorageBackend for a remote
// one later; callers below are backend-agnostic.

const localStorageBackend = {
  read() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  },
  write(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  },
}

let backend = localStorageBackend

// Allow tests / future remote store to substitute the backend.
export function setHistoryBackend(next) {
  backend = next || localStorageBackend
}

// --- API ------------------------------------------------------------------

export function saveWeek(weekKey, summary) {
  if (!weekKey) return
  const map = backend.read()
  map[weekKey] = { weekKey, ...summary }
  backend.write(map)
}

export function getWeek(weekKey) {
  return backend.read()[weekKey] || null
}

// All weeks, oldest -> newest by weekKey (ISO keys sort lexicographically).
export function getAllWeeks() {
  const map = backend.read()
  return Object.keys(map)
    .sort()
    .map((k) => map[k])
}

// The most recent `n` weeks, oldest -> newest.
export function getRecentWeeks(n = 12) {
  const all = getAllWeeks()
  return all.slice(Math.max(0, all.length - n))
}

export function clearHistory() {
  backend.write({})
}
