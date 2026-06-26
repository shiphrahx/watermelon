// Weekly deep-focus goal progress bar + pace state. Renders nothing when no
// goal is set.

import { CATEGORY_COLORS } from '../analysis/classify.js'
import { formatDuration } from '../utils/time.js'

const STATE_CLASS = {
  'On track': 'goal--ontrack',
  Behind: 'goal--behind',
  Met: 'goal--met',
  Exceeded: 'goal--met',
}

export default function GoalProgress({ progress }) {
  if (!progress) return null
  const { goalMinutes, focusMinutes, pct, state } = progress
  const width = Math.min(100, pct)

  return (
    <div className={`goal ${STATE_CLASS[state] || ''}`}>
      <div className="goal__head">
        <span className="goal__label">Weekly focus goal</span>
        <span className={`goal__state goal__state--${state.replace(/\s+/g, '-').toLowerCase()}`}>
          {state}
        </span>
      </div>
      <div className="goal__bar">
        <div
          className="goal__fill"
          style={{ width: `${width}%`, backgroundColor: CATEGORY_COLORS.focus }}
        />
      </div>
      <div className="goal__caption">
        {formatDuration(focusMinutes)} of {formatDuration(goalMinutes)} goal — {pct}%
      </div>
    </div>
  )
}
