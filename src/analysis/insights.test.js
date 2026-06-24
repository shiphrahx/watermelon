import { describe, it, expect } from 'vitest'
import {
  computeInsights,
  computeDayInsight,
  trend,
  computeTrends,
  weeklySummarySentence,
  dailySummarySentence,
  weekdayName,
} from './insights.js'
import { buildDayBlocks } from '../utils/time.js'

// Build a controlled day: cats is an 18-element array of category keys for the
// 09:00–18:00 working day (18 × 30-min blocks).
function makeDay(dateKey, cats, { events = [], messages = [] } = {}) {
  const blocks = buildDayBlocks(dateKey, '09:00', '18:00').map((b, i) => ({
    ...b,
    category: cats[i] || 'focus',
  }))
  return { dateKey, blocks, events, messages }
}

function ev(subject, dateKey, startHHMM, endHHMM) {
  return {
    subject,
    start: new Date(`${dateKey}T${startHHMM}:00`),
    end: new Date(`${dateKey}T${endHHMM}:00`),
  }
}

// A representative Monday:
//  09:00-10:00 meeting | 10:00-12:00 focus | 12:00-12:30 comms |
//  12:30-13:00 adhoc   | 13:00-18:00 focus
const MON = '2025-06-23'
const cats = [
  'meeting', 'meeting',
  'focus', 'focus', 'focus', 'focus',
  'comms', 'possible-adhoc',
  'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus',
]
const events = [
  ev('Weekly team standup', MON, '09:00', '09:30'),
  ev('Weekly team standup', MON, '09:30', '10:00'),
  ev('Sprint planning', MON, '14:00', '15:00'),
  ev('1:1 with manager', MON, '15:00', '15:30'),
]

describe('weekdayName', () => {
  it('maps a date key to its weekday', () => {
    expect(weekdayName('2025-06-23')).toBe('Monday')
    expect(weekdayName('2025-06-28')).toBe('Saturday')
  })
})

describe('computeInsights', () => {
  const days = [
    makeDay(MON, cats, { events }),
    makeDay('2025-06-28', Array(18).fill('meeting')), // Saturday — must be ignored
  ]
  const insights = computeInsights({ days, workingStart: '09:00', workingEnd: '18:00' })

  it('excludes weekend days from working-day count', () => {
    expect(insights.weekdayCount).toBe(1)
  })

  it('sums minutes per category (weekdays only)', () => {
    expect(insights.meetingMinutes).toBe(60)
    expect(insights.focusMinutes).toBe(420)
    expect(insights.messagingMinutes).toBe(30)
    expect(insights.adhocMinutes).toBe(30)
  })

  it('computes focus rate against total working minutes', () => {
    // 420 / 540 * 100
    expect(insights.focusRate).toBeCloseTo(77.78, 1)
    expect(insights.totalWorkingMinutes).toBe(540)
  })

  it('identifies busiest and most-focused days', () => {
    expect(insights.busiestDay.dateKey).toBe(MON)
    expect(insights.busiestDay.minutes).toBe(60)
    expect(insights.mostFocusedDay.weekday).toBe('Monday')
    expect(insights.mostFocusedDay.minutes).toBe(420)
  })

  it('builds per-day breakdown flagging weekends/no-data', () => {
    const sat = insights.perDay.find((d) => d.dateKey === '2025-06-28')
    expect(sat.isWeekday).toBe(false)
    expect(sat.hasData).toBe(false)
    const mon = insights.perDay.find((d) => d.dateKey === MON)
    expect(mon.hasData).toBe(true)
    expect(mon.categories.meeting).toBe(60)
  })

  it('computes the best focus window', () => {
    expect(insights.focusWindows.top.label).toBe('10:00–11:00')
    expect(insights.focusWindows.top.avgFocusMinutes).toBe(60)
    // one slot per working hour
    expect(insights.focusWindows.slots).toHaveLength(9)
  })

  it('computes focus-by-day with the best day', () => {
    expect(insights.focusByDay.best.dateKey).toBe(MON)
    expect(insights.focusByDay.best.focusMinutes).toBe(420)
  })

  it('ranks top time consumers by total duration, max 5', () => {
    const top = insights.topConsumers
    expect(top.length).toBeLessThanOrEqual(5)
    const standup = top.find((t) => t.subject === 'Weekly team standup')
    expect(standup.minutes).toBe(60) // two 30-min instances merged
    const planning = top.find((t) => t.subject === 'Sprint planning')
    expect(planning.minutes).toBe(60)
    // sorted descending
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].minutes).toBeGreaterThanOrEqual(top[i].minutes)
    }
  })

  it('handles an all-weekend (no working days) range without dividing by zero', () => {
    const weekendOnly = computeInsights({
      days: [makeDay('2025-06-28', Array(18).fill('focus'))],
      workingStart: '09:00',
      workingEnd: '18:00',
    })
    expect(weekendOnly.focusRate).toBe(0)
    expect(weekendOnly.totalWorkingMinutes).toBe(0)
  })
})

