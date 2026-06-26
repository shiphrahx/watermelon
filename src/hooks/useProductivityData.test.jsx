import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { buildDayBlocks } from '../utils/time.js'

// Mock the data loader so the hooks are exercised without network / MSAL.
vi.mock('../data/loadReport.js', () => {
  class NoConnectionError extends Error {}
  return {
    NoConnectionError,
    loadReport: vi.fn(),
  }
})

import { useDashboardData, useDayReport } from './useProductivityData.js'
import { loadReport, NoConnectionError } from '../data/loadReport.js'

function makeReport(dateKey) {
  const blocks = buildDayBlocks(dateKey, '09:00', '18:00').map((b, i) => ({
    ...b,
    category: i < 2 ? 'meeting' : 'focus',
  }))
  return {
    days: [{ dateKey, blocks, events: [], messages: [] }],
    summary: {},
    events: [],
    messages: [],
  }
}

beforeEach(() => {
  loadReport.mockReset()
})

describe('useDayReport', () => {
  it('loads a day and computes a day insight', async () => {
    loadReport.mockImplementation((s) => Promise.resolve(makeReport(s)))
    const { result } = renderHook(() => useDayReport('2025-06-23'))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.day.dateKey).toBe('2025-06-23')
    expect(result.current.dayInsight.meetingMinutes).toBe(60) // 2 meeting blocks
  })

  it('surfaces a generic error message on failure', async () => {
    loadReport.mockImplementation(() => Promise.reject(new Error('boom')))
    const { result } = renderHook(() => useDayReport('2025-06-23'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/Couldn't load this data/)
  })
})

describe('useDashboardData', () => {
  it('loads current + previous period and computes insights and trends', async () => {
    loadReport.mockImplementation((s) => Promise.resolve(makeReport(s)))
    const range = { startKey: '2025-06-23', endKey: '2025-06-23' }
    const { result } = renderHook(() => useDashboardData(range))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(result.current.insights).toBeTruthy()
    expect(result.current.trends).toHaveProperty('focusMinutes')
    // loadReport called for both the current and the previous-week range
    expect(loadReport.mock.calls.length).toBe(2)
  })

  it('shows the connect message for a NoConnectionError', async () => {
    loadReport.mockImplementation(() => Promise.reject(new NoConnectionError('Connect Microsoft or Slack in Settings to see your report.')))
    const range = { startKey: '2025-06-23', endKey: '2025-06-23' }
    const { result } = renderHook(() => useDashboardData(range))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/Connect Microsoft or Slack/)
  })
})
