// Focus debt: the run of most-recent consecutive working days (with data) whose
// deep focus fell under the configured threshold.

export function computeFocusDebt(perDay = [], thresholdHours = 1) {
  const thresholdMinutes = thresholdHours * 60
  const active = perDay.filter((d) => d.isWeekday && d.hasData)
  let streak = 0
  for (let i = active.length - 1; i >= 0; i--) {
    if ((active[i].categories?.focus ?? 0) < thresholdMinutes) streak++
    else break
  }
  return { streak, thresholdHours }
}
