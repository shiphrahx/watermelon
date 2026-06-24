import { describe, it, expect } from 'vitest'
import {
  topConsumers,
  backToBack,
  fragmentation,
  recovery,
  longestMeetingBlock,
} from './meetings.js'

const KEY = '2025-06-23' // Monday
const KEY2 = '2025-06-24' // Tuesday

function ev(subject, dateKey, s, e) {
  return { subject, start: new Date(`${dateKey}T${s}:00`), end: new Date(`${dateKey}T${e}:00`) }
}

// A day with events; blocks aren't needed for meeting analytics.
const day = (dateKey, events) => ({ dateKey, blocks: [], events, messages: [] })

describe('topConsumers', () => {
  it('merges repeated titles and ranks by total duration', () => {
    const days = [
      day(KEY, [ev('Standup', KEY, '09:00', '09:30'), ev('Planning', KEY, '10:00', '11:00')]),
      day(KEY2, [ev('Standup', KEY2, '09:00', '09:30')]),
    ]
    const top = topConsumers(days)
    const standup = top.find((t) => t.subject === 'Standup')
    expect(standup.minutes).toBe(60)
    expect(standup.occurrences).toBe(2)
    expect(top[0].minutes).toBeGreaterThanOrEqual(top[1].minutes)
  })

  it('caps at five', () => {
    const events = ['a', 'b', 'c', 'd', 'e', 'f'].map((s, i) =>
      ev(s, KEY, `${9 + i}:00`, `${9 + i}:30`),
    )
    expect(topConsumers([day(KEY, events)])).toHaveLength(5)
  })
})

describe('backToBack', () => {
  it('counts meetings starting within 5 minutes of the previous ending', () => {
    const days = [
      day(KEY, [
        ev('Standup', KEY, '09:00', '09:30'),
        ev('Product sync', KEY, '09:30', '10:00'), // 0 min gap -> back to back
        ev('1:1', KEY, '11:00', '11:30'), // 60 min gap -> not
      ]),
    ]
    const r = backToBack(days)
    expect(r.totalMeetings).toBe(3)
    expect(r.count).toBe(1)
    expect(r.rate).toBeCloseTo(33.33, 1)
    expect(r.pairs[0]).toMatchObject({ from: 'Standup', to: 'Product sync', gapMinutes: 0 })
  })
})

describe('fragmentation', () => {
  it('counts gaps under 20 minutes between meetings and sums lost time', () => {
    const days = [
      day(KEY, [
        ev('A', KEY, '09:00', '09:30'),
        ev('B', KEY, '09:45', '10:15'), // 15 min gap -> unusable
        ev('C', KEY, '11:00', '11:30'), // 45 min gap -> usable
      ]),
    ]
    const r = fragmentation(days)
    expect(r.perDay[0].count).toBe(1)
    expect(r.perDay[0].lostMinutes).toBe(15)
    expect(r.totalLostMinutes).toBe(15)
  })

  it('does not count the gap before the first meeting', () => {
    const days = [day(KEY, [ev('A', KEY, '11:00', '11:30')])]
    expect(fragmentation(days).totalLostMinutes).toBe(0)
  })
})

describe('recovery', () => {
  it('averages gaps and buckets the distribution', () => {
    const days = [
      day(KEY, [
        ev('A', KEY, '09:00', '09:30'),
        ev('B', KEY, '09:35', '10:05'), // 5 min gap -> under10
        ev('C', KEY, '10:25', '10:55'), // 20 min gap -> between
        ev('D', KEY, '12:00', '12:30'), // 65 min gap -> over30
      ]),
    ]
    const r = recovery(days)
    expect(r.totalGaps).toBe(3)
    expect(r.distribution).toEqual({ under10: 1, between: 1, over30: 1 })
    expect(r.averageGapMinutes).toBe(Math.round((5 + 20 + 65) / 3))
  })

  it('returns zero average with no gaps', () => {
    expect(recovery([day(KEY, [ev('A', KEY, '09:00', '09:30')])]).averageGapMinutes).toBe(0)
  })
})

describe('longestMeetingBlock', () => {
  it('finds the longest near-back-to-back chain', () => {
    const days = [
      day(KEY, [
        ev('A', KEY, '09:00', '10:00'),
        ev('B', KEY, '10:05', '11:00'), // 5 min gap -> chained
        ev('C', KEY, '11:00', '12:40'), // 0 min gap -> chained => 09:00-12:40 = 220m
        ev('D', KEY, '15:00', '15:30'), // big gap -> separate
      ]),
    ]
    const r = longestMeetingBlock(days)
    expect(r.minutes).toBe(220)
    expect(r.weekday).toBe('Monday')
  })

  it('ignores single meetings (not a block)', () => {
    expect(longestMeetingBlock([day(KEY, [ev('A', KEY, '09:00', '11:00')])])).toBeNull()
  })

  it('returns null when there are no meetings', () => {
    expect(longestMeetingBlock([day(KEY, [])])).toBeNull()
  })
})
