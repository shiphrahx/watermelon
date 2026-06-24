// Four small stat cards for a single day.

import { formatDuration, minutesToTimeLabel } from '../utils/time.js'

function Stat({ label, value }) {
  return (
    <div className="insight-card">
      <span className="insight-card__label">{label}</span>
      <span className="insight-card__value insight-card__value--small">{value}</span>
    </div>
  )
}

export default function DayStats({ dayInsight }) {
  const longest = dayInsight.longestFocusBlock
  const longestValue = longest
    ? `${formatDuration(longest.minutes)} starting at ${minutesToTimeLabel(longest.startMinute)}`
    : 'None'

  const first = dayInsight.firstMessage
  const firstValue = first
    ? `${first.label}${first.beforeWorkStart ? ' — you started early' : ''}`
    : 'No messages'

  return (
    <div className="day-stats">
      <Stat label="Focus rate" value={`${Math.round(dayInsight.focusRate)}%`} />
      <Stat label="Total meeting time" value={formatDuration(dayInsight.meetingMinutes)} />
      <Stat label="Longest focus block" value={longestValue} />
      <Stat label="First message sent" value={firstValue} />
    </div>
  )
}
