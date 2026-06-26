import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDayCorrections,
  saveCorrection,
  clearDayCorrections,
  clearAllCorrections,
  applyCorrections,
} from './corrections.js'

beforeEach(() => localStorage.clear())

const blocks = [
  { startMinute: 540, category: 'focus' },
  { startMinute: 570, category: 'focus' },
]

describe('corrections store', () => {
  it('saves and reads a per-day correction', () => {
    saveCorrection('2025-06-23', 540, 'meeting')
    expect(getDayCorrections('2025-06-23')).toEqual({ 540: 'meeting' })
  })

  it('applyCorrections overrides matching blocks and flags them', () => {
    saveCorrection('2025-06-23', 540, 'meeting')
    const out = applyCorrections(blocks, '2025-06-23')
    expect(out[0]).toMatchObject({ startMinute: 540, category: 'meeting', corrected: true })
    expect(out[1]).toMatchObject({ startMinute: 570, category: 'focus' })
    expect(out[1].corrected).toBeUndefined()
  })

  it('returns blocks unchanged when there are no corrections', () => {
    expect(applyCorrections(blocks, '2025-06-23')).toBe(blocks)
  })

  it('clears a single day', () => {
    saveCorrection('2025-06-23', 540, 'meeting')
    saveCorrection('2025-06-24', 600, 'comms')
    clearDayCorrections('2025-06-23')
    expect(getDayCorrections('2025-06-23')).toEqual({})
    expect(getDayCorrections('2025-06-24')).toEqual({ 600: 'comms' })
  })

  it('clears everything', () => {
    saveCorrection('2025-06-23', 540, 'meeting')
    clearAllCorrections()
    expect(getDayCorrections('2025-06-23')).toEqual({})
  })
})
