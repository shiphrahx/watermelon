// Hook that fetches calendar + message data for a date range and runs the
// classification, returning per-day classified blocks plus an aggregate
// summary. Works with whichever connections are available (MS, Slack, both).

import { useCallback, useEffect, useState } from 'react'
import {
  USE_MOCK,
  getCalendarEvents,
  getTeamsMessages,
  getSlackMessages,
} from '../mock/index.js'
import { isMicrosoftConnected } from '../auth/microsoft.js'
import { isSlackConnected } from '../auth/slack.js'
import { buildReport } from '../analysis/report.js'
import { getSettings } from '../utils/settings.js'

export function useProductivityData(startKey, endKey) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [days, setDays] = useState([]) // [{ dateKey, blocks }]
  const [summary, setSummary] = useState(null)

  const load = useCallback(async () => {
    if (!startKey || !endKey) return

    const useMicrosoft = USE_MOCK || isMicrosoftConnected()
    const useSlack = USE_MOCK || isSlackConnected()
    if (!useMicrosoft && !useSlack) {
      setError('Connect Microsoft or Slack in Settings to see your report.')
      setDays([])
      setSummary(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { workingHoursStart, workingHoursEnd } = getSettings()

      // Fetch raw API-shaped data through the mock/real data router. In mock
      // mode both calendar + Teams resolve from the mock layer; otherwise they
      // depend on which account is connected.
      const rawCalendar = useMicrosoft ? await getCalendarEvents(startKey, endKey) : []
      const rawTeams = useMicrosoft ? await getTeamsMessages(startKey, endKey) : []
      const rawSlack = useSlack ? await getSlackMessages(startKey, endKey) : []

      const { days: classifiedDays, summary: total } = buildReport({
        startKey,
        endKey,
        workingStart: workingHoursStart,
        workingEnd: workingHoursEnd,
        rawCalendar,
        rawTeams,
        rawSlack,
      })

      setDays(classifiedDays)
      setSummary(total)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }, [startKey, endKey])

  useEffect(() => {
    load()
  }, [load])

  return { loading, error, days, summary, reload: load }
}
