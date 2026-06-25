// Messaging panel — context switches per day (3+ conversations in a 15-min window).

import Panel from '../Panel.jsx'

function framing(total) {
  if (total <= 5) return 'Low context switching this week — good for focus.'
  if (total <= 15) return 'Moderate context switching — some disruption to focus.'
  return 'High context switching this week — this is likely fragmenting your focus time.'
}

export default function ContextSwitching({ switching }) {
  const { perDay = [], total = 0 } = switching || {}
  const anyData = perDay.length > 0

  return (
    <Panel
      title="Context switching"
      hint="How often you jump between 3 or more different conversations within 15 minutes"
      isEmpty={!anyData}
      emptyMessage="No messages found for this period."
    >
      <p className="panel__hint" style={{ marginTop: 0 }}>
        A context switch is counted when you send messages in 3 or more different channels or chats
        within any 15-minute window.
      </p>
      <div className="simple-list">
        {perDay.map((d) => (
          <div className="pair-list__row" key={d.dateKey}>
            <span className="muted">{d.weekday}</span>
            <span style={{ gridColumn: '2 / 4' }}>
              {d.count} context {d.count === 1 ? 'switch' : 'switches'}
            </span>
          </div>
        ))}
      </div>
      <p className="highlight-note">{framing(total)}</p>
    </Panel>
  )
}
