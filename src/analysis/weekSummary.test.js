import { describe, it, expect } from 'vitest'
import { buildWeekSummary } from './weekSummary.js'
import { computeInsights } from './insights.js'
import { buildDayBlocks } from '../utils/time.js'

const WS = '09:00'
const WE = '18:00'
const KEY = '2025-06-23' // Monday

function ev(subject, dateKey, s, e) {
  return { subject, start: new Date(`${dateKey}T${s}:00`), end: new Date(`${dateKey}T${e}:00`) }
}
function makeDay(dateKey, cats, events = []) {
  const blocks = buildDayBlocks(dateKey, WS, WE).map((b, i) => ({ ...b, category: cats[i] || 'focus' }))
  return { dateKey, blocks, events, messages: [] }
}

describe('buildWeekSummary', () => {
  const cats = [
    'meeting', 'meeting', 'focus', 'focus', 'comms', 'shallow',
    'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus',
  ]
  const days = [
    makeDay(KEY, cats, [
      ev('Standup #1', KEY, '09:00', '09:30'),
      ev('Standup #2', '2025-06-24', '09:00', '09:30'),
    ]),
  ]
  const insights = computeInsights({ days, workingStart: WS, workingEnd: WE })
  const summary = buildWeekSummary({ insights, days })

  it('captures aggregated category minutes and focus rate', () => {
    expect(summary.focusMinutes).toBe(insights.focusMinutes)
    expect(summary.meetingMinutes).toBe(insights.meetingMinutes)
    expect(summary.shallowMinutes).toBe(insights.shallowMinutes)
    expect(summary.messagingMinutes).toBe(insights.messagingMinutes)
    expect(summary.focusRate).toBe(Math.round(insights.focusRate))
  })

  it('includes a per-day breakdown carrying only aggregated categories', () => {
    expect(summary.perDay.length).toBeGreaterThan(0)
    const mon = summary.perDay.find((d) => d.dateKey === KEY)
    expect(mon.categories).toHaveProperty('focus')
    // per-day entries carry no raw events/messages arrays
    expect(mon).not.toHaveProperty('events')
    expect(mon).not.toHaveProperty('messages')
    // the summary itself stores no raw message/event collections
    expect(summary).not.toHaveProperty('events')
    expect(summary).not.toHaveProperty('messages')
  })

  it('groups recurring meetings by normalised title', () => {
    // "Standup #1" and "Standup #2" normalise to the same group
    const standup = summary.recurringMeetings.find((m) => /standup/i.test(m.title))
    expect(standup.occurrences).toBe(2)
    expect(standup.totalMinutes).toBe(60)
  })

  it('exposes a fragmentation count', () => {
    expect(summary).toHaveProperty('fragmentationCount')
    expect(typeof summary.fragmentationCount).toBe('number')
  })
})
