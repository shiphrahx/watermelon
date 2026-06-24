// Messaging panel — response-speed buckets from in-thread gaps.

import Panel from '../Panel.jsx'
import HBarChart from '../charts/HBarChart.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'

export default function ResponsePattern({ pattern }) {
  if (!pattern || !pattern.sufficient) {
    return (
      <Panel title="Response pattern">
        <p className="panel__empty">Not enough thread data to calculate response patterns.</p>
      </Panel>
    )
  }

  const rows = [
    { key: 'immediate', label: 'Immediate responses', pct: pattern.immediate, color: CATEGORY_COLORS.messaging },
    { key: 'considered', label: 'Considered responses', pct: pattern.considered, color: CATEGORY_COLORS.meetings },
    { key: 'async', label: 'Async responses', pct: pattern.async, color: CATEGORY_COLORS.focus },
  ].map((r) => ({ key: r.key, label: r.label, value: `${r.pct}%`, fillRatio: r.pct / 100, color: r.color }))

  return (
    <Panel title="Response pattern">
      <HBarChart rows={rows} />
      <p className="highlight-note">
        You respond immediately to {pattern.immediate}% of messages — this may be interrupting your
        focus time.
      </p>
    </Panel>
  )
}
