import { describe, it, expect } from 'vitest'
import {
  focusRuns,
  focusBlockDistribution,
  morningAfternoonSplit,
  focusConsistency,
  longestFocusBlockInRange,
} from './focus.js'
import { buildDayBlocks } from '../utils/time.js'

const WS = '09:00'
const WE = '18:00'

function makeDay(dateKey, cats) {
  const blocks = buildDayBlocks(dateKey, WS, WE).map((b, i) => ({
    ...b,
    category: cats[i] || 'meeting',
  }))
  return { dateKey, blocks, events: [], messages: [] }
}

describe('focusRuns', () => {
  it('merges consecutive focus blocks into runs', () => {
    // focus at 0,1 (60m) and 4 (30m)
    const cats = ['focus', 'focus', 'meeting', 'meeting', 'focus']
    const runs = focusRuns(makeDay('2025-06-23', cats).blocks.slice(0, 5))
    expect(runs).toHaveLength(2)
    expect(runs[0].minutes).toBe(60)
    expect(runs[1].minutes).toBe(30)
  })
})

describe('focusBlockDistribution', () => {
  it('buckets runs by size and excludes nothing at 30-min granularity', () => {
    // one 30-min run, one 60-min run, one 90-min run
    const cats = [
      'focus', 'meeting', // 30m run
      'focus', 'focus', 'meeting', // 60m run
      'focus', 'focus', 'focus', // 90m run
      ...Array(10).fill('meeting'),
    ]
    const dist = focusBlockDistribution([makeDay('2025-06-23', cats)])
    const get = (k) => dist.buckets.find((b) => b.key === k)
    expect(get('20to30').count).toBe(1)
    expect(get('30to60').count).toBe(1) // the 60-min run
    expect(get('over60').count).toBe(1) // the 90-min run
    expect(dist.totalBlocks).toBe(3)
    expect(dist.totalMinutes).toBe(30 + 60 + 90)
    expect(dist.averageMinutes).toBe(60)
  })

  it('excludes weekends', () => {
    const dist = focusBlockDistribution([makeDay('2025-06-28', Array(18).fill('focus'))])
    expect(dist.totalBlocks).toBe(0)
  })
})

describe('morningAfternoonSplit', () => {
  it('splits focus minutes around noon', () => {
    // focus 09:00-11:00 (morning, 120m) and 13:00-14:00 (afternoon, 60m)
    const cats = [
      'focus', 'focus', 'focus', 'focus', // 09:00-11:00
      'meeting', 'meeting', 'meeting', 'meeting', // 11:00-13:00
      'focus', 'focus', // 13:00-14:00
      ...Array(8).fill('meeting'),
    ]
    const split = morningAfternoonSplit([makeDay('2025-06-23', cats)])
    expect(split.morningMinutes).toBe(120)
    expect(split.afternoonMinutes).toBe(60)
    expect(split.morningPct).toBe(67)
    expect(split.afternoonPct).toBe(33)
    expect(split.better).toBe('morning')
  })

  it('returns null better-half when there is no focus', () => {
    expect(morningAfternoonSplit([makeDay('2025-06-23', Array(18).fill('meeting'))]).better).toBeNull()
  })
})

describe('focusConsistency', () => {
  it('reports low variance when focus starts at the same time daily', () => {
    const cats = ['meeting', 'meeting', 'focus', 'focus', ...Array(14).fill('meeting')] // starts 10:00
    const days = [makeDay('2025-06-23', cats), makeDay('2025-06-24', cats)]
    const c = focusConsistency(days)
    expect(c.varianceMinutes).toBe(0)
    expect(c.level).toBe('low')
    expect(c.perDay).toHaveLength(2)
  })

  it('reports high variance when focus moves a lot', () => {
    const early = ['focus', 'focus', ...Array(16).fill('meeting')] // 09:00
    const late = [...Array(16).fill('meeting'), 'focus', 'focus'] // 17:00
    const c = focusConsistency([makeDay('2025-06-23', early), makeDay('2025-06-24', late)])
    expect(c.level).toBe('high')
  })

  it('is insufficient with fewer than two focus days', () => {
    const c = focusConsistency([makeDay('2025-06-23', Array(18).fill('meeting'))])
    expect(c.level).toBe('insufficient')
  })
})

describe('longestFocusBlockInRange', () => {
  it('finds the single longest run with its day and start', () => {
    const short = ['focus', 'focus', ...Array(16).fill('meeting')] // 60m
    const long = ['meeting', 'meeting', 'meeting', 'focus', 'focus', 'focus', 'focus', ...Array(11).fill('meeting')] // 120m at 10:30
    const r = longestFocusBlockInRange([makeDay('2025-06-23', short), makeDay('2025-06-24', long)])
    expect(r.minutes).toBe(120)
    expect(r.weekday).toBe('Tuesday')
    expect(r.startMinute).toBe(10 * 60 + 30)
  })

  it('returns null with no focus', () => {
    expect(longestFocusBlockInRange([makeDay('2025-06-23', Array(18).fill('meeting'))])).toBeNull()
  })
})
