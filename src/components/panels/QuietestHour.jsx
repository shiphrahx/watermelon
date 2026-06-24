// Messaging panel — the user's quietest sending hour, as a focus-protection cue.

import Panel from '../Panel.jsx'

export default function QuietestHour({ quietest }) {
  return (
    <Panel title="Your quietest messaging hour">
      {quietest ? (
        <p className="headline-explain" style={{ marginTop: 0, fontSize: '1rem' }}>
          Your quietest hour is typically <strong>{quietest.label}</strong> — this is your best
          window for protecting focus time.
        </p>
      ) : (
        <p className="panel__empty">No messages found for this period.</p>
      )}
    </Panel>
  )
}
