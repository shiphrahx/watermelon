import { describe, it, expect, vi, beforeEach } from 'vitest'

// Avoid loading real MSAL; stub the token getter.
vi.mock('../auth/microsoft.js', () => ({
  getMicrosoftToken: () => Promise.resolve('fake-token'),
}))

import { fetchCalendarEvents, fetchTeamsMessages } from './graph.js'

function jsonResponse(body) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body), text: () => Promise.resolve('') })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchCalendarEvents', () => {
  it('returns raw Graph events and follows pagination', async () => {
    const page1 = { value: [{ id: 'a' }], '@odata.nextLink': 'https://graph.microsoft.com/v1.0/me/calendarView?page=2' }
    const page2 = { value: [{ id: 'b' }] }
    const fetchMock = vi.fn()
      .mockReturnValueOnce(jsonResponse(page1))
      .mockReturnValueOnce(jsonResponse(page2))
    vi.stubGlobal('fetch', fetchMock)

    const events = await fetchCalendarEvents('2025-06-23', '2025-06-23')
    expect(events.map((e) => e.id)).toEqual(['a', 'b'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    // sends a bearer token
    const headers = fetchMock.mock.calls[0][1].headers
    expect(headers.Authorization).toBe('Bearer fake-token')
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('err') }),
    ))
    await expect(fetchCalendarEvents('2025-06-23', '2025-06-23')).rejects.toThrow(/Graph/)
  })
})

describe('fetchTeamsMessages', () => {
  it('collects in-range messages across chats with chatId set', async () => {
    const inRange = '2025-06-23T11:00:00' // local mid-day, in range in any tz
    const outOfRange = '2030-01-01T11:00:00'
    const fetchMock = vi.fn((url) => {
      if (url.includes('/me/chats?')) return jsonResponse({ value: [{ id: 'chat1' }] })
      if (url.includes('/messages')) {
        return jsonResponse({ value: [
          { id: 'm1', createdDateTime: inRange },
          { id: 'm2', createdDateTime: outOfRange },
        ] })
      }
      return jsonResponse({ value: [] })
    })
    vi.stubGlobal('fetch', fetchMock)

    const msgs = await fetchTeamsMessages('2025-06-23', '2025-06-23')
    expect(msgs).toHaveLength(1)
    expect(msgs[0].id).toBe('m1')
    expect(msgs[0].chatId).toBe('chat1')
  })
})
