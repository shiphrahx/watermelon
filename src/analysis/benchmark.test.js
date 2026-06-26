import { describe, it, expect } from 'vitest'
import { benchmarkWeek } from './benchmark.js'

const wk = (weekKey, focusRate) => ({ weekKey, focusRate })

describe('benchmarkWeek', () => {
  it('returns null with fewer than 4 weeks', () => {
    const weeks = [wk('2026-W01', 40), wk('2026-W02', 50), wk('2026-W03', 60)]
    expect(benchmarkWeek(weeks, '2026-W03')).toBeNull()
  })

  it('returns null when the current week is not stored', () => {
    const weeks = [wk('A', 10), wk('B', 20), wk('C', 30), wk('D', 40)]
    expect(benchmarkWeek(weeks, 'Z')).toBeNull()
  })

  it('calls out the best week ever', () => {
    const weeks = [wk('A', 10), wk('B', 20), wk('C', 30), wk('D', 70)]
    expect(benchmarkWeek(weeks, 'D')).toBe('Your most focused week yet.')
  })

  it('frames a top-quartile (but not best) week with its rank', () => {
    // 8 weeks; rank 2 is within ceil(8*0.25)=2
    const weeks = Array.from({ length: 8 }, (_, i) => wk(`W${i}`, i * 10)) // W7 highest
    // current = W6 (second highest) -> rank 2
    expect(benchmarkWeek(weeks, 'W6')).toBe('One of your more focused weeks — 2nd best of 8 tracked.')
  })

  it('frames a bottom-quartile week as lighter than usual', () => {
    const weeks = Array.from({ length: 8 }, (_, i) => wk(`W${i}`, i * 10)) // W0 lowest
    expect(benchmarkWeek(weeks, 'W0')).toBe('A lighter week for focus than usual.')
  })

  it('frames a mid-pack week as about average', () => {
    const weeks = Array.from({ length: 8 }, (_, i) => wk(`W${i}`, i * 10))
    expect(benchmarkWeek(weeks, 'W4')).toBe('About average for you.')
  })
})
