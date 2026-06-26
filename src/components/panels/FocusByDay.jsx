// Panel 4 — Focus time by day: total deep-focus hours per day, highlighting the
// best focus day. Clicking a bar navigates to that day's view.

import Panel from '../Panel.jsx'
import HBarChart from '../charts/HBarChart.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

export default function FocusByDay({ focusByDay, onSelectDay }) {
  const bars = focusByDay?.bars || []
  const best = focusByDay?.best
  const max = Math.max(1, ...bars.map((b) => b.focusMinutes))
  const isEmpty = bars.length === 0 || bars.every((b) => b.focusMinutes === 0)

  const rows = bars.map((b) => {
    const isBest = best && b.dateKey === best.dateKey
    return {
      key: b.dateKey,
      label: b.weekday,
      onClick: onSelectDay ? () => onSelectDay(b.dateKey) : undefined,
      fillRatio: b.focusMinutes / max,
      muted: !isBest,
      color: isBest ? CATEGORY_COLORS.focus : undefined,
      highlight: isBest,
      tooltip: `${b.weekday} · ${b.focusMinutes > 0 ? formatDuration(b.focusMinutes) : 'no focus'}`,
    }
  })

  return (
    <Panel
      title="Focus time by day"
      hint="Spot patterns across the week"
      isEmpty={isEmpty}
      emptyMessage="No focus blocks detected — try a longer date range."
    >
      <HBarChart rows={rows} hideValues />
      {best && <p className="highlight-note">Best focus day: {best.weekday}</p>}
    </Panel>
  )
}
