// Meetings panel — longest unbroken meeting block.

import Panel from '../Panel.jsx'
import { formatDuration } from '../../utils/time.js'

export default function LongestMeetingBlock({ block }) {
  return (
    <Panel title="Longest unbroken meeting block">
      {block ? (
        <p className="headline-explain" style={{ marginTop: 0, fontSize: '1rem' }}>
          On <strong>{block.weekday}</strong> you were in consecutive meetings for{' '}
          <strong>{formatDuration(block.minutes)}</strong> with no meaningful break.
        </p>
      ) : (
        <p className="panel__empty">No back-to-back meeting blocks this week.</p>
      )}
    </Panel>
  )
}
