// Meetings panel — distribution of gaps between accepted meetings as a donut.
// The "too short to use" slice is highlighted in amber via the summary line.

import Panel from '../Panel.jsx'
import Donut from '../charts/Donut.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

const COLORS = {
  tooShort: CATEGORY_COLORS.messaging, // amber — draw attention
  short: '#A8C5E8',
  comfortable: CATEGORY_COLORS.meeting,
  long: CATEGORY_COLORS.focus,
}

export default function InterMeetingGaps({ gaps }) {
  const { buckets = [], totalGaps = 0, tooShortCount = 0, tooShortMinutes = 0 } = gaps || {}

  const data = buckets.map((b) => ({
    key: b.key,
    label: b.label,
    color: COLORS[b.key] || CATEGORY_COLORS.meeting,
    value: b.count,
    display: `${b.count} · ${formatDuration(b.minutes)}`,
  }))

  return (
    <Panel
      title="Inter-meeting gaps"
      hint="Gaps between your accepted meetings, by how usable they are"
      isEmpty={totalGaps === 0}
      emptyMessage="No gaps between meetings this period."
    >
      <Donut data={data} centerValue={totalGaps} centerLabel="gaps" />
      <p className="highlight-note" style={{ color: CATEGORY_COLORS.messaging }}>
        {tooShortCount} {tooShortCount === 1 ? 'gap was' : 'gaps were'} too short to use, costing you{' '}
        {formatDuration(tooShortMinutes)} of recoverable time.
      </p>
    </Panel>
  )
}
