import { describe, it, expect } from 'vitest'
import {
  messageVolumeByHour,
  meetingMultitasking,
  contextSwitching,
  quietestHour,
  responsePattern,
  teamsVsSlack,
} from './messaging.js'

const WS = '09:00'
const WE = '18:00'
const KEY = '2025-06-23' // Monday

function msg(dateKey, hhmm, source, conv, senderId) {
  const m = { timestamp: new Date(`${dateKey}T${hhmm}:00`).getTime(), source, senderId }
  if (source === 'slack') m.channel = conv
  else m.chatId = conv
  return m
}

const day = (dateKey, messages, events = []) => ({ dateKey, blocks: [], events, messages })

describe('messageVolumeByHour', () => {
  it('counts messages per hour split by source', () => {
    const messages = [
      msg(KEY, '09:10', 'teams', 'c1'),
      msg(KEY, '09:40', 'slack', 'c2'),
      msg(KEY, '10:05', 'teams', 'c1'),
    ]
    const { hours, busiest } = messageVolumeByHour([day(KEY, messages)], WS, WE)
    const nine = hours.find((h) => h.label === '09:00–10:00')
    expect(nine.teams).toBe(1)
    expect(nine.slack).toBe(1)
    expect(nine.total).toBe(2)
    expect(busiest.label).toBe('09:00–10:00')
  })

  it('ignores weekends', () => {
    const sat = day('2025-06-28', [msg('2025-06-28', '10:00', 'teams', 'c1')])
    expect(messageVolumeByHour([sat], WS, WE).busiest).toBeNull()
  })
})

describe('meetingMultitasking', () => {
  it('counts messages sent during accepted meetings, grouped by title', () => {
    const events = [
      { subject: 'Standup', start: new Date(`${KEY}T09:00:00`), end: new Date(`${KEY}T09:30:00`) },
    ]
    const messages = [
      msg(KEY, '09:10', 'teams', 'c1'), // during meeting
      msg(KEY, '09:20', 'slack', 'c2'), // during meeting
      msg(KEY, '11:00', 'teams', 'c1'), // outside meeting
    ]
    const r = meetingMultitasking([day(KEY, messages, events)])
    expect(r.total).toBe(2)
    expect(r.perMeeting[0]).toMatchObject({ subject: 'Standup', messages: 2, occurrences: 1 })
  })

  it('reports zero when no messages during meetings', () => {
    const events = [
      { subject: 'Standup', start: new Date(`${KEY}T09:00:00`), end: new Date(`${KEY}T09:30:00`) },
    ]
    const r = meetingMultitasking([day(KEY, [msg(KEY, '11:00', 'teams', 'c1')], events)])
    expect(r.total).toBe(0)
    expect(r.perMeeting).toEqual([])
  })
})

describe('contextSwitching', () => {
  it('counts 15-min windows with 3+ distinct conversations', () => {
    const messages = [
      msg(KEY, '09:01', 'slack', 'c1'),
      msg(KEY, '09:05', 'slack', 'c2'),
      msg(KEY, '09:09', 'teams', 'c3'), // 09:00-09:15 bin has 3 convs -> switch
      msg(KEY, '10:00', 'slack', 'c1'),
      msg(KEY, '10:05', 'slack', 'c1'), // same conv -> no switch
    ]
    const r = contextSwitching([day(KEY, messages)])
    expect(r.perDay[0].count).toBe(1)
    expect(r.total).toBe(1)
  })
})

describe('quietestHour', () => {
  it('returns the working hour with the fewest sent messages', () => {
    const messages = [
      msg(KEY, '09:10', 'teams', 'c1'),
      msg(KEY, '09:20', 'teams', 'c1'),
      msg(KEY, '14:10', 'teams', 'c1'),
    ]
    // 14:00-15:00 has 1 msg; many hours have 0 — quietest is a 0 hour.
    const q = quietestHour([day(KEY, messages)], WS, WE)
    expect(q.total).toBe(0)
  })
})

describe('responsePattern', () => {
  it('buckets reply gaps where the sender changes', () => {
    // alternating senders A/B in one channel => every gap is a response event
    const messages = [
      msg(KEY, '09:00', 'slack', 'c1', 'B'),
      msg(KEY, '09:02', 'slack', 'c1', 'A'), // 2 min -> immediate
      msg(KEY, '09:20', 'slack', 'c1', 'B'), // 18 min -> considered
      msg(KEY, '10:30', 'slack', 'c1', 'A'), // 70 min -> async
      msg(KEY, '11:00', 'slack', 'c1', 'B'), // 30 min -> considered
      msg(KEY, '11:03', 'slack', 'c1', 'A'), // 3 min -> immediate
    ]
    const r = responsePattern([day(KEY, messages)], 3)
    expect(r.sufficient).toBe(true)
    expect(r.samples).toBe(5)
    expect(r.immediate + r.considered + r.async).toBeGreaterThanOrEqual(99)
  })

  it('ignores consecutive messages from the same sender', () => {
    const messages = [
      msg(KEY, '09:00', 'slack', 'c1', 'A'),
      msg(KEY, '09:02', 'slack', 'c1', 'A'),
      msg(KEY, '09:04', 'slack', 'c1', 'A'),
    ]
    const r = responsePattern([day(KEY, messages)], 1)
    expect(r.sufficient).toBe(false) // no sender changes -> 0 response events
  })

  it('reports insufficient data below the 20-pair threshold by default', () => {
    const messages = [
      msg(KEY, '09:00', 'slack', 'c1', 'B'),
      msg(KEY, '09:02', 'slack', 'c1', 'A'),
    ]
    expect(responsePattern([day(KEY, messages)]).sufficient).toBe(false)
  })
})

describe('teamsVsSlack', () => {
  it('computes the platform split', () => {
    const messages = [
      msg(KEY, '09:00', 'teams', 'c1'),
      msg(KEY, '09:10', 'teams', 'c1'),
      msg(KEY, '09:20', 'slack', 'c2'),
    ]
    const r = teamsVsSlack([day(KEY, messages)])
    expect(r.teamsCount).toBe(2)
    expect(r.slackCount).toBe(1)
    expect(r.teamsPct).toBe(67)
    expect(r.slackPct).toBe(33)
  })

  it('handles no messages without dividing by zero', () => {
    const r = teamsVsSlack([day(KEY, [])])
    expect(r.teamsPct).toBe(0)
    expect(r.slackPct).toBe(0)
    expect(r.patternHolds).toBe(false)
  })
})
