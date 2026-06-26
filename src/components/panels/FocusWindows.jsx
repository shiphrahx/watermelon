// Focus panel — average focus per 1-hour slot. Bars greyed; best slot in accent;
// exact averages on hover.

import Panel from '../Panel.jsx'
import HBarChart from '../charts/HBarChart.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'

export default function FocusWindows({ focusWindows }) {
  const slots = focusWindows?.slots || []
  const top = focusWindows?.top
  const max = Math.max(1, ...slots.map((s) => s.avgFocusMinutes))

  const rows = slots.map((s) => {
    const isBest = top && s.startMinute === top.startMinute
    return {
      key: s.startMinute,
      label: s.label,
      fillRatio: s.avgFocusMinutes / max,
      muted: !isBest,
      color: isBest ? CATEGORY_COLORS.focus : undefined,
      highlight: isBest,
      tooltip: `${s.label} · avg ${Math.round(s.avgFocusMinutes)} min focus`,
    }
  })

  return (
    <Panel
      title="Best focus windows"
      hint="Average focus time per hour across the selected period"
      isEmpty={!top}
      emptyMessage="No focus blocks detected — try a longer date range."
    >
      <HBarChart rows={rows} hideValues />
      {top && (
        <p className="highlight-note">
          Your best focus window is {top.label} on average across this week.
        </p>
      )}
    </Panel>
  )
}