describe('trend', () => {
  it('detects an increase', () => {
    expect(trend(100, 50)).toEqual({ direction: 'up', deltaPct: 100 })
  })
  it('detects a decrease', () => {
    const t = trend(50, 100)
    expect(t.direction).toBe('down')
    expect(t.deltaPct).toBeCloseTo(-50)
  })
  it('treats a tiny change as flat', () => {
    expect(trend(100, 100).direction).toBe('flat')
  })
  it('handles a missing baseline', () => {
    expect(trend(10, 0)).toEqual({ direction: 'up', deltaPct: null })
  })
  it('is flat when both are zero', () => {
    expect(trend(0, 0)).toEqual({ direction: 'flat', deltaPct: 0 })
  })
  it('computeTrends compares the headline metrics', () => {
    const cur = { focusMinutes: 100, meetingMinutes: 200, focusRate: 40 }
    const prev = { focusMinutes: 50, meetingMinutes: 200, focusRate: 30 }
    const trends = computeTrends(cur, prev)
    expect(trends.focusMinutes.direction).toBe('up')
    expect(trends.meetingMinutes.direction).toBe('flat')
    expect(trends.focusRate.direction).toBe('up')
  })
})

describe('computeDayInsight', () => {
  const day = makeDay(MON, cats, {
    events,
    messages: [{ timestamp: new Date(`${MON}T08:52:00`).getTime() }],
  })
  const di = computeDayInsight(day, '09:00', '18:00')

  it('computes the day focus rate', () => {
    expect(di.focusRate).toBeCloseTo(77.78, 1)
  })

  it('finds the longest focus block with its start', () => {
    // 13:00–18:00 = 300 min run, starting at minute 780 (13:00)
    expect(di.longestFocusBlock.minutes).toBe(300)
    expect(di.longestFocusBlock.startMinute).toBe(13 * 60)
  })

  it('reports the first message and flags an early start', () => {
    expect(di.firstMessage.label).toBe('08:52')
    expect(di.firstMessage.beforeWorkStart).toBe(true)
  })

  it('handles a day with no messages', () => {
    const di2 = computeDayInsight(makeDay(MON, cats), '09:00', '18:00')
    expect(di2.firstMessage).toBeNull()
  })
})

describe('weeklySummarySentence', () => {
  const base = {
    focusMinutes: 380,
    meetingMinutes: 180,
    totalWorkingMinutes: 540,
    focusWindows: { top: { label: '10:00–11:00' } },
    mostFocusedDay: { weekday: 'Wednesday' },
  }

  it('uses the meeting-heavy template below 20% focus', () => {
    const s = weeklySummarySentence({ ...base, focusRate: 10, focusMinutes: 60, meetingMinutes: 1080 })
    expect(s).toMatch(/meeting-heavy/i)
  })

  it('uses the light template above 50% focus', () => {
    const s = weeklySummarySentence({ ...base, focusRate: 70 })
    expect(s).toMatch(/light on meetings/i)
  })

  it('uses the default template in between', () => {
    const s = weeklySummarySentence({ ...base, focusRate: 35 })
    expect(s).toMatch(/best window was 10:00–11:00/)
    expect(s).toMatch(/Wednesday/)
  })

  it('never leaks raw category keys', () => {
    for (const rate of [10, 35, 70]) {
      const s = weeklySummarySentence({ ...base, focusRate: rate })
      expect(s).not.toMatch(/comms|possible-adhoc/)
    }
  })
})

describe('dailySummarySentence', () => {
  it('uses a focused template for a high-focus day', () => {
    const s = dailySummarySentence({
      weekday: 'Tuesday',
      focusMinutes: 360,
      meetingMinutes: 30,
      focusRate: 66,
      longestFocusBlock: { minutes: 120, startMinute: 600 },
    })
    expect(s).toMatch(/focused Tuesday/i)
  })

  it('uses a meeting-heavy template for a low-focus day', () => {
    const s = dailySummarySentence({
      weekday: 'Monday',
      focusMinutes: 30,
      meetingMinutes: 360,
      focusRate: 5,
      longestFocusBlock: null,
    })
    expect(s).toMatch(/meeting-heavy/i)
  })

  it('handles an empty day', () => {
    const s = dailySummarySentence({
      weekday: 'Friday',
      focusMinutes: 0,
      meetingMinutes: 0,
      focusRate: 0,
      longestFocusBlock: null,
    })
    expect(s).toMatch(/No tracked activity/i)
  })
})
