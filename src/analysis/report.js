// Pure report assembly: takes raw API data (calendar, teams, slack) plus the
// date range and working hours, and returns per-day classified blocks and an
// aggregate summary. Kept free of React / network so it is straightforward to
// test the full pipeline end to end.

import {
  normalizeCalendarEvents,
  normalizeTeamsMessages,
  normalizeSlackMessages,
} from '../utils/normalize.js'
import { classifyDay, summarise } from './classify.js'
import { dateKeysInRange, startOfDayISO, endOfDayISO } from '../utils/time.js'

export function buildReport({
  startKey,
  endKey,
  workingStart,
  workingEnd,
  rawCalendar = [],
  rawTeams = [],
  rawSlack = [],
}) {
  const events = normalizeCalendarEvents(rawCalendar)
  const messages = [
    ...normalizeTeamsMessages(rawTeams),
    ...normalizeSlackMessages(rawSlack),
  ]

  const keys = dateKeysInRange(startKey, endKey)
  const days = keys.map((dateKey) => {
    const dayStartMs = new Date(startOfDayISO(dateKey)).getTime()
    const dayEndMs = new Date(endOfDayISO(dateKey)).getTime()
    const dayEvents = events.filter(
      (e) => e.end.getTime() >= dayStartMs && e.start.getTime() <= dayEndMs,
    )
    const dayMessages = messages.filter(
      (m) => m.timestamp >= dayStartMs && m.timestamp <= dayEndMs,
    )
    const blocks = classifyDay({
      dateKey,
      workingStart,
      workingEnd,
      events: dayEvents,
      messages: dayMessages,
    })
    // Expose the per-day events/messages so insight computations (top time
    // consumers, first message, etc.) don't need to re-fetch or re-filter.
    return { dateKey, blocks, events: dayEvents, messages: dayMessages }
  })

  return {
    days,
    summary: summarise(days.flatMap((d) => d.blocks)),
    events,
    messages,
  }
}
