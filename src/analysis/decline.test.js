import { describe, it, expect } from 'vitest'
import { declineCandidates } from './messaging.js'

const KEY = '2025-06-23'
const KEY2 = '2025-06-24'
const ev = (subject, dateKey, s, e) => ({
  subject,
  start: new Date(`${dateKey}T${s}:00`),
  end: new Date(`${dateKey}T${e}:00`),
})
const msgAt = (dateKey, hhmm) => ({ timestamp: new Date(`${dateKey}T${hhmm}:00`).getTime(), source: 'slack', channel: 'c' })
const day = (dateKey, events, messages = []) => ({ dateKey, blocks: [], events, messages })

describe('declineCandidates', () => {
  it('flags a recurring meeting messaged through > 50% of occurrences with 3+ avg', () => {
    // Standup twice; each occurrence has 3 messages during it
    const days = [
      day(KEY, [ev('Standup #1', KEY, '09:00', '09:30')], [
        msgAt(KEY, '09:05'), msgAt(KEY, '09:10'), msgAt(KEY, '09:15'),
      ]),
      day(KEY2, [ev('Standup #2', KEY2, '09:00', '09:30')], [
        msgAt(KEY2, '09:05'), msgAt(KEY2, '09:10'), msgAt(KEY2, '09:20'),
      ]),
    ]
    const flagged = declineCandidates(days)
    expect(flagged).toHaveLength(1)
    expect(flagged[0].occurrences).toBe(2)
    expect(flagged[0].avgMessages).toBe(3)
  })

  it('does not flag meetings messaged in <= 50% of occurrences', () => {
    const days = [
      day(KEY, [ev('Sync', KEY, '09:00', '09:30')], [msgAt(KEY, '09:05'), msgAt(KEY, '09:10'), msgAt(KEY, '09:15')]),
      day(KEY2, [ev('Sync', KEY2, '09:00', '09:30')], []), // no messages this time
    ]
    // withMessages 1 of 2 = 50%, not > 50%
    expect(declineCandidates(days)).toEqual([])
  })

  it('does not flag when the average is under 3 messages', () => {
    const days = [
      day(KEY, [ev('Sync', KEY, '09:00', '09:30')], [msgAt(KEY, '09:05')]),
      day(KEY2, [ev('Sync', KEY2, '09:00', '09:30')], [msgAt(KEY2, '09:05')]),
    ]
    expect(declineCandidates(days)).toEqual([])
  })
})
