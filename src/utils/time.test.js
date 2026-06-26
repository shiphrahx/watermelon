import { describe, it, expect } from 'vitest'
import {
  BLOCK_MINUTES,
  toDateKey,
  fromDateKey,
  parseTimeToMinutes,
  minutesToTimeLabel,
  dateKeysInRange,
  buildDayBlocks,
  startOfDayISO,
  endOfDayISO,
  formatDuration,
} from './time.js'

describe('toDateKey / fromDateKey', () => {
  it('round-trips a local date', () => {
    const d = new Date(2025, 5, 24)
    expect(toDateKey(d)).toBe('2025-06-24')
    expect(toDateKey(fromDateKey('2025-06-24'))).toBe('2025-06-24')
  })
  it('zero-pads month and day', () => {
    expect(toDateKey(new Date(2025, 0, 3))).toBe('2025-01-03')
  })
  it('fromDateKey produces local midnight', () => {
    const d = fromDateKey('2025-06-24')
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getDate()).toBe(24)
  })
})

describe('parseTimeToMinutes / minutesToTimeLabel', () => {
  it('parses HH:MM to minutes', () => {
    expect(parseTimeToMinutes('09:00')).toBe(540)
    expect(parseTimeToMinutes('18:30')).toBe(1110)
    expect(parseTimeToMinutes('00:00')).toBe(0)
  })
  it('formats minutes back to HH:MM with padding', () => {
    expect(minutesToTimeLabel(540)).toBe('09:00')
    expect(minutesToTimeLabel(1110)).toBe('18:30')
    expect(minutesToTimeLabel(0)).toBe('00:00')
  })
  it('round-trips', () => {
    for (const t of ['07:05', '12:00', '23:59']) {
      expect(minutesToTimeLabel(parseTimeToMinutes(t))).toBe(t)
    }
  })
})

describe('dateKeysInRange', () => {
  it('is inclusive of both ends', () => {
    expect(dateKeysInRange('2025-06-23', '2025-06-25')).toEqual([
      '2025-06-23',
      '2025-06-24',
      '2025-06-25',
    ])
  })
  it('returns a single day for an equal range', () => {
    expect(dateKeysInRange('2025-06-23', '2025-06-23')).toEqual(['2025-06-23'])
  })
  it('crosses a month boundary', () => {
    expect(dateKeysInRange('2025-06-30', '2025-07-01')).toEqual(['2025-06-30', '2025-07-01'])
  })
})

describe('buildDayBlocks', () => {
  it('produces contiguous 30-minute blocks across working hours', () => {
    const blocks = buildDayBlocks('2025-06-24', '09:00', '18:00')
    expect(blocks).toHaveLength(18) // 9h / 30m
    expect(blocks[0].startMinute).toBe(540)
    expect(blocks[0].endMinute).toBe(570)
    expect(blocks.at(-1).endMinute).toBe(1080) // 18:00
    for (let i = 1; i < blocks.length; i++) {
      expect(blocks[i].startMinute).toBe(blocks[i - 1].endMinute)
    }
  })
  it('block start/end are Date objects 30 minutes apart', () => {
    const [b] = buildDayBlocks('2025-06-24', '09:00', '10:00')
    expect(b.start).toBeInstanceOf(Date)
    expect((b.end - b.start) / 60000).toBe(BLOCK_MINUTES)
  })
  it('drops a trailing partial block that does not fit', () => {
    // 09:00–09:50 only fits one full 30-min block
    expect(buildDayBlocks('2025-06-24', '09:00', '09:50')).toHaveLength(1)
  })
})

describe('startOfDayISO / endOfDayISO', () => {
  it('start is before end for the same day', () => {
    expect(new Date(startOfDayISO('2025-06-24')) < new Date(endOfDayISO('2025-06-24'))).toBe(true)
  })
  it('end is within the same calendar day', () => {
    expect(new Date(endOfDayISO('2025-06-24')).getDate()).toBe(24)
  })
})

describe('formatDuration', () => {
  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m')
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(45)).toBe('45m')
    expect(formatDuration(0)).toBe('0m')
    expect(formatDuration(125)).toBe('2h 5m')
  })
})
