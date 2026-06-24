// Mock calendar events. Returns raw Microsoft Graph event objects for the
// requested range, drawn from the deterministic 10-working-day dataset.
//
// Drop-in for api/graph.js#fetchCalendarEvents: same call signature, and the
// returned shape matches the real Graph response (raw, un-normalised) so the
// normalisation layer treats mock and real identically.

import { buildRecentDataset, dayBoundsMs, parseGraphDateTime } from './generator.js'

export function getMockCalendarEvents(startDate, endDate) {
  const { calendarEvents } = buildRecentDataset(new Date())
  const [startMs, endMs] = dayBoundsMs(startDate, endDate)

  const filtered = calendarEvents.filter((ev) => {
    const start = parseGraphDateTime(ev.start.dateTime).getTime()
    const end = parseGraphDateTime(ev.end.dateTime).getTime()
    // Keep events overlapping the range.
    return end >= startMs && start <= endMs
  })

  // Mirror the async contract of the real fetcher.
  return Promise.resolve(filtered)
}
