// Focus panel — morning vs afternoon focus split as a donut (lunch excluded).

import Panel from '../Panel.jsx'
import Donut from '../charts/Donut.jsx'
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

  const data = [
    {
      key: 'morning',
      label: 'Morning (09:00–12:00)',
      color: CATEGORY_COLORS.focus,
      value: morningMinutes,
      display: `${morningPct}% · ${formatDuration(morningMinutes)}`,
    },
    {
      key: 'afternoon',
      label: 'Afternoon (13:00–18:00)',
      color: '#9ad9bb',
      value: afternoonMinutes,
      display: `${afternoonPct}% · ${formatDuration(afternoonMinutes)}`,
    },
  ]

  const label =
    better === 'morning'
      ? 'You focus better in the mornings.'
      : better === 'afternoon'
        ? 'You focus better in the afternoons.'
        : null

  return (
    <Panel
      title="Morning vs afternoon"
      hint="Total focus time by time of day (lunch excluded)"
      isEmpty={morningMinutes + afternoonMinutes === 0}
      emptyMessage="No focus blocks detected — try a wider date range."
    >
      <Donut
        data={data}
        centerValue={`${Math.max(morningPct, afternoonPct)}%`}
        centerLabel={better === 'afternoon' ? 'afternoon' : 'morning'}
      />
      {lunchMinutes > 0 && (
        <p className="panel__hint" style={{ marginBottom: 0 }}>
          Lunch (12:00–13:00): {formatDuration(lunchMinutes)} excluded.
        </p>
      )}
      {label && <p className="highlight-note">{label}</p>}
    </Panel>
  )
}
