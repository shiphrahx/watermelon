import { describe, it, expect } from 'vitest'
import { getMockCalendarEvents } from './calendar.js'
import { getMockTeamsMessages } from './teams.js'
import { getMockSlackMessages } from './slack.js'
import {
  buildRecentDataset,
  datasetDays,
  dateKeyOf,
  dayBoundsMs,
  parseGraphDateTime,
} from './generator.js'

// The fetchers build their dataset relative to "today" at call time, so derive
// the expected days the same way here.
const today = new Date()
const days = datasetDays(today)
const oldestKey = dateKeyOf(days[0])
const newestKey = dateKeyOf(days[days.length - 1])
const full = buildRecentDataset(today)

describe('getMockCalendarEvents', () => {
  it('returns a promise of raw Graph events', async () => {
    const events = await getMockCalendarEvents(oldestKey, newestKey)
    expect(Array.isArray(events)).toBe(true)
    expect(events[0]).toHaveProperty('responseStatus')
    expect(events[0].start).toHaveProperty('dateTime')
  })

  it('returns the whole dataset when the range covers all working days', async () => {
    const events = await getMockCalendarEvents(oldestKey, newestKey)
    expect(events).toHaveLength(full.calendarEvents.length)
  })

  it('filters to a single day', async () => {
    const events = await getMockCalendarEvents(newestKey, newestKey)
    expect(events.length).toBeGreaterThan(0)
    const [s, e] = dayBoundsMs(newestKey, newestKey)
    for (const ev of events) {
      const start = parseGraphDateTime(ev.start.dateTime).getTime()
      expect(start).toBeGreaterThanOrEqual(s)
      expect(start).toBeLessThanOrEqual(e)
    }
  })

  it('returns empty for a range with no data', async () => {
    const events = await getMockCalendarEvents('2000-01-01', '2000-01-02')
    expect(events).toEqual([])
  })
})

describe('getMockTeamsMessages', () => {
  it('returns raw Graph chat messages within range', async () => {
    const msgs = await getMockTeamsMessages(oldestKey, newestKey)
    expect(msgs.length).toBeGreaterThan(0)
    expect(msgs[0]).toHaveProperty('createdDateTime')
    expect(msgs[0]).toHaveProperty('chatId')
  })

  it('filters by range', async () => {
    const msgs = await getMockTeamsMessages(newestKey, newestKey)
    const [s, e] = dayBoundsMs(newestKey, newestKey)
    for (const m of msgs) {
      const ts = new Date(m.createdDateTime).getTime()
      expect(ts).toBeGreaterThanOrEqual(s)
      expect(ts).toBeLessThanOrEqual(e)
    }
  })

  it('returns empty for a range with no data', async () => {
    expect(await getMockTeamsMessages('2000-01-01', '2000-01-02')).toEqual([])
  })
})

describe('getMockSlackMessages', () => {
  it('returns raw Slack messages within range', async () => {
    const msgs = await getMockSlackMessages(oldestKey, newestKey)
    expect(msgs.length).toBeGreaterThan(0)
    expect(msgs[0]).toHaveProperty('ts')
    expect(msgs[0]).toHaveProperty('channel')
  })

  it('filters by range', async () => {
    const msgs = await getMockSlackMessages(newestKey, newestKey)
    const [s, e] = dayBoundsMs(newestKey, newestKey)
    for (const m of msgs) {
      const ts = Math.round(parseFloat(m.ts) * 1000)
      expect(ts).toBeGreaterThanOrEqual(s)
      expect(ts).toBeLessThanOrEqual(e)
    }
  })

  it('returns empty for a range with no data', async () => {
    expect(await getMockSlackMessages('2000-01-01', '2000-01-02')).toEqual([])
  })
})
