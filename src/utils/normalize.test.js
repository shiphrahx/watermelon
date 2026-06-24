import { describe, it, expect } from 'vitest'
import {
  normalizeCalendarEvents,
  normalizeTeamsMessages,
  normalizeSlackMessages,
} from './normalize.js'

describe('normalizeCalendarEvents', () => {
  const raw = [
    {
      id: 'a',
      subject: 'Standup',
      start: { dateTime: '2025-06-24T09:30:00', timeZone: 'Europe/London' },
      end: { dateTime: '2025-06-24T10:00:00', timeZone: 'Europe/London' },
      isAllDay: false,
      responseStatus: { response: 'accepted' },
      isOnlineMeeting: true,
    },
    {
      id: 'b',
      subject: 'Declined thing',
      start: { dateTime: '2025-06-24T11:00:00', timeZone: 'Europe/London' },
      end: { dateTime: '2025-06-24T11:30:00', timeZone: 'Europe/London' },
      isAllDay: false,
      responseStatus: { response: 'declined' },
      isOnlineMeeting: false,
    },
    {
      id: 'c',
      subject: 'Offsite',
      start: { dateTime: '2025-06-24T00:00:00', timeZone: 'Europe/London' },
      end: { dateTime: '2025-06-25T00:00:00', timeZone: 'Europe/London' },
      isAllDay: true,
      responseStatus: { response: 'accepted' },
      isOnlineMeeting: false,
    },
  ]

  it('excludes declined and all-day events', () => {
    const out = normalizeCalendarEvents(raw)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('a')
  })

  it('parses start/end into Date objects in local time', () => {
    const [ev] = normalizeCalendarEvents(raw)
    expect(ev.start).toBeInstanceOf(Date)
    expect(ev.start.getHours()).toBe(9)
    expect(ev.start.getMinutes()).toBe(30)
    expect(ev.end.getHours()).toBe(10)
  })

  it('falls back to a subject placeholder', () => {
    const out = normalizeCalendarEvents([
      {
        id: 'x',
        start: { dateTime: '2025-06-24T09:00:00' },
        end: { dateTime: '2025-06-24T09:30:00' },
        isAllDay: false,
        responseStatus: { response: 'accepted' },
      },
    ])
    expect(out[0].subject).toBe('(no subject)')
  })

  it('handles empty / missing input', () => {
    expect(normalizeCalendarEvents()).toEqual([])
    expect(normalizeCalendarEvents([])).toEqual([])
  })
})

describe('normalizeTeamsMessages', () => {
  it('maps createdDateTime to a millisecond timestamp tagged teams', () => {
    const out = normalizeTeamsMessages([
      { id: 'm', createdDateTime: '2025-06-24T11:03:22Z', chatId: 'chat_abc' },
    ])
    expect(out[0].source).toBe('teams')
    expect(out[0].chatId).toBe('chat_abc')
    expect(out[0].timestamp).toBe(Date.parse('2025-06-24T11:03:22Z'))
  })

  it('drops messages without a timestamp', () => {
    expect(normalizeTeamsMessages([{ id: 'm' }])).toEqual([])
  })
})

describe('normalizeSlackMessages', () => {
  it('maps ts seconds to a millisecond timestamp tagged slack', () => {
    const out = normalizeSlackMessages([
      { ts: '1750762800.000100', channel: 'C012AB3EF' },
    ])
    expect(out[0].source).toBe('slack')
    expect(out[0].channel).toBe('C012AB3EF')
    expect(out[0].timestamp).toBe(1750762800000)
  })

  it('drops messages without ts', () => {
    expect(normalizeSlackMessages([{ channel: 'C1' }])).toEqual([])
  })
})
