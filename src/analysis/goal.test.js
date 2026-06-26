import { describe, it, expect } from 'vitest'
import { computeGoalProgress } from './goal.js'

// insights stub: focusMinutes + weekdayCount + perDay (for elapsed days)
function insights(focusMinutes, { weekdayCount = 5, elapsed = 5 } = {}) {
  const perDay = Array.from({ length: weekdayCount }, (_, i) => ({
    isWeekday: true,
    hasData: i < elapsed,
  }))
  return { focusMinutes, weekdayCount, perDay }
}

describe('computeGoalProgress', () => {
  it('returns null when no goal is set', () => {
    expect(computeGoalProgress(insights(600), '')).toBeNull()
    expect(computeGoalProgress(insights(600), 0)).toBeNull()
  })

  it('computes percentage toward the goal', () => {
    const p = computeGoalProgress(insights(810), 15) // 13h30m of 15h
    expect(p.goalMinutes).toBe(900)
    expect(p.pct).toBe(90)
  })

  it('marks Met when exactly at goal and Exceeded when beyond', () => {
    expect(computeGoalProgress(insights(900), 15).state).toBe('Met')
    expect(computeGoalProgress(insights(960), 15).state).toBe('Exceeded')
  })

  it('projects pace: On track when projection reaches the goal', () => {
    // 9h focus over 3 elapsed days -> projects 15h over 5 days == goal
    const p = computeGoalProgress(insights(540, { elapsed: 3 }), 15)
    expect(p.state).toBe('On track')
  })

  it('projects pace: Behind when projection falls short', () => {
    // 3h focus over 3 elapsed days -> projects 5h over 5 days < 15h goal
    const p = computeGoalProgress(insights(180, { elapsed: 3 }), 15)
    expect(p.state).toBe('Behind')
  })
})
