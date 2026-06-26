import { describe, it, expect } from 'vitest'
import { computeFocusDebt } from './focusDebt.js'

// perDay entry helper: focusMinutes for a weekday with data
const d = (focus, { isWeekday = true, hasData = true } = {}) => ({
  isWeekday,
  hasData,
  categories: { focus },
})

describe('computeFocusDebt', () => {
  it('counts the trailing run of low-focus days (default 1h threshold)', () => {
    // Mon ok, Tue/Wed/Thu low
    const perDay = [d(120), d(30), d(0), d(45)]
    expect(computeFocusDebt(perDay).streak).toBe(3)
  })

  it('returns 0 when the most recent day is above threshold', () => {
    const perDay = [d(0), d(0), d(120)]
    expect(computeFocusDebt(perDay).streak).toBe(0)
  })

  it('respects a custom threshold', () => {
    // with 2h threshold, 90-min days count as low
    const perDay = [d(90), d(90), d(90)]
    expect(computeFocusDebt(perDay, 2).streak).toBe(3)
    expect(computeFocusDebt(perDay, 1).streak).toBe(0)
  })

  it('ignores weekends and days without data', () => {
    const perDay = [d(30), d(0, { hasData: false }), d(0, { isWeekday: false }), d(30)]
    // only the two weekday-with-data low days count, and they are consecutive
    expect(computeFocusDebt(perDay).streak).toBe(2)
  })
})
