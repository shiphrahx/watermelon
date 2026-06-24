// Meetings panel — average recovery time between meetings + distribution.

import Panel from '../Panel.jsx'
import HBarChart from '../charts/HBarChart.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'

export default function RecoveryTime({ recovery }) {
  const { averageGapMinutes = 0, distribution = {}, totalGaps = 0 } = recovery || {}
  const max = Math.max(1, distribution.under10 || 0, distribution.between || 0, distribution.over30 || 0)

  const rows = [
    { key: 'under10', label: 'Under 10 min', n: distribution.under10 || 0 },
    { key: 'between', label: '10–30 min', n: distribution.between || 0 },
    { key: 'over30', label: 'Over 30 min', n: distribution.over30 || 0 },
  ].map((r) => ({
    key: r.key,
    label: r.label,
    value: `${r.n} ${r.n === 1 ? 'gap' : 'gaps'}`,
    fillRatio: r.n / max,
    color: CATEGORY_COLORS.adhoc,
  }))

  return (
    <Panel
      title="Average recovery time"
      isEmpty={totalGaps === 0}
      emptyMessage="No gaps between meetings this period."
    >
      <div className="headline-explain" style={{ marginTop: 0 }}>
        Average gap between meetings: <strong>{averageGapMinutes} minutes</strong>
      </div>
      <HBarChart rows={rows} />
    </Panel>
  )
}
