import { describe, it, expect } from 'vitest'
import {
  isWeekend,
  isWeekday,
  mondayOf,
  thisWeekRange,
  lastWeekRange,
  lastTwoWeeksRange,
  rangeDayCount,
  weekdayCount,
  shiftRangeDays,
  previousWeekRange,
  navigateWeek,
  navigateDay,
  clampCustomRange,
  MAX_CUSTOM_RANGE_DAYS,
} from './ranges.js'
import { toDateKey } from './time.js'

// Reference dates (month is 0-based): Wed 25 Jun 2025, Sat 28 Jun 2025.
const WED = new Date(2025, 5, 25)
const SAT = new Date(2025, 5, 28)

describe('weekend / weekday', () => {
  it('detects weekends', () => {
    expect(isWeekend(SAT)).toBe(true)
    expect(isWeekend(new Date(2025, 5, 29))).toBe(true) // Sun
    expect(isWeekend(WED)).toBe(false)
  })
  it('isWeekday is the inverse', () => {
    expect(isWeekday(WED)).toBe(true)
    expect(isWeekday(SAT)).toBe(false)
  })
  it('accepts date keys', () => {
    expect(isWeekend('2025-06-28')).toBe(true)
    expect(isWeekday('2025-06-25')).toBe(true)
  })
})

describe('mondayOf', () => {
  it('returns Monday of the same week', () => {
    expect(toDateKey(mondayOf(WED))).toBe('2025-06-23') // Mon
  })
  it('handles a Sunday by going back to the prior Monday', () => {
    expect(toDateKey(mondayOf(new Date(2025, 5, 29)))).toBe('2025-06-23')
  })
  it('returns the same day when given a Monday', () => {
    expect(toDateKey(mondayOf(new Date(2025, 5, 23)))).toBe('2025-06-23')
  })
})

describe('thisWeekRange', () => {
  it('runs Monday to today on a weekday', () => {
    expect(thisWeekRange(WED)).toEqual({ startKey: '2025-06-23', endKey: '2025-06-25' })
  })
  it('runs Monday to Friday on a weekend', () => {
    expect(thisWeekRange(SAT)).toEqual({ startKey: '2025-06-23', endKey: '2025-06-27' })
  })
})

describe('lastWeekRange', () => {
  it('is the previous Monday to Friday', () => {
    expect(lastWeekRange(WED)).toEqual({ startKey: '2025-06-16', endKey: '2025-06-20' })
  })
})

describe('lastTwoWeeksRange', () => {
  it('runs from last Monday to today on a weekday', () => {
    expect(lastTwoWeeksRange(WED)).toEqual({ startKey: '2025-06-16', endKey: '2025-06-25' })
  })
})

describe('counts', () => {
  it('rangeDayCount is inclusive', () => {
    expect(rangeDayCount({ startKey: '2025-06-23', endKey: '2025-06-25' })).toBe(3)
    expect(rangeDayCount({ startKey: '2025-06-23', endKey: '2025-06-23' })).toBe(1)
  })
  it('weekdayCount excludes weekends', () => {
    // Mon 23 -> Sun 29 = 5 weekdays
    expect(weekdayCount({ startKey: '2025-06-23', endKey: '2025-06-29' })).toBe(5)
  })
})

describe('shifting and navigation', () => {
  it('shiftRangeDays moves both ends', () => {
    expect(shiftRangeDays({ startKey: '2025-06-23', endKey: '2025-06-25' }, -7)).toEqual({
      startKey: '2025-06-16',
      endKey: '2025-06-18',
    })
  })
  it('previousWeekRange shifts back 7 days', () => {
    expect(previousWeekRange({ startKey: '2025-06-23', endKey: '2025-06-25' })).toEqual({
      startKey: '2025-06-16',
      endKey: '2025-06-18',
    })
  })
  it('navigateWeek moves forward and back', () => {
    const r = { startKey: '2025-06-23', endKey: '2025-06-27' }
    expect(navigateWeek(r, 1)).toEqual({ startKey: '2025-06-30', endKey: '2025-07-04' })
    expect(navigateWeek(r, -1)).toEqual({ startKey: '2025-06-16', endKey: '2025-06-20' })
  })
  it('navigateDay moves a single day', () => {
    expect(navigateDay('2025-06-25', 1)).toBe('2025-06-26')
    expect(navigateDay('2025-06-25', -1)).toBe('2025-06-24')
  })
})

describe('clampCustomRange', () => {
  it('leaves a short range unchanged', () => {
    const r = { startKey: '2025-06-01', endKey: '2025-06-10' }
    expect(clampCustomRange(r)).toEqual(r)
  })
  it('caps a range longer than the max', () => {
    const r = clampCustomRange({ startKey: '2025-06-01', endKey: '2025-12-31' })
    expect(rangeDayCount(r)).toBe(MAX_CUSTOM_RANGE_DAYS)
    expect(r.startKey).toBe('2025-06-01')
  })
  it('swaps reversed ranges', () => {
    expect(clampCustomRange({ startKey: '2025-06-10', endKey: '2025-06-01' })).toEqual({
      startKey: '2025-06-01',
      endKey: '2025-06-10',
    })
  })
})
