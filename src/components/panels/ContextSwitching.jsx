// Messaging panel — context switches per day (3+ conversations in a 15-min window).

import Panel from '../Panel.jsx'

export default function ContextSwitching({ switching }) {
  const { perDay = [], total = 0 } = switching || {}
  const anyData = perDay.length > 0

  return (
    <Panel
      title="Context switching"
      isEmpty={!anyData}
      emptyMessage="No messages found for this period."
    >
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
      <p className="highlight-note">
        You switched context {total} times this week — each one interrupts flow and costs recovery
        time.
      </p>
    </Panel>
  )
}
