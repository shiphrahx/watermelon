// Dashboard: weekly summary sentence, five insight cards, and insight panels.
// Defaults to "this week" and supports presets, custom range, and week nav.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RangePicker from '../components/RangePicker.jsx'
import InsightCards from '../components/InsightCards.jsx'
import TimeBreakdown from '../components/panels/TimeBreakdown.jsx'
import FocusWindows from '../components/panels/FocusWindows.jsx'
import TopConsumers from '../components/panels/TopConsumers.jsx'
import FocusByDay from '../components/panels/FocusByDay.jsx'
import { SkeletonCards, SkeletonPanel } from '../components/Skeleton.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { useDashboardData } from '../hooks/useProductivityData.js'
import { weeklySummarySentence } from '../analysis/insights.js'
import { RANGE_PRESETS, thisWeekRange, navigateWeek } from '../utils/ranges.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const [presetId, setPresetId] = useState('this-week')
  const [range, setRange] = useState(() => thisWeekRange(new Date()))

  const { loading, error, insights, trends, reload } = useDashboardData(range)

  function handlePreset(id) {
    setPresetId(id)
    const preset = RANGE_PRESETS.find((p) => p.id === id)
    if (preset?.range) setRange(preset.range(new Date()))
  }

  function handleNavigateWeek(direction) {
    setRange((r) => navigateWeek(r, direction))
  }

  function handleCustomRange(next) {
    setPresetId('custom')
    setRange(next)
  }

  const selectDay = (dateKey) => navigate(`/day/${dateKey}`)

  const sentence = useMemo(
    () => (insights ? weeklySummarySentence(insights) : null),
    [insights],
  )

  return (
    <section>
      <div className="page-header">
        <h1>Dashboard</h1>
        <RangePicker
          presetId={presetId}
          range={range}
          onPreset={handlePreset}
          onNavigateWeek={handleNavigateWeek}
          onCustomRange={handleCustomRange}
        />
      </div>

      {loading && (
        <>
          <div className="skeleton skeleton-line" style={{ width: '70%', height: 28, margin: '0.75rem 0 1.25rem' }} />
          <SkeletonCards />
          <div className="panels">
            <SkeletonPanel />
            <SkeletonPanel />
          </div>
        </>
      )}

      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && insights && (
        <>
          <p className="summary-sentence">{sentence}</p>

          <InsightCards insights={insights} trends={trends} />

          <div className="panels">
            <TimeBreakdown perDay={insights.perDay} onSelectDay={selectDay} />
            <FocusWindows focusWindows={insights.focusWindows} />
            <TopConsumers topConsumers={insights.topConsumers} />
            <FocusByDay focusByDay={insights.focusByDay} onSelectDay={selectDay} />
          </div>
        </>
      )}
    </section>
  )
}
