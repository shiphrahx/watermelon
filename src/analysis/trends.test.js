import { describe, it, expect } from 'vitest'
import { computeTrendStats, series } from './trends.js'

const wk = (weekKey, focusRate, meetingMinutes = 600) => ({
  weekKey,
  focusRate,
  meetingMinutes,
  focusMinutes: focusRate * 6,
  fragmentationCount: 0,
})

describe('computeTrendStats', () => {
  it('reports not-enough with fewer than 2 weeks', () => {
    expect(computeTrendStats([]).hasEnough).toBe(false)
    expect(computeTrendStats([wk('2026-W01', 40)]).hasEnough).toBe(false)
  })

  it('computes the current-vs-previous focus delta', () => {
    const stats = computeTrendStats([wk('2026-W01', 40), wk('2026-W02', 52)])
    expect(stats.focusDelta).toBe(12)
    expect(stats.current.weekKey).toBe('2026-W02')
    expect(stats.previous.weekKey).toBe('2026-W01')
  })

  it('finds the best week by focus rate', () => {
    const stats = computeTrendStats([wk('2026-W01', 40), wk('2026-W02', 70), wk('2026-W03', 55)])
    expect(stats.bestWeek.weekKey).toBe('2026-W02')
    expect(stats.bestWeek.focusRate).toBe(70)
  })

  it('uses an upward template when focus rate climbs', () => {
    const stats = computeTrendStats([wk('2026-W01', 30), wk('2026-W02', 40), wk('2026-W03', 55)])
    expect(stats.sentence).toMatch(/trended up/)
  })

  it('uses a downward template when focus rate falls', () => {
    const stats = computeTrendStats([wk('2026-W01', 60), wk('2026-W02', 45), wk('2026-W03', 30)])
    expect(stats.sentence).toMatch(/trended down/)
  })

  it('notes climbing meeting load when focus is flat', () => {
    const stats = computeTrendStats([
      wk('2026-W01', 45, 200),
      wk('2026-W02', 46, 400),
      wk('2026-W03', 45, 600),
    ])
    expect(stats.sentence).toMatch(/Meeting load has been climbing for 3 weeks/)
  })
})

describe('series', () => {
  it('maps weeks to { weekKey, value } for a given metric', () => {
    const s = series([wk('2026-W01', 40), wk('2026-W02', 50)], 'focusRate')
    expect(s).toEqual([
      { weekKey: '2026-W01', value: 40 },
      { weekKey: '2026-W02', value: 50 },
    ])
  })
})
