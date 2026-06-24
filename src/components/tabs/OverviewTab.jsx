// Overview tab: headline cards, time breakdown (with day-quality tags),
// end-of-day overrun, and the focus-rate sparkline.

import { useMemo } from 'react'
import InsightCards from '../InsightCards.jsx'
import TimeBreakdown from '../panels/TimeBreakdown.jsx'
import EndOfDayOverrun from '../panels/EndOfDayOverrun.jsx'
import FocusRateTrend from '../panels/FocusRateTrend.jsx'
import { dayQualityLabel, endOfDayOverrun, perDayFocusRate } from '../../analysis/overview.js'

export default function OverviewTab({ insights, trends, days, workingStart, workingEnd, onSelectDay }) {
  const qualityLabels = useMemo(() => {
    const map = {}
    for (const d of days) {
      const label = dayQualityLabel(d, workingStart, workingEnd)
      if (label) map[d.dateKey] = label
    }
    return map
  }, [days, workingStart, workingEnd])

  const overrun = useMemo(() => endOfDayOverrun(days, workingEnd), [days, workingEnd])
  const rateTrend = useMemo(
    () => perDayFocusRate(days, workingStart, workingEnd),
    [days, workingStart, workingEnd],
  )

  return (
    <>
      <InsightCards insights={insights} trends={trends} />
      <div className="panels">
        <TimeBreakdown perDay={insights.perDay} onSelectDay={onSelectDay} qualityLabels={qualityLabels} />
        <EndOfDayOverrun overrun={overrun} workingEnd={workingEnd} />
        <FocusRateTrend trend={rateTrend} />
      </div>
    </>
  )
}
