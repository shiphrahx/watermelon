// Day view: a single day in detail — summary sentence, vertical timeline, and
// day stat cards. Reached by clicking a day on the dashboard.

import { useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import DayTimeline from '../components/DayTimeline.jsx'
import DayStats from '../components/DayStats.jsx'
import CategoryLegend from '../components/CategoryLegend.jsx'
import { SkeletonPanel } from '../components/Skeleton.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { useDayReport } from '../hooks/useProductivityData.js'
import { dailySummarySentence } from '../analysis/insights.js'
import { getSettings } from '../utils/settings.js'
import { navigateDay } from '../utils/ranges.js'
import { fromDateKey } from '../utils/time.js'

export default function DayView() {
  const { dateKey } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab')
  const backTo = tab ? `/?tab=${tab}` : '/'
  const { workingHoursStart, workingHoursEnd } = getSettings()

  const { loading, error, day, dayInsight, reload } = useDayReport(dateKey)

  const prettyDate = useMemo(
    () =>
      fromDateKey(dateKey).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [dateKey],
  )

  const dayHref = (key) => `/day/${key}${tab ? `?tab=${tab}` : ''}`
  const goToDay = (direction) => navigate(dayHref(navigateDay(dateKey, direction)))

  return (
    <section>
      <div className="day-view__head">
        <button className="back-link" onClick={() => navigate(backTo)}>
          ‹ Back to dashboard
        </button>
        <div className="week-nav">
          <button className="icon-button" aria-label="Previous day" onClick={() => goToDay(-1)}>
            ‹
          </button>
          <button className="icon-button" aria-label="Next day" onClick={() => goToDay(1)}>
            ›
          </button>
        </div>
      </div>

      <h1>{prettyDate}</h1>

      {loading && <SkeletonPanel lines={8} />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && dayInsight && (
        <>
          <p className="summary-sentence">{dailySummarySentence(dayInsight)}</p>
          <CategoryLegend />
          <DayTimeline day={day} workingStart={workingHoursStart} workingEnd={workingHoursEnd} />
          <DayStats dayInsight={dayInsight} />
        </>
      )}
    </section>
  )
}
