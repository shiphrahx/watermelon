import { describe, it, expect, beforeEach } from 'vitest'
import { getSettings, saveSettings, getSlackProxyUrl } from './settings.js'

beforeEach(() => {
  localStorage.clear()
})

describe('getSettings', () => {
  it('returns defaults when nothing is stored', () => {
    const s = getSettings()
    expect(s.workingHoursStart).toBe('09:00')
    expect(s.workingHoursEnd).toBe('18:00')
    expect(s).toHaveProperty('slackProxyUrl')
  })

  it('merges stored values over defaults', () => {
    localStorage.setItem('watermelon.settings', JSON.stringify({ workingHoursStart: '08:00' }))
    const s = getSettings()
    expect(s.workingHoursStart).toBe('08:00')
    expect(s.workingHoursEnd).toBe('18:00') // still default
  })

  it('falls back to defaults on corrupt JSON', () => {
    localStorage.setItem('watermelon.settings', '{not json')
    expect(getSettings().workingHoursStart).toBe('09:00')
  })
})

describe('saveSettings', () => {
  it('persists a partial update and returns the merged result', () => {
    const next = saveSettings({ workingHoursEnd: '17:00' })
    expect(next.workingHoursEnd).toBe('17:00')
    expect(getSettings().workingHoursEnd).toBe('17:00')
    expect(getSettings().workingHoursStart).toBe('09:00')
  })

  it('accumulates across multiple saves', () => {
    saveSettings({ workingHoursStart: '08:30' })
    saveSettings({ slackProxyUrl: 'https://proxy.example.dev' })
    const s = getSettings()
    expect(s.workingHoursStart).toBe('08:30')
    expect(s.slackProxyUrl).toBe('https://proxy.example.dev')
  })
})

describe('getSlackProxyUrl', () => {
  it('reflects the saved proxy URL', () => {
    saveSettings({ slackProxyUrl: 'https://hook.example.dev' })
    expect(getSlackProxyUrl()).toBe('https://hook.example.dev')
  })
  it('returns an empty string when unset', () => {
    saveSettings({ slackProxyUrl: '' })
    expect(getSlackProxyUrl()).toBe('')
  })
})
