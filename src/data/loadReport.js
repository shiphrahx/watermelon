// Shared data loader: fetches raw data for a date range (mock or real,
// depending on the feature flag and connected accounts) and assembles a report.
// Used by both the dashboard and day-view hooks.

import {
  USE_MOCK,
  getCalendarEvents,
  getTeamsMessages,
  getSlackMessages,
} from '../mock/index.js'
import { isMicrosoftConnected } from '../auth/microsoft.js'
import { isSlackConnected } from '../auth/slack.js'
import { buildReport } from '../analysis/report.js'
import { summarise } from '../analysis/classify.js'
import { applyCorrections } from '../storage/corrections.js'
import { getSettings } from '../utils/settings.js'

export class NoConnectionError extends Error {
  constructor() {
    super('Connect Microsoft or Slack in Settings to see your report.')
    this.name = 'NoConnectionError'
  }
}

export async function loadReport(startKey, endKey) {
  const useMicrosoft = USE_MOCK || isMicrosoftConnected()
  const useSlack = USE_MOCK || isSlackConnected()
  if (!useMicrosoft && !useSlack) throw new NoConnectionError()

  const { workingHoursStart, workingHoursEnd } = getSettings()

  const rawCalendar = useMicrosoft ? await getCalendarEvents(startKey, endKey) : []
  const rawTeams = useMicrosoft ? await getTeamsMessages(startKey, endKey) : []
  const rawSlack = useSlack ? await getSlackMessages(startKey, endKey) : []

  const report = buildReport({
    startKey,
    endKey,
    workingStart: workingHoursStart,
    workingEnd: workingHoursEnd,
    rawCalendar,
    rawTeams,
    rawSlack,
  })

  // Apply any manual block corrections so day AND week totals reflect them.
  report.days = report.days.map((d) => ({
    ...d,
    blocks: applyCorrections(d.blocks, d.dateKey),
  }))
  report.summary = summarise(report.days.flatMap((d) => d.blocks))
  return report
}
