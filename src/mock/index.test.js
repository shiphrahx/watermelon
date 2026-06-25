import { describe, it, expect } from 'vitest'
import { USE_MOCK, getCalendarEvents, getTeamsMessages, getSlackMessages } from './index.js'
import { defaultSettings } from './settings.js'
import { datasetDays, dateKeyOf } from './generator.js'

const today = new Date()
const days = datasetDays(today)
const oldestKey = dateKeyOf(days[0])
const newestKey = dateKeyOf(days[days.length - 1])

describe('feature flag', () => {
  it('is in mock mode by default', () => {
    expect(USE_MOCK).toBe(true)
  })
})

describe('mock-mode routing', () => {
  it('getCalendarEvents resolves raw Graph events', async () => {
    const events = await getCalendarEvents(oldestKey, newestKey)
    expect(events.length).toBeGreaterThan(0)
    expect(events[0]).toHaveProperty('responseStatus')
  })

  it('getTeamsMessages resolves raw Graph chat messages', async () => {
    const msgs = await getTeamsMessages(oldestKey, newestKey)
    expect(msgs.length).toBeGreaterThan(0)
    expect(msgs[0]).toHaveProperty('createdDateTime')
  })

  it('getSlackMessages resolves raw Slack messages', async () => {
    const msgs = await getSlackMessages(oldestKey, newestKey)
    expect(msgs.length).toBeGreaterThan(0)
    expect(msgs[0]).toHaveProperty('ts')
  })
})

describe('defaultSettings', () => {
  it('has the documented shape', () => {
    expect(defaultSettings).toEqual({
      workingHours: { start: '09:00', end: '18:00' },
      connectedAccounts: { microsoft: false, slack: false },
      mockMode: true,
      cloudflareWorkerUrl: '',
    })
  })
})
