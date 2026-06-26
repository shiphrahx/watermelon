// Weekly deep-focus goal as a progress ring + pace state. Nothing when no goal.

import ProgressRing from './charts/ProgressRing.jsx'
import { CATEGORY_COLORS } from '../analysis/classify.js'
import { formatDuration } from '../utils/time.js'

export default function GoalProgress({ progress }) {
  if (!progress) return null
  const { goalMinutes, focusMinutes, pct, state } = progress

  return (
    <div className="goal2">
      <ProgressRing pct={pct} color={CATEGORY_COLORS.focus} size={108}>
        <span className="goal2__pct">{pct}%</span>
      </ProgressRing>
      <div className="goal2__body">
        <div className="goal2__head">
          <span className="goal2__label">Weekly focus goal</span>
          <span className={`goal__state goal__state--${state.replace(/\s+/g, '-').toLowerCase()}`}>
            {state}
          </span>
        </div>
        <div className="goal2__caption">
          {formatDuration(focusMinutes)} of {formatDuration(goalMinutes)}
        </div>
      </div>
    </div>
  )
}
