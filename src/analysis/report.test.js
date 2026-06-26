import { describe, it, expect } from 'vitest'
import { buildReport } from './report.js'
import { CATEGORIES, UNCLASSIFIED } from './classify.js'
import { buildRecentDataset, datasetDays, dateKeyOf } from '../mock/generator.js'
import { dateKeysInRange } from '../utils/time.js'

const WORK = { workingStart: '09:00', workingEnd: '18:00' }

describe('buildReport — single mock day', () => {
  const today = new Date()
  const days = datasetDays(today)
  const newestKey = dateKeyOf(days[days.length - 1])
  const dataset = buildRecentDataset(today)

  const onDay = (arr, key, getTs) =>
    arr.filter((x) => dateKeyOf(new Date(getTs(x))) === key)

  it('produces 30-minute blocks across the working day', () => {
    const { days: out } = buildReport({
      startKey: newestKey,
      endKey: newestKey,
      ...WORK,
      rawCalendar: dataset.calendarEvents,
      rawTeams: dataset.teamsMessages,
      rawSlack: dataset.slackMessages,
    })
    expect(out).toHaveLength(1)
    // 09:00-18:00 = 9h = 18 half-hour blocks
    expect(out[0].blocks).toHaveLength(18)
    for (const b of out[0].blocks) {
      expect([...CATEGORIES, UNCLASSIFIED]).toContain(b.category)
    }
  })
})

describe('buildReport — full 10-day dataset exercises every category', () => {
  const today = new Date()
  const days = datasetDays(today)
  const startKey = dateKeyOf(days[0])
  const endKey = dateKeyOf(days[days.length - 1])
  const dataset = buildRecentDataset(today)

  const { days: out, summary } = buildReport({
    startKey,
    endKey,
    ...WORK,
    rawCalendar: dataset.calendarEvents,
    rawTeams: dataset.teamsMessages,
    rawSlack: dataset.slackMessages,
  })

  it('returns one entry per calendar day in the range (incl. weekends)', () => {
    expect(out).toHaveLength(dateKeysInRange(startKey, endKey).length)
  })

  it('summary totals every category and sums to total block time', () => {
    for (const c of CATEGORIES) {
      expect(summary).toHaveProperty(c)
    }
    // active-category minutes + unclassified minutes == all block time
    const active = CATEGORIES.reduce((acc, c) => acc + summary[c], 0)
    const unclassified = out
      .flatMap((d) => d.blocks)
      .filter((b) => b.category === UNCLASSIFIED).length * 30
    expect(active + unclassified).toBe(out.length * 18 * 30)
  })

  it('produces every classification category at least once across the dataset', () => {
    const seen = new Set(out.flatMap((d) => d.blocks).map((b) => b.category))
    for (const c of CATEGORIES) {
      expect(seen, `expected category ${c} somewhere in the dataset`).toContain(c)
    }
  })

  it('classifies meeting-heavy days with more meeting time than focus days', () => {
    // Working day index 1 = heavy-meetings, index 2 = focus-day (oldest-first).
    const byKey = Object.fromEntries(out.map((d) => [d.dateKey, d]))
    const heavyKey = dateKeyOf(days[1])
    const focusKey = dateKeyOf(days[2])
    const meetingMins = (day) =>
      day.blocks.filter((b) => b.category === 'meeting').length * 30
    expect(meetingMins(byKey[heavyKey])).toBeGreaterThan(meetingMins(byKey[focusKey]))
  })
})

describe('buildReport — working hours exclude out-of-hours activity', () => {
  it('ignores messages before start / after end of the working day', () => {
    // A day with a single in-hours meeting plus out-of-hours messages only.
    const dayKey = '2025-06-24'
    const rawCalendar = [
      {
        id: 'e1',
        subject: 'Standup',
        start: { dateTime: '2025-06-24T09:30:00' },
        end: { dateTime: '2025-06-24T10:00:00' },
        isAllDay: false,
        responseStatus: { response: 'accepted' },
      },
    ]
    const rawSlack = [
      { ts: (new Date('2025-06-24T07:30:00').getTime() / 1000).toFixed(6), channel: 'C1' },
      { ts: (new Date('2025-06-24T20:30:00').getTime() / 1000).toFixed(6), channel: 'C1' },
    ]

    const { days: out } = buildReport({
      startKey: dayKey,
      endKey: dayKey,
      ...WORK,
      rawCalendar,
      rawTeams: [],
      rawSlack,
    })

    // Outside-hours messages must not create comms blocks; only the meeting
    // block should be 'meeting', the rest 'focus' (no in-hours messages).
    const cats = out[0].blocks.map((b) => b.category)
    expect(cats).toContain('meeting')
    expect(cats).not.toContain('comms')
  })
})
