// Data hooks for the dashboard and day view, built on the shared loadReport.
//
//  useDashboardData(range) — current + previous-week reports, insights & trends.
//  useDayReport(dateKey)   — a single day's report and day-scoped insight.

import { useCallback, useEffect, useState } from 'react'
import { loadReport, NoConnectionError } from '../data/loadReport.js'
import { getSettings } from '../utils/settings.js'
import { previousWeekRange } from '../utils/ranges.js'
import {
  computeInsights,
  computeTrends,
  computeDayInsight,
} from '../analysis/insights.js'

const GENERIC_ERROR = "Couldn't load this data. Check your connection and try again."

function messageFor(err) {
  return err instanceof NoConnectionError ? err.message : GENERIC_ERROR
}

export function useDashboardData(range) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const load = useCallback(async () => {
    if (!range?.startKey || !range?.endKey) return
    setLoading(true)
    setError(null)
    try {
      const { workingHoursStart, workingHoursEnd } = getSettings()
      const prev = previousWeekRange(range)

      const [report, prevReport] = await Promise.all([
        loadReport(range.startKey, range.endKey),
        loadReport(prev.startKey, prev.endKey),
      ])

      const insights = computeInsights({
        days: report.days,
        workingStart: workingHoursStart,
        workingEnd: workingHoursEnd,
      })
      const prevInsights = computeInsights({
        days: prevReport.days,
        workingStart: workingHoursStart,
        workingEnd: workingHoursEnd,
      })
      const trends = computeTrends(insights, prevInsights)

      setData({
        report,
        days: report.days,
        workingStart: workingHoursStart,
        workingEnd: workingHoursEnd,
        insights,
        prevInsights,
        trends,
      })
    } catch (err) {
      setError(messageFor(err))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [range?.startKey, range?.endKey])

  useEffect(() => {
    load()
  }, [load])

  return { loading, error, ...(data || {}), reload: load }
}

export function useDayReport(dateKey) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const load = useCallback(async () => {
    if (!dateKey) return
    setLoading(true)
    setError(null)
    try {
      const { workingHoursStart, workingHoursEnd } = getSettings()
      const report = await loadReport(dateKey, dateKey)
      const day = report.days.find((d) => d.dateKey === dateKey) || report.days[0]
      const dayInsight = computeDayInsight(day, workingHoursStart, workingHoursEnd)
      setData({ day, dayInsight })
    } catch (err) {
      setError(messageFor(err))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [dateKey])

  useEffect(() => {
    load()
  }, [load])

  return { loading, error, ...(data || {}), reload: load }
}
