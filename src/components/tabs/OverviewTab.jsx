// Overview tab: headline cards, time breakdown (with day-quality tags) and
// end-of-day overrun. (The focus-rate trend sparkline was removed — the Focus
// Rate card's "vs last week" indicator already conveys that trend.)

import { useMemo } from 'react'
import InsightCards from '../InsightCards.jsx'
import GoalProgress from '../GoalProgress.jsx'
import Donut from '../charts/Donut.jsx'
import ProgressRing from '../charts/ProgressRing.jsx'
import TimeBreakdown from '../panels/TimeBreakdown.jsx'
import EndOfDayOverrun from '../panels/EndOfDayOverrun.jsx'
import { dayQualityLabel, endOfDayOverrun } from '../../analysis/overview.js'
import { computeGoalProgress } from '../../analysis/goal.js'
import { benchmarkWeek } from '../../analysis/benchmark.js'
import { computeFocusDebt } from '../../analysis/focusDebt.js'
import { getSettings } from '../../utils/settings.js'
import { getAllWeeks } from '../../storage/history.js'
import { isoWeekKey } from '../../utils/ranges.js'
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

const MINUTES_FIELD = {
  meeting: 'meetingMinutes',
  focus: 'focusMinutes',
  comms: 'messagingMinutes',
  shallow: 'shallowMinutes',
}

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

  async function handleExport() {
    try {
      // Lazy-load jsPDF so it stays out of the main bundle.
      const [{ exportWeeklyPdf }, { getRecentWeeks }] = await Promise.all([
        import('../../export/weeklyPdf.js'),
        import('../../storage/history.js'),
      ])
      // Export the full report across all tabs, not just Overview.
      exportWeeklyPdf({ insights, days, workingStart, workingEnd, weeks: getRecentWeeks(12) })
    } catch (err) {
      console.error(err)
      alert('Could not generate the PDF. Please try again.')
    }
  }

  const donutData = useMemo(() => {
    const total = CATEGORIES.reduce((a, k) => a + (insights[MINUTES_FIELD[k]] || 0), 0) || 1
    return CATEGORIES.map((k) => {
      const minutes = insights[MINUTES_FIELD[k]] || 0
      return {
        key: k,
        label: CATEGORY_LABELS[k],
        color: CATEGORY_COLORS[k],
        value: minutes,
        display: `${formatDuration(minutes)} · ${Math.round((minutes / total) * 100)}%`,
      }
    })
  }, [insights])

  return (
    <>
      <div className="overview__actions">
        <button onClick={handleExport}>Export PDF</button>
      </div>

      {/* stat row */}
      <InsightCards insights={insights} trends={trends} />

      {benchmark && <p className="benchmark">{benchmark}</p>}
      {focusDebt.streak >= 3 && (
        <p className="focus-debt">
          You've had {focusDebt.streak} days in a row with little deep focus — you may be due for a
          protected block.
        </p>
      )}

      {/* primary + secondary split */}
      <div className="split">
        <div className="hero">
          <ProgressRing pct={Math.round(insights.focusRate)} color={CATEGORY_COLORS.focus} size={132}>
            <span className="hero__ring-value">{Math.round(insights.focusRate)}%</span>
            <span className="hero__ring-label">focus rate</span>
          </ProgressRing>
          <Donut data={donutData} centerValue={formatDuration(insights.focusMinutes)} centerLabel="deep focus" />
        </div>
        <GoalProgress progress={goalProgress} />
      </div>

      {/* detail grid */}
      <div className="split">
        <TimeBreakdown perDay={insights.perDay} onSelectDay={onSelectDay} qualityLabels={qualityLabels} />
        <EndOfDayOverrun overrun={overrun} workingEnd={workingEnd} />
      </div>
    </>
  )
}
