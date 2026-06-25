import { describe, it, expect } from 'vitest'
import { dayQualityLabel, endOfDayOverrun } from './overview.js'
import { buildDayBlocks } from '../utils/time.js'

const WS = '09:00'
const WE = '18:00'

function makeDay(dateKey, cats, { events = [], messages = [] } = {}) {
  const blocks = buildDayBlocks(dateKey, WS, WE).map((b, i) => ({
    ...b,
    category: cats[i] || 'focus',
  }))
  return { dateKey, blocks, events, messages }
}

const fill = (cat) => Array(18).fill(cat)

describe('dayQualityLabel', () => {
  const withData = { messages: [{ timestamp: 1 }] }

  it('labels a protected day (lots of focus, few meetings)', () => {
    const day = makeDay('2025-06-23', fill('focus'), withData)
    expect(dayQualityLabel(day, WS, WE)).toBe('Protected day')
  })

  it('labels a meeting day (>50% meetings)', () => {
    // 12 meeting blocks (6h) of 9h > 50%
    const cats = [...Array(12).fill('meeting'), ...Array(6).fill('focus')]
    const day = makeDay('2025-06-23', cats, withData)
    expect(dayQualityLabel(day, WS, WE)).toBe('Meeting day')
  })

  it('labels a reactive day (lots of messaging, no real focus blocks)', () => {
    // 8 comms (4h) > 3h, meetings 210m (< 50%), no focus run => reactive
    const cats = [...Array(8).fill('comms'), ...Array(7).fill('meeting'), ...Array(3).fill('possible-adhoc')]
    const day = makeDay('2025-06-23', cats, withData)
    expect(dayQualityLabel(day, WS, WE)).toBe('Reactive day')
  })

  it('labels a scattered day (no category over 40%)', () => {
    // even-ish spread: 5 focus, 5 meeting, 4 comms, 4 adhoc (max share 5/18=28%)
    const cats = [
      ...Array(5).fill('focus'),
      ...Array(5).fill('meeting'),
      ...Array(4).fill('comms'),
      ...Array(4).fill('possible-adhoc'),
    ]
    const day = makeDay('2025-06-23', cats, withData)
    expect(dayQualityLabel(day, WS, WE)).toBe('Scattered day')
  })

  it('defaults to "Mixed day" when a day with data matches no pattern', () => {
    // focus 8 (44% share, not >4h), meeting 4, comms 3, adhoc 3 -> no rule fits
    const cats = [
      ...Array(8).fill('focus'),
      ...Array(4).fill('meeting'),
      ...Array(3).fill('comms'),
      ...Array(3).fill('possible-adhoc'),
    ]
    expect(dayQualityLabel(makeDay('2025-06-23', cats, withData), WS, WE)).toBe('Mixed day')
  })

  it('returns null for a day with no data', () => {
    expect(dayQualityLabel(makeDay('2025-06-23', fill('focus')), WS, WE)).toBeNull()
  })
})

describe('endOfDayOverrun', () => {
  it('counts weekdays with activity past the end time', () => {
    const late = { messages: [{ timestamp: new Date('2025-06-23T18:40:00').getTime() }] }
    const onTime = { messages: [{ timestamp: new Date('2025-06-24T16:00:00').getTime() }] }
    const days = [
      makeDay('2025-06-23', fill('focus'), late),
      makeDay('2025-06-24', fill('focus'), onTime),
    ]
    const r = endOfDayOverrun(days, WE)
    expect(r.totalDays).toBe(2)
    expect(r.daysOver).toBe(1)
    const mon = r.perDay.find((d) => d.dateKey === '2025-06-23')
    expect(mon.overrunMinutes).toBe(40)
  })

  it('caps the display value at 60 minutes', () => {
    const veryLate = { messages: [{ timestamp: new Date('2025-06-23T20:30:00').getTime() }] }
    const r = endOfDayOverrun(days_(veryLate), WE)
    expect(r.perDay[0].overrunMinutes).toBe(150)
    expect(r.perDay[0].displayMinutes).toBe(60)
  })
})

function days_(opts) {
  return [makeDay('2025-06-23', Array(18).fill('focus'), opts)]
}
