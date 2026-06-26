// The headline KPI row (Overview). Icon badge + label + hero number + delta.

import KpiCard from './ui/KpiCard.jsx'
import MiniSparkline from './ui/MiniSparkline.jsx'
import { formatDuration } from '../utils/time.js'
import { getRecentWeeks } from '../storage/history.js'

export default function InsightCards({ insights, trends }) {
  const focusRate = Math.round(insights.focusRate)
  const focusRateSeries = getRecentWeeks(8).map((w) => w.focusRate)

  return (
    <div className="insight-cards">
      <KpiCard
        icon="🎯"
        label="Deep focus"
        value={formatDuration(insights.focusMinutes)}
        trend={trends?.focusMinutes}
        deltaGood={trends?.focusMinutes?.direction === 'up'}
      />
      <KpiCard
        icon="📅"
        label="In meetings"
        value={formatDuration(insights.meetingMinutes)}
        trend={trends?.meetingMinutes}
        deltaGood={trends?.meetingMinutes?.direction === 'down'}
      />
      <KpiCard
        icon="📈"
        label="Focus rate"
        value={`${focusRate}%`}
        trend={trends?.focusRate}
        deltaGood={trends?.focusRate?.direction === 'up'}
        spark={<MiniSparkline values={focusRateSeries} />}
      />
      <KpiCard icon="🔥" label="Busiest day" small value={insights.busiestDay ? insights.busiestDay.weekday : '—'} />
      <KpiCard icon="🧠" label="Most focused day" small value={insights.mostFocusedDay ? insights.mostFocusedDay.weekday : '—'} />
    </div>
  )
}
