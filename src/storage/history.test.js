import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveWeek,
  getWeek,
  getAllWeeks,
  getRecentWeeks,
  clearHistory,
} from './history.js'

beforeEach(() => {
  localStorage.clear()
})

const summary = (focusMinutes) => ({ focusMinutes, focusRate: 50, perDay: [] })

describe('history store', () => {
  it('saves and reads a week, stamping the weekKey', () => {
    saveWeek('2026-W26', summary(600))
    const w = getWeek('2026-W26')
    expect(w.weekKey).toBe('2026-W26')
    expect(w.focusMinutes).toBe(600)
  })

  it('returns null for an unknown week', () => {
    expect(getWeek('1999-W01')).toBeNull()
  })

  it('overwrites an existing week on re-save', () => {
    saveWeek('2026-W26', summary(100))
    saveWeek('2026-W26', summary(200))
    expect(getWeek('2026-W26').focusMinutes).toBe(200)
    expect(getAllWeeks()).toHaveLength(1)
  })

  it('getAllWeeks returns weeks sorted oldest -> newest', () => {
    saveWeek('2026-W03', summary(1))
    saveWeek('2026-W01', summary(2))
    saveWeek('2026-W02', summary(3))
    expect(getAllWeeks().map((w) => w.weekKey)).toEqual(['2026-W01', '2026-W02', '2026-W03'])
  })

  it('getRecentWeeks returns the last n, oldest -> newest', () => {
    for (const k of ['2026-W01', '2026-W02', '2026-W03', '2026-W04']) saveWeek(k, summary(1))
    expect(getRecentWeeks(2).map((w) => w.weekKey)).toEqual(['2026-W03', '2026-W04'])
    expect(getRecentWeeks(10)).toHaveLength(4)
  })

  it('clearHistory wipes all stored weeks', () => {
    saveWeek('2026-W01', summary(1))
    clearHistory()
    expect(getAllWeeks()).toEqual([])
  })

  it('ignores an empty weekKey', () => {
    saveWeek('', summary(1))
    expect(getAllWeeks()).toEqual([])
  })

  it('survives corrupt storage by returning empty', () => {
    localStorage.setItem('watermelon.history', '{bad json')
    expect(getAllWeeks()).toEqual([])
  })
})
