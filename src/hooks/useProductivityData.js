// Hook that fetches calendar + message data for a date range and runs the
// classification, returning per-day classified blocks plus an aggregate
// summary. Works with whichever connections are available (MS, Slack, both).

import { useCallback, useEffect, useState } from 'react'
import { fetchCalendarEvents, fetchTeamsMessages } from '../api/graph.js'
import { fetchSlackMessages } from '../api/slack.js'
import { isMicrosoftConnected } from '../auth/microsoft.js'
import { isSlackConnected } from '../auth/slack.js'
import { classifyDay, summarise } from '../analysis/classify.js'
import { getSettings } from '../utils/settings.js'
import { dateKeysInRange, startOfDayISO, endOfDayISO } from '../utils/time.js'

export function useProductivityData(startKey, endKey) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [days, setDays] = useState([]) // [{ dateKey, blocks }]
  const [summary, setSummary] = useState(null)

  const load = useCallback(async () => {
    if (!startKey || !endKey) return
    if (!isMicrosoftConnected() && !isSlackConnected()) {
      setError('Connect Microsoft or Slack in Settings to see your report.')
      setDays([])
      setSummary(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { workingHoursStart, workingHoursEnd } = getSettings()

      // Calendar events (Microsoft only).
      let events = []
      if (isMicrosoftConnected()) {
        events = await fetchCalendarEvents(startKey, endKey)
      }

      // Messages from both sources, merged into one timeline.
      let messages = []
      if (isMicrosoftConnected()) {
        const teams = await fetchTeamsMessages(startKey, endKey)
        messages = messages.concat(teams)
      }
      if (isSlackConnected()) {
        const startMs = new Date(startOfDayISO(startKey)).getTime()
        const endMs = new Date(endOfDayISO(endKey)).getTime()
        const slack = await fetchSlackMessages(startMs, endMs)
        messages = messages.concat(slack)
      }

      // Classify each day independently.
      const keys = dateKeysInRange(startKey, endKey)
      const classifiedDays = keys.map((dateKey) => {
        const dayStartMs = new Date(startOfDayISO(dateKey)).getTime()
        const dayEndMs = new Date(endOfDayISO(dateKey)).getTime()
        const dayEvents = events.filter(
          (e) => e.end.getTime() >= dayStartMs && e.start.getTime() <= dayEndMs,
        )
        const dayMessages = messages.filter(
          (m) => m.timestamp >= dayStartMs && m.timestamp <= dayEndMs,
        )
        const blocks = classifyDay({
          dateKey,
          workingStart: workingHoursStart,
          workingEnd: workingHoursEnd,
          events: dayEvents,
          messages: dayMessages,
        })
        return { dateKey, blocks }
      })

      setDays(classifiedDays)
      setSummary(summarise(classifiedDays.flatMap((d) => d.blocks)))
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
