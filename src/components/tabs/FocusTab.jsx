// Focus tab: stat row, primary+secondary split, then detail grid.

import { useMemo } from 'react'
import FocusByDay from '../panels/FocusByDay.jsx'
import FocusWindows from '../panels/FocusWindows.jsx'
import FocusBlockDistribution from '../panels/FocusBlockDistribution.jsx'
import MorningAfternoon from '../panels/MorningAfternoon.jsx'
import FocusConsistency from '../panels/FocusConsistency.jsx'
import LongestFocusBlock from '../panels/LongestFocusBlock.jsx'
import KpiCard from '../ui/KpiCard.jsx'
import {
  focusBlockDistribution,
  morningAfternoonSplit,
  focusConsistency,
  longestFocusBlockInRange,
} from '../../analysis/focus.js'
import { formatDuration } from '../../utils/time.js'

export default function FocusTab({ insights, days, workingStart, workingEnd, onSelectDay }) {
  const data = useMemo(
    () => ({
      distribution: focusBlockDistribution(days),
      split: morningAfternoonSplit(days),
      consistency: focusConsistency(days),
      longest: longestFocusBlockInRange(days),
    }),
    [days],
  )

  return (
    <>
      <div className="insight-cards">
        <KpiCard icon="🧠" label="Best focus day" small value={insights.focusByDay?.best?.weekday || '—'} />
        <KpiCard icon="⏱️" label="Longest block" small value={data.longest ? formatDuration(data.longest.minutes) : '—'} />
        <KpiCard icon="🧱" label="Focus blocks" value={data.distribution.totalBlocks} />
      </div>
      <div className="split">
        <FocusByDay focusByDay={insights.focusByDay} onSelectDay={onSelectDay} />
        <FocusWindows focusWindows={insights.focusWindows} />
      </div>
      <div className="panels">
        <FocusBlockDistribution distribution={data.distribution} />
        <MorningAfternoon split={data.split} />
        <FocusConsistency consistency={data.consistency} workingStart={workingStart} workingEnd={workingEnd} />
        <LongestFocusBlock block={data.longest} />
      </div>
    </>
  )
}
