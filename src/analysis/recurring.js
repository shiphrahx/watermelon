// Recurring-meeting audit: cumulative cost per recurring meeting, aggregated
// across stored history when available, else the current range.

import { normalizeMeetingTitle, recurringMeetings } from './meetings.js'

// Merge per-week recurringMeetings arrays (from history) by normalised title.
export function aggregateRecurringFromHistory(weeks) {
  const groups = new Map()
  for (const w of weeks || []) {
    for (const m of w.recurringMeetings || []) {
      const key = normalizeMeetingTitle(m.title)
      if (!key) continue
      const g = groups.get(key) || { title: m.title, totalMinutes: 0, occurrences: 0 }
      g.totalMinutes += m.totalMinutes
      g.occurrences += m.occurrences
      groups.set(key, g)
    }
  }
  return [...groups.values()]
    .map((g) => ({ ...g, averageMinutes: Math.round(g.totalMinutes / g.occurrences) }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
}

// Audit recurring meetings (2+ occurrences), top `top` by cumulative time.
// Prefers multi-week history; falls back to the current range's days.
export function recurringAudit({ weeks = [], days = [], top = 8 } = {}) {
  const fromHistory = aggregateRecurringFromHistory(weeks)
  const base = fromHistory.length ? fromHistory : recurringMeetings(days)
  const items = base.filter((m) => m.occurrences >= 2).slice(0, top)
  return { items, mostExpensive: items[0] || null }
}
