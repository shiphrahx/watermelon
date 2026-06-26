// Build the compact, aggregated summary that gets persisted per week.
// Only numbers and titles — no raw message/event content.

import { fragmentation, recurringMeetings } from './meetings.js'

export function buildWeekSummary({ insights, days }) {
  const frag = fragmentation(days)
  const recurring = recurringMeetings(days, { minOccurrences: 1 })

  return {
    focusMinutes: insights.focusMinutes,
    meetingMinutes: insights.meetingMinutes,
    shallowMinutes: insights.shallowMinutes,
    messagingMinutes: insights.messagingMinutes,
    focusRate: Math.round(insights.focusRate),
    fragmentationCount: frag.perDay.reduce((acc, d) => acc + d.count, 0),
    // Per-day category breakdown (minutes), no raw content.
    perDay: insights.perDay.map((d) => ({
      dateKey: d.dateKey,
      weekday: d.weekday,
      categories: d.categories,
    })),
    // Top recurring meetings — titles + aggregate time only.
    recurringMeetings: recurring
      .slice(0, 10)
      .map((m) => ({ title: m.title, totalMinutes: m.totalMinutes, occurrences: m.occurrences })),
  }
}
