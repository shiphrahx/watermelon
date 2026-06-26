import { describe, it, expect, vi } from 'vitest'

// Avoid loading MSAL at import time; these are unused in mock mode anyway.
vi.mock('../auth/microsoft.js', () => ({ isMicrosoftConnected: () => false }))
vi.mock('../auth/slack.js', () => ({ isSlackConnected: () => false }))

import { loadReport, NoConnectionError } from './loadReport.js'
import { datasetDays, dateKeyOf } from '../mock/generator.js'

describe('loadReport (mock mode)', () => {
  it('assembles a report for the requested range from mock data', async () => {
    const days = datasetDays(new Date())
    const key = dateKeyOf(days[days.length - 1]) // a populated working day
    const report = await loadReport(key, key)

    expect(report.days).toHaveLength(1)
    expect(report.days[0].dateKey).toBe(key)
    expect(report.days[0].blocks).toHaveLength(18) // 09:00–18:00 default working hours
    expect(report).toHaveProperty('summary')
    // mock data should yield some activity on a working day
    expect(report.days[0].events.length + report.days[0].messages.length).toBeGreaterThan(0)
  })

  it('NoConnectionError carries the connect-accounts message', () => {
    const err = new NoConnectionError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toMatch(/Connect Microsoft or Slack/)
  })
})
