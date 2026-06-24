import { describe, it, expect } from 'vitest'
import {
  generateDay,
  buildRecentDataset,
  recentWorkingDays,
  dayBoundsMs,
  parseGraphDateTime,
  dateKeyOf,
  PROFILES,
  PROFILE_SEQUENCE,
} from './generator.js'

// A fixed weekday "today" so tests are fully deterministic.
const TODAY = new Date(2025, 5, 24) // Tue 24 Jun 2025 (month is 0-based)

describe('generateDay — determinism', () => {
  it('produces identical output for the same date + profile', () => {
    const a = generateDay(new Date(2025, 5, 24), 'mixed', { dayIndex: 0 })
    const b = generateDay(new Date(2025, 5, 24), 'mixed', { dayIndex: 0 })
    expect(a).toEqual(b)
  })

  it('throws on an unknown profile', () => {
    expect(() => generateDay(new Date(2025, 5, 24), 'nonsense')).toThrow(/Unknown profile/)
  })
})

describe('generateDay — calendar shape', () => {
  const { calendarEvents } = generateDay(new Date(2025, 5, 24), 'mixed', { dayIndex: 0 })

  it('matches the Microsoft Graph event shape', () => {
    const ev = calendarEvents[0]
    expect(ev).toMatchObject({
      id: expect.any(String),
      subject: expect.any(String),
      start: { dateTime: expect.any(String), timeZone: 'Europe/London' },
      end: { dateTime: expect.any(String), timeZone: 'Europe/London' },
      isAllDay: expect.any(Boolean),
      responseStatus: { response: expect.any(String) },
      attendees: expect.any(Array),
      isOnlineMeeting: expect.any(Boolean),
      onlineMeetingProvider: expect.any(String),
    })
  })

  it('uses local wall-clock dateTime without a zone suffix', () => {
    expect(calendarEvents[0].start.dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
  })

  it('includes exactly one declined meeting', () => {
    const declined = calendarEvents.filter((e) => e.responseStatus.response === 'declined')
    expect(declined).toHaveLength(1)
  })

  it('includes a mix of online and in-person meetings', () => {
    const online = calendarEvents.filter((e) => e.isOnlineMeeting)
    expect(online.length).toBeGreaterThan(0)
    expect(online.length).toBeLessThan(calendarEvents.length)
  })

  it('adds an all-day event only when requested', () => {
    const withAllDay = generateDay(new Date(2025, 5, 24), 'mixed', { allDay: true })
    expect(withAllDay.calendarEvents.some((e) => e.isAllDay)).toBe(true)
    const without = generateDay(new Date(2025, 5, 24), 'mixed', { allDay: false })
    expect(without.calendarEvents.some((e) => e.isAllDay)).toBe(false)
  })
})

describe('generateDay — Teams message shape', () => {
  const { teamsMessages } = generateDay(new Date(2025, 5, 24), 'comms-heavy', { dayIndex: 0 })

  it('matches the Graph chat-message shape', () => {
    expect(teamsMessages.length).toBeGreaterThan(0)
    expect(teamsMessages[0]).toMatchObject({
      id: expect.any(String),
      createdDateTime: expect.any(String),
      from: { user: { displayName: expect.any(String), id: expect.any(String) } },
      body: { content: expect.any(String), contentType: 'text' },
      chatId: expect.any(String),
    })
  })

  it('uses an ISO-8601 Z timestamp for createdDateTime', () => {
    expect(teamsMessages[0].createdDateTime).toMatch(/Z$/)
  })
})

describe('generateDay — Slack message shape', () => {
  const { slackMessages } = generateDay(new Date(2025, 5, 24), 'comms-heavy', { dayIndex: 1 })

  it('matches the Slack message shape', () => {
    expect(slackMessages.length).toBeGreaterThan(0)
    expect(slackMessages[0]).toMatchObject({
      ts: expect.any(String),
      user: expect.any(String),
      text: expect.any(String),
      channel: expect.any(String),
      type: 'message',
    })
  })

  it('uses Slack native unix-seconds ts format', () => {
    expect(slackMessages[0].ts).toMatch(/^\d+\.\d{6}$/)
  })

  it('spans at least 3 distinct channels across the dataset', () => {
    const { slackMessages: all } = buildRecentDataset(TODAY)
    const channels = new Set(all.map((m) => m.channel))
    expect(channels.size).toBeGreaterThanOrEqual(3)
  })

  it('includes at least one DM channel (D-prefixed)', () => {
    const { slackMessages: all } = buildRecentDataset(TODAY)
    expect(all.some((m) => m.channel.startsWith('D'))).toBe(true)
  })
})

describe('recentWorkingDays', () => {
  it('returns the requested count of weekdays, oldest first', () => {
    const days = recentWorkingDays(TODAY, 10)
    expect(days).toHaveLength(10)
    // all weekdays
    expect(days.every((d) => d.getDay() >= 1 && d.getDay() <= 5)).toBe(true)
    // chronological
    for (let i = 1; i < days.length; i++) {
      expect(days[i].getTime()).toBeGreaterThan(days[i - 1].getTime())
    }
    // last day is today (a weekday)
    expect(dateKeyOf(days[days.length - 1])).toBe(dateKeyOf(TODAY))
  })

  it('skips weekends', () => {
    const sunday = new Date(2025, 5, 22) // Sun
    const days = recentWorkingDays(sunday, 5)
    expect(days.every((d) => d.getDay() !== 0 && d.getDay() !== 6)).toBe(true)
  })
})

describe('buildRecentDataset', () => {
  it('is deterministic for a fixed today', () => {
    expect(buildRecentDataset(TODAY)).toEqual(buildRecentDataset(TODAY))
  })

  it('covers all 10 profile-assigned days', () => {
    const { calendarEvents } = buildRecentDataset(TODAY)
    const dayKeys = new Set(calendarEvents.map((e) => e.start.dateTime.slice(0, 10)))
    expect(dayKeys.size).toBe(PROFILE_SEQUENCE.length)
  })

  it('produces all-day events on at least 2 days', () => {
    const { calendarEvents } = buildRecentDataset(TODAY)
    const allDayDays = new Set(
      calendarEvents.filter((e) => e.isAllDay).map((e) => e.start.dateTime.slice(0, 10)),
    )
    expect(allDayDays.size).toBeGreaterThanOrEqual(2)
  })

  it('produces a declined meeting on every day', () => {
    const { calendarEvents } = buildRecentDataset(TODAY)
    const byDay = {}
    for (const e of calendarEvents) {
      const k = e.start.dateTime.slice(0, 10)
      byDay[k] = byDay[k] || { declined: 0 }
      if (e.responseStatus.response === 'declined') byDay[k].declined++
    }
    expect(Object.values(byDay).every((d) => d.declined >= 1)).toBe(true)
  })

  it('uses every defined profile at least once', () => {
    for (const p of PROFILES) {
      expect(PROFILE_SEQUENCE).toContain(p)
    }
  })
})

describe('dayBoundsMs', () => {
  it('accepts date-key strings', () => {
    const [s, e] = dayBoundsMs('2025-06-24', '2025-06-24')
    expect(new Date(s).getHours()).toBe(0)
    expect(e - s).toBeGreaterThan(23 * 60 * 60 * 1000)
  })

  it('accepts Date objects', () => {
    const [s, e] = dayBoundsMs(new Date(2025, 5, 24), new Date(2025, 5, 25))
    expect(e).toBeGreaterThan(s)
  })
})

describe('parseGraphDateTime', () => {
  it('parses local wall-clock (no zone) into local time', () => {
    const d = parseGraphDateTime('2025-06-24T09:30:00')
    expect(d.getHours()).toBe(9)
    expect(d.getMinutes()).toBe(30)
  })

  it('parses a Z-suffixed timestamp as UTC', () => {
    const d = parseGraphDateTime('2025-06-24T09:30:00Z')
    expect(d.toISOString()).toBe('2025-06-24T09:30:00.000Z')
  })
})
