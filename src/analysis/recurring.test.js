import { describe, it, expect } from 'vitest'
import { aggregateRecurringFromHistory, recurringAudit } from './recurring.js'

const week = (recurringMeetings) => ({ recurringMeetings })
const ev = (subject, dateKey, s, e) => ({
  subject,
  start: new Date(`${dateKey}T${s}:00`),
  end: new Date(`${dateKey}T${e}:00`),
})
const day = (dateKey, events) => ({ dateKey, blocks: [], events, messages: [] })

describe('aggregateRecurringFromHistory', () => {
  it('merges by normalised title across weeks and sums totals', () => {
    const weeks = [
      week([{ title: 'Standup #1', totalMinutes: 150, occurrences: 5 }]),
      week([{ title: 'standup', totalMinutes: 150, occurrences: 5 }]),
    ]
    const out = aggregateRecurringFromHistory(weeks)
    expect(out).toHaveLength(1)
    expect(out[0].totalMinutes).toBe(300)
    expect(out[0].occurrences).toBe(10)
    expect(out[0].averageMinutes).toBe(30)
  })
})

describe('recurringAudit', () => {
  it('uses history when available, top N by total, 2+ occurrences', () => {
    const weeks = [
      week([
        { title: 'Standup', totalMinutes: 300, occurrences: 10 },
        { title: 'Sprint planning', totalMinutes: 240, occurrences: 4 },
        { title: 'One-off', totalMinutes: 60, occurrences: 1 }, // filtered (1 occ)
      ]),
    ]
    const { items, mostExpensive } = recurringAudit({ weeks, top: 8 })
    expect(items.map((m) => m.title)).toEqual(['Standup', 'Sprint planning'])
    expect(mostExpensive.title).toBe('Standup')
  })

  it('falls back to the current range when no history', () => {
    const days = [
      day('2025-06-23', [ev('Standup #1', '2025-06-23', '09:00', '09:30')]),
      day('2025-06-24', [ev('Standup #2', '2025-06-24', '09:00', '09:30')]),
    ]
    const { items } = recurringAudit({ weeks: [], days })
    expect(items).toHaveLength(1)
    expect(items[0].occurrences).toBe(2)
    expect(items[0].totalMinutes).toBe(60)
  })

  it('caps at the top N', () => {
    const names = 'alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima'.split(' ')
    const recurring = names.map((name, i) => ({
      title: `${name} sync`, // distinct words (no trailing digits to normalise away)
      totalMinutes: 100 - i,
      occurrences: 2,
    }))
    const { items } = recurringAudit({ weeks: [week(recurring)], top: 8 })
    expect(items).toHaveLength(8)
  })
})
