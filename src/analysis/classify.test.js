import { describe, it, expect } from 'vitest'
import {
  classifyDay,
  summarise,
  CATEGORIES,
  UNCLASSIFIED,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from './classify.js'
import { fromDateKey } from '../utils/time.js'

const KEY = '2025-06-23'
const WS = '09:00'
const WE = '18:00'
const base = fromDateKey(KEY).getTime()
const at = (h, m) => base + (h * 60 + m) * 60000

// A message at h:m
const msg = (h, m) => ({ timestamp: at(h, m) })
// An accepted event h1:m1 - h2:m2
const ev = (h1, m1, h2, m2) => ({
  subject: 'Event',
  start: new Date(at(h1, m1)),
  end: new Date(at(h2, m2)),
})

function classify({ events = [], messages = [] }) {
  return classifyDay({ dateKey: KEY, workingStart: WS, workingEnd: WE, events, messages })
}
// category of the 30-min block starting at h:m
function blockAt(blocks, h, m) {
  const startMinute = h * 60 + m
  return blocks.find((b) => b.startMinute === startMinute)?.category
}

describe('classify metadata', () => {
  it('exposes the four active categories with Shallow work, no ad-hoc', () => {
    expect(CATEGORIES).toEqual(['meeting', 'focus', 'comms', 'shallow'])
    expect(CATEGORIES).not.toContain('possible-adhoc')
    expect(CATEGORY_LABELS.shallow).toBe('Shallow work')
    expect(CATEGORY_COLORS.shallow).toBe('#A8C5E8')
    expect(CATEGORY_LABELS['possible-adhoc']).toBeUndefined()
  })
})

describe('In meetings', () => {
  it('classifies blocks covered by an accepted event', () => {
    const blocks = classify({ events: [ev(9, 0, 10, 0)] })
    expect(blockAt(blocks, 9, 0)).toBe('meeting')
    expect(blockAt(blocks, 9, 30)).toBe('meeting')
  })

  it('deduplicates overlapping events (time counted once)', () => {
    const blocks = classify({ events: [ev(9, 0, 10, 0), ev(9, 30, 10, 30)] })
    // union 09:00–10:30 = 90 min, not 120
    expect(summarise(blocks).meeting).toBe(90)
  })
})

describe('Responding & messaging', () => {
  it('classifies a dense message cluster (gaps <= 5 min) as comms', () => {
    const messages = []
    for (let m = 0; m <= 30; m += 3) messages.push(msg(10, m)) // 10:00–10:30 every 3 min
    const blocks = classify({ messages })
    expect(blockAt(blocks, 10, 0)).toBe('comms')
  })
})

describe('Shallow work', () => {
  it('classifies 5–20 minute gaps between messages as shallow', () => {
    // messages every 15 minutes -> each gap is shallow
    const messages = [msg(10, 0), msg(10, 15), msg(10, 30), msg(10, 45)]
    const blocks = classify({ messages })
    expect(blockAt(blocks, 10, 0)).toBe('shallow')
  })
})

describe('Deep focus', () => {
  it('classifies long silence as focus', () => {
    const blocks = classify({})
    expect(blockAt(blocks, 11, 0)).toBe('focus')
    expect(summarise(blocks).focus).toBe(540) // whole 9h day
  })

  it('counts a sparse-message stretch as focus (low message density)', () => {
    // a quick message every 24 minutes, otherwise heads-down
    const messages = [msg(10, 0), msg(10, 24), msg(10, 48)]
    const blocks = classify({ messages })
    expect(blockAt(blocks, 10, 0)).toBe('focus')
  })
})

describe('Unclassified', () => {
  it('leaves a sub-20-minute gap between meetings unclassified', () => {
    // meeting 09:00–10:00, then 18-min silent gap, then meeting 10:18–11:00
    const blocks = classify({ events: [ev(9, 0, 10, 0), ev(10, 18, 11, 0)] })
    expect(blockAt(blocks, 10, 0)).toBe(UNCLASSIFIED)
    // unclassified time is excluded from totals
    expect(UNCLASSIFIED in summarise(blocks)).toBe(false)
  })
})

describe('priority order', () => {
  it('meeting wins over messaging in the same block', () => {
    const messages = []
    for (let m = 0; m <= 30; m += 3) messages.push(msg(10, m))
    const blocks = classify({ events: [ev(10, 0, 10, 30)], messages })
    expect(blockAt(blocks, 10, 0)).toBe('meeting')
  })
})
