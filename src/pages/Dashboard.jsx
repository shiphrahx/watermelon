// Dashboard: four insight tabs sharing one date range, week navigation, and
// weekly summary sentence. The active tab is persisted in the URL so it survives
// date-range changes and round-trips to the day view.

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import RangePicker from '../components/RangePicker.jsx'
import TabBar, { TABS } from '../components/TabBar.jsx'
import OverviewTab from '../components/tabs/OverviewTab.jsx'
import MeetingsTab from '../components/tabs/MeetingsTab.jsx'
import FocusTab from '../components/tabs/FocusTab.jsx'
import MessagingTab from '../components/tabs/MessagingTab.jsx'
import TrendsTab from '../components/tabs/TrendsTab.jsx'
import { SkeletonCards, SkeletonPanel } from '../components/Skeleton.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { useDashboardData } from '../hooks/useProductivityData.js'
import { weeklySummarySentence } from '../analysis/insights.js'
import { getSettings } from '../utils/settings.js'
import { RANGE_PRESETS, thisWeekRange, navigateWeek } from '../utils/ranges.js'

const VALID_TABS = TABS.map((t) => t.id)

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = VALID_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview'

  const [presetId, setPresetId] = useState('this-week')
  const [range, setRange] = useState(() => thisWeekRange(new Date()))

  const { loading, error, insights, trends, days, workingStart, workingEnd, reload } =
    useDashboardData(range)

  function setTab(id) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', id)
      return next
    })
  }

  function handlePreset(id) {
    setPresetId(id)
    const preset = RANGE_PRESETS.find((p) => p.id === id)
    if (preset?.range) setRange(preset.range(new Date()))
  }

  const handleNavigateWeek = (direction) => setRange((r) => navigateWeek(r, direction))
  const handleCustomRange = (next) => {
    setPresetId('custom')
    setRange(next)
  }

  const selectDay = (dateKey) => navigate(`/day/${dateKey}?tab=${tab}`)
  const goToDayView = () => navigate(`/day/${range.endKey}?tab=${tab}`)

  const sentence = useMemo(
    () => (insights ? weeklySummarySentence(insights) : null),
    [insights],
  )

  const tabProps = { insights, trends, days, workingStart, workingEnd, onSelectDay: selectDay }

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

      <TabBar active={tab} onChange={setTab} onDayView={goToDayView} />

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

          {tab === 'overview' && <OverviewTab {...tabProps} />}
          {tab === 'meetings' && <MeetingsTab {...tabProps} />}
          {tab === 'focus' && <FocusTab {...tabProps} />}
          {tab === 'messaging' && <MessagingTab {...tabProps} />}
          {tab === 'trends' && <TrendsTab goalHours={Number(getSettings().focusGoalHours) || undefined} />}
        </>
      )}
    </section>
  )
}
