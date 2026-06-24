// Meetings panel — back-to-back rate with the specific consecutive pairs.

import Panel from '../Panel.jsx'

export default function BackToBack({ backToBack }) {
  const { totalMeetings = 0, count = 0, rate = 0, pairs = [] } = backToBack || {}
  return (
    <Panel
      title="Back-to-back rate"
      isEmpty={totalMeetings === 0}
      emptyMessage="No meetings found for this period."
    >
      <div className="headline-stat">{Math.round(rate)}%</div>
      <p className="headline-explain">
        {count} out of {totalMeetings} meetings this week started within 5 minutes of the previous
        one ending.
      </p>
      <div className="pair-list">
        {pairs.map((p, i) => (
          <div className="pair-list__row" key={i}>
            <span className="muted">{p.weekday}</span>
            <span>
              {p.from} → {p.to}
            </span>
            <span className="muted">{p.gapMinutes} min gap</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
