// Focus panel — morning vs afternoon focus split (lunch shown separately).

import Panel from '../Panel.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

export default function MorningAfternoon({ split }) {
  const {
    morningMinutes = 0,
    afternoonMinutes = 0,
    lunchMinutes = 0,
    morningPct = 0,
    afternoonPct = 0,
    better,
  } = split || {}

  const label =
    better === 'morning'
      ? 'You focus better in the mornings.'
      : better === 'afternoon'
        ? 'You focus better in the afternoons.'
        : null

  return (
    <Panel
      title="Morning vs afternoon split"
      hint="Total focus time across the selected period, split by time of day"
      isEmpty={morningMinutes + afternoonMinutes === 0}
      emptyMessage="No focus blocks detected — try a wider date range."
    >
      <div className="split-bar">
        <div className="split-bar__seg" style={{ width: `${morningPct}%`, backgroundColor: CATEGORY_COLORS.focus }} />
        <div className="split-bar__seg" style={{ width: `${afternoonPct}%`, backgroundColor: CATEGORY_COLORS.adhoc }} />
      </div>
      <div className="split-row">
        <span>Morning (09:00–12:00)</span>
        <span className="muted">{morningPct}%</span>
        <span>{formatDuration(morningMinutes)}</span>
      </div>
      <div className="split-row">
        <span>Afternoon (13:00–18:00)</span>
        <span className="muted">{afternoonPct}%</span>
        <span>{formatDuration(afternoonMinutes)}</span>
      </div>
      <p className="panel__hint" style={{ marginBottom: 0 }}>
        Lunch (12:00–13:00){lunchMinutes > 0 ? `: ${formatDuration(lunchMinutes)} of focus` : ''} is
        excluded from the split.
      </p>
      {label && <p className="highlight-note">{label}</p>}
    </Panel>
  )
}
