// Focus tab: focus time by day, best windows, block-size distribution,
// morning/afternoon split, consistency, and the longest focus block.

import { useMemo } from 'react'
import FocusByDay from '../panels/FocusByDay.jsx'
import FocusWindows from '../panels/FocusWindows.jsx'
import FocusBlockDistribution from '../panels/FocusBlockDistribution.jsx'
import MorningAfternoon from '../panels/MorningAfternoon.jsx'
import FocusConsistency from '../panels/FocusConsistency.jsx'
import LongestFocusBlock from '../panels/LongestFocusBlock.jsx'
import {
  focusBlockDistribution,
  morningAfternoonSplit,
  focusConsistency,
  longestFocusBlockInRange,
} from '../../analysis/focus.js'

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
    <div className="panels">
      <FocusByDay focusByDay={insights.focusByDay} onSelectDay={onSelectDay} />
      <FocusWindows focusWindows={insights.focusWindows} />
      <FocusBlockDistribution distribution={data.distribution} />
      <MorningAfternoon split={data.split} />
      <FocusConsistency consistency={data.consistency} workingStart={workingStart} workingEnd={workingEnd} />
      <LongestFocusBlock block={data.longest} />
    </div>
  )
}
