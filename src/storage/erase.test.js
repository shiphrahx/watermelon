import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../auth/slack.js', () => ({ logoutSlack: vi.fn() }))

import { eraseLocalData } from './erase.js'
import { logoutSlack } from '../auth/slack.js'
import { saveWeek, getAllWeeks } from './history.js'
import { saveCorrection, getDayCorrections } from './corrections.js'

beforeEach(() => {
  localStorage.clear()
  logoutSlack.mockClear()
})

describe('eraseLocalData', () => {
  it('clears history, corrections, settings, privacy flag and signs out Slack', () => {
    saveWeek('2026-W01', { focusRate: 50 })
    saveCorrection('2025-06-23', 540, 'meeting')
    localStorage.setItem('watermelon.settings', JSON.stringify({ focusGoalHours: 15 }))
    localStorage.setItem('watermelon.privacyNoticeDismissed', '1')

    eraseLocalData()

    expect(getAllWeeks()).toEqual([])
    expect(getDayCorrections('2025-06-23')).toEqual({})
    expect(localStorage.getItem('watermelon.settings')).toBeNull()
    expect(localStorage.getItem('watermelon.privacyNoticeDismissed')).toBeNull()
    expect(logoutSlack).toHaveBeenCalled()
  })
})
