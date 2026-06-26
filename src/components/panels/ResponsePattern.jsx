// Messaging panel — response-speed split as a donut.

import Panel from '../Panel.jsx'
import Donut from '../charts/Donut.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'

export default function ResponsePattern({ pattern }) {
  if (!pattern || !pattern.sufficient) {
    return (
      <Panel title="Response pattern">
        <p className="panel__empty">
          Not enough message data to calculate response patterns. Try selecting a longer date range.
        </p>
      </Panel>
    )
  }

  const data = [
    { key: 'immediate', label: 'Immediate (<5m)', color: CATEGORY_COLORS.messaging, value: pattern.immediate, display: `${pattern.immediate}%` },
    { key: 'considered', label: 'Considered (5–30m)', color: CATEGORY_COLORS.meeting, value: pattern.considered, display: `${pattern.considered}%` },
    { key: 'async', label: 'Async (30m+)', color: CATEGORY_COLORS.focus, value: pattern.async, display: `${pattern.async}%` },
  ]

  return (
    <Panel title="Response pattern" hint="How quickly you reply after someone else">
      <Donut data={data} centerValue={`${pattern.immediate}%`} centerLabel="immediate" />
      <p className="highlight-note">
        You respond immediately to {pattern.immediate}% of messages — this may be interrupting your
        focus time.
      </p>
    </Panel>
  )
}
