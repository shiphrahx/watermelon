import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../auth/slack.js', () => ({ getSlackToken: () => 'slack-token' }))
vi.mock('../utils/settings.js', () => ({ getSlackProxyUrl: () => 'https://proxy.example.dev' }))

import { fetchSlackMessages } from './slack.js'

function jsonResponse(body) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchSlackMessages', () => {
  it('lists conversations then returns raw messages with channel set, via the proxy', async () => {
    const fetchMock = vi.fn((url) => {
      if (url.includes('users.conversations')) {
        return jsonResponse({ ok: true, channels: [{ id: 'C1' }], response_metadata: { next_cursor: '' } })
      }
      if (url.includes('conversations.history')) {
        return jsonResponse({ ok: true,
          messages: [{ ts: '1750000000.000100', text: 'hi' }],
          response_metadata: { next_cursor: '' },
        })
      }
      return jsonResponse({})
    })
    vi.stubGlobal('fetch', fetchMock)

    const msgs = await fetchSlackMessages('2025-06-23', '2025-06-23')
    expect(msgs).toHaveLength(1)
    expect(msgs[0].channel).toBe('C1')
    expect(msgs[0].ts).toBe('1750000000.000100')

    // all calls go through the configured proxy and pass the token header
    for (const call of fetchMock.mock.calls) {
      expect(call[0].startsWith('https://proxy.example.dev')).toBe(true)
      expect(call[1].headers.token).toBe('slack-token')
    }
  })

  it('skips conversations whose history cannot be read', async () => {
    const fetchMock = vi.fn((url) => {
      if (url.includes('users.conversations')) {
        return jsonResponse({ ok: true, channels: [{ id: 'C1' }], response_metadata: { next_cursor: '' } })
      }
      // history call fails (not ok) -> conversation skipped, no throw
      return Promise.resolve({ ok: false, status: 403 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const msgs = await fetchSlackMessages('2025-06-23', '2025-06-23')
    expect(msgs).toEqual([])
  })
})
