// Messaging panel — messages sent during accepted meetings, broken down.

import Panel from '../Panel.jsx'

export default function MeetingMultitasking({ multitasking }) {
  const { total = 0, perMeeting = [] } = multitasking || {}

  if (total === 0) {
    return (
      <Panel title="Meeting multitasking">
        <p className="panel__empty">No messages sent during meetings this week. Well done.</p>
      </Panel>
    )
  }

  return (
    <Panel title="Meeting multitasking">
      <div className="headline-stat">{total}</div>
      <p className="headline-explain">You sent {total} messages during meetings this week.</p>
      <div className="simple-list">
        {perMeeting.map((m) => (
          <div className="pair-list__row" key={m.subject}>
            <span style={{ gridColumn: '1 / 3' }}>{m.subject}</span>
            <span className="muted">
              {m.messages} messages{m.occurrences > 1 ? ` across ${m.occurrences} occurrences` : ''}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
