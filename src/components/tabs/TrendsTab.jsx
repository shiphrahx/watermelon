// Trends tab: focus rate, meeting-vs-focus hours, and fragmentation across the
// recent weeks of stored history, with summary stats and a trend sentence.

import { useMemo } from 'react'
import Panel from '../Panel.jsx'
import TrendChart from '../charts/TrendChart.jsx'
import { getRecentWeeks } from '../../storage/history.js'
import { computeTrendStats } from '../../analysis/trends.js'
import { CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

const hours = (minutes) => Math.round((minutes / 60) * 10) / 10

export default function TrendsTab({ goalHours }) {
  const weeks = useMemo(() => getRecentWeeks(12), [])
  const stats = useMemo(() => computeTrendStats(weeks), [weeks])

  if (!stats.hasEnough) {
    return (
      <Panel title="Trends">
        <p className="panel__empty">
          Trends will appear once you've analysed a few weeks. Come back after using Watermelon over
          time.
        </p>
      </Panel>
    )
  }

  const shortWeek = (wk) => `W${String(wk).split('-W')[1] || ''}`
  const chartData = weeks.map((w) => ({
    label: shortWeek(w.weekKey),
    focusRate: w.focusRate,
    focusHours: hours(w.focusMinutes),
    meetingHours: hours(w.meetingMinutes),
    fragmentation: w.fragmentationCount,
  }))
  const deltaDir = stats.focusDelta > 0 ? 'up' : stats.focusDelta < 0 ? 'down' : 'flat'

  return (
    <>
      <div className="insight-cards">
        <div className="insight-card">
          <span className="insight-card__label">Best week</span>
          <span className="insight-card__value insight-card__value--small">
            {stats.bestWeek.focusRate}% · {stats.bestWeek.weekKey}
          </span>
        </div>
        <div className="insight-card">
          <span className="insight-card__label">Focus rate vs last week</span>
          <span className="insight-card__value insight-card__value--small">
            <span className={`trend trend--${deltaDir}`}>
              {deltaDir === 'up' ? '▲' : deltaDir === 'down' ? '▼' : '■'}{' '}
              {Math.abs(stats.focusDelta)}%
            </span>
          </span>
        </div>
        <div className="insight-card" style={{ flex: '2 1 260px' }}>
          <span className="insight-card__label">Trend</span>
          <span className="insight-card__value insight-card__value--small">{stats.sentence}</span>
        </div>
      </div>

      <div className="panels">
        <Panel title="Focus rate over time" hint="Percentage of working hours spent in deep focus">
          <TrendChart
            data={chartData}
            yUnit="%"
            yDomain={[0, 100]}
            series={[{ key: 'focusRate', label: 'Focus rate', color: CATEGORY_COLORS.focus }]}
          />
        </Panel>

        <Panel title="Meeting vs focus hours" hint="Hours per week in each">
          <TrendChart
            data={chartData}
            yUnit="h"
            referenceLine={goalHours ? { value: goalHours, label: `Goal ${formatDuration(goalHours * 60)}` } : null}
            series={[
              { key: 'focusHours', label: 'Focus hours', color: CATEGORY_COLORS.focus },
              { key: 'meetingHours', label: 'Meeting hours', color: CATEGORY_COLORS.meeting },
            ]}
          />
        </Panel>

        <Panel title="Fragmentation over time" hint="Unusable short gaps between meetings per week">
          <TrendChart
            data={chartData}
            series={[{ key: 'fragmentation', label: 'Unusable gaps', color: CATEGORY_COLORS.messaging }]}
          />
        </Panel>
      </div>
    </>
  )
}
