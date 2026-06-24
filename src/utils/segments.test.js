import { describe, it, expect } from 'vitest'
import { mergeBlocksIntoSegments } from './segments.js'
import { buildDayBlocks } from './time.js'

const KEY = '2025-06-23'

function blocksFrom(cats) {
  return buildDayBlocks(KEY, '09:00', '18:00').map((b, i) => ({
    ...b,
    category: cats[i] || 'focus',
  }))
}

describe('mergeBlocksIntoSegments', () => {
  it('merges consecutive same-category blocks', () => {
    const cats = ['meeting', 'meeting', 'focus', 'focus', 'focus']
    const blocks = blocksFrom(cats).slice(0, 5)
    const segs = mergeBlocksIntoSegments(blocks)
    expect(segs).toHaveLength(2)
    expect(segs[0]).toMatchObject({ category: 'meeting', minutes: 60 })
    expect(segs[1]).toMatchObject({ category: 'focus', minutes: 90 })
  })

  it('keeps adjacent segments of different categories separate', () => {
    const blocks = blocksFrom(['meeting', 'focus', 'meeting']).slice(0, 3)
    const segs = mergeBlocksIntoSegments(blocks)
    expect(segs.map((s) => s.category)).toEqual(['meeting', 'focus', 'meeting'])
  })

  it('annotates meeting segments with the overlapping event title', () => {
    const blocks = blocksFrom(['meeting', 'meeting', 'focus']).slice(0, 3)
    const events = [
      {
        subject: 'Daily standup',
        start: new Date(`${KEY}T09:00:00`),
        end: new Date(`${KEY}T10:00:00`),
      },
    ]
    const segs = mergeBlocksIntoSegments(blocks, { events, dateKey: KEY })
    expect(segs[0].title).toBe('Daily standup')
    expect(segs[1].title).toBeUndefined() // focus segment has no title
  })

  it('leaves the title null when no event overlaps', () => {
    const blocks = blocksFrom(['meeting']).slice(0, 1)
    const segs = mergeBlocksIntoSegments(blocks, { events: [], dateKey: KEY })
    expect(segs[0].title).toBeNull()
  })

  it('returns an empty array for no blocks', () => {
    expect(mergeBlocksIntoSegments([])).toEqual([])
  })
})
