// Meetings panel — back-to-back rate. At rest: big % + a mini "X of Y" bar.
// The specific meeting pairs live in a hover/tap popover.

import Panel from '../Panel.jsx'
import HoverInfo from '../ui/HoverInfo.jsx'

export default function BackToBack({ backToBack }) {
  const { totalMeetings = 0, count = 0, rate = 0, pairs = [] } = backToBack || {}

  const detail = (
    <span>
      {count} of {totalMeetings} meetings ran straight into the next.
      {pairs.map((p, i) => (
        <span key={i} style={{ display: 'block', marginTop: 2 }}>
          {p.weekday}: {p.from} → {p.to} ({p.gapMinutes}m gap)
        </span>
      ))}
    </span>
  )

  return (
    <Panel title="Back-to-back rate" isEmpty={totalMeetings === 0} emptyMessage="No meetings found for this period.">
      <HoverInfo as="div" className="b2b" content={detail}>
        <div className="headline-stat">{Math.round(rate)}%</div>
        <div className="miniseg" aria-hidden="true">
          {Array.from({ length: totalMeetings }).map((_, i) => (
            <span key={i} className={`miniseg__cell${i < count ? ' is-on' : ''}`} />
          ))}
        </div>
        <div className="b2b__hint">{count} of {totalMeetings} · hover for details</div>
      </HoverInfo>
    </Panel>
  )
}
