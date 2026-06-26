// Weekly deep-focus goal progress and pace.
//
// Pace: project end-of-week focus from focus accrued so far over elapsed working
// days. If the projection reaches the goal -> "On track", else "Behind".
// If the goal is already reached -> "Met" (or "Exceeded" beyond it).

export function computeGoalProgress(insights, goalHours) {
  const goal = Number(goalHours)
  if (!insights || !goal || goal <= 0) return null

  const goalMinutes = goal * 60
  const focusMinutes = insights.focusMinutes
  const pct = Math.round((focusMinutes / goalMinutes) * 100)

  const totalWorkingDays = insights.weekdayCount || 5
  const elapsed =
    (insights.perDay || []).filter((d) => d.isWeekday && d.hasData).length || totalWorkingDays

  let state
  if (focusMinutes > goalMinutes) state = 'Exceeded'
  else if (focusMinutes === goalMinutes) state = 'Met'
  else {
    const projected = elapsed > 0 ? (focusMinutes / elapsed) * totalWorkingDays : 0
    state = projected >= goalMinutes ? 'On track' : 'Behind'
  }

  return { goalMinutes, focusMinutes, pct, state }
}
