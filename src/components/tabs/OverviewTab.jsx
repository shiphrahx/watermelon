// Overview tab: headline cards, time breakdown (with day-quality tags) and
// end-of-day overrun. (The focus-rate trend sparkline was removed — the Focus
// Rate card's "vs last week" indicator already conveys that trend.)

import { useMemo } from 'react'
import InsightCards from '../InsightCards.jsx'
import GoalProgress from '../GoalProgress.jsx'
import TimeBreakdown from '../panels/TimeBreakdown.jsx'
import EndOfDayOverrun from '../panels/EndOfDayOverrun.jsx'
import { dayQualityLabel, endOfDayOverrun } from '../../analysis/overview.js'
import { computeGoalProgress } from '../../analysis/goal.js'
import { benchmarkWeek } from '../../analysis/benchmark.js'
import { computeFocusDebt } from '../../analysis/focusDebt.js'
import { getSettings } from '../../utils/settings.js'
import { getAllWeeks } from '../../storage/history.js'
import { isoWeekKey } from '../../utils/ranges.js'

export default function OverviewTab({ insights, trends, days, workingStart, workingEnd, onSelectDay }) {
  const settings = getSettings()

  const qualityLabels = useMemo(() => {
    const map = {}
    for (const d of days) {
      const label = dayQualityLabel(d, workingStart, workingEnd)
      if (label) map[d.dateKey] = label
    }
    return map
  }, [days, workingStart, workingEnd])

  const overrun = useMemo(() => endOfDayOverrun(days, workingEnd), [days, workingEnd])
  const goalProgress = useMemo(
    () => computeGoalProgress(insights, settings.focusGoalHours),
    [insights, settings.focusGoalHours],
  )

  const benchmark = useMemo(() => {
    if (!days.length) return null
    return benchmarkWeek(getAllWeeks(), isoWeekKey(days[0].dateKey))
  }, [days])

  const focusDebt = useMemo(
    () => computeFocusDebt(insights.perDay, Number(settings.lowFocusThresholdHours) || 1),
    [insights.perDay, settings.lowFocusThresholdHours],
  )

  return (
    <>
      <InsightCards insights={insights} trends={trends} />
      {benchmark && <p className="benchmark">{benchmark}</p>}
      {focusDebt.streak >= 3 && (
        <p className="focus-debt">
          You've had {focusDebt.streak} days in a row with little deep focus — you may be due for a
          protected block.
        </p>
      )}
      <GoalProgress progress={goalProgress} />
      <div className="panels">
        <TimeBreakdown perDay={insights.perDay} onSelectDay={onSelectDay} qualityLabels={qualityLabels} />
        <EndOfDayOverrun overrun={overrun} workingEnd={workingEnd} />
      </div>
    </>
  )
}
