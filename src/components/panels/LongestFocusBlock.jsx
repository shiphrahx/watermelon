// Focus panel — the single longest uninterrupted focus block in the period.

import Panel from '../Panel.jsx'
import { formatDuration, minutesToTimeLabel } from '../../utils/time.js'

export default function LongestFocusBlock({ block }) {
  return (
    <Panel title="Longest focus block">
      {block ? (
        <p className="headline-explain" style={{ marginTop: 0, fontSize: '1rem' }}>
          Your longest focus block this week:{' '}
          <strong>{formatDuration(block.minutes)}</strong> on {block.weekday}, starting at{' '}
          {minutesToTimeLabel(block.startMinute)}.
        </p>
      ) : (
        <p className="panel__empty">No focus blocks detected — try a wider date range.</p>
      )}
    </Panel>
  )
}
