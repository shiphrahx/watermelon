// Mock Slack messages. Returns raw Slack message objects for the requested
// range from the deterministic dataset.
//
// Drop-in for api/slack.js#fetchSlackMessages.

import { buildRecentDataset, dayBoundsMs } from './generator.js'

export function getMockSlackMessages(startDate, endDate) {
  const { slackMessages } = buildRecentDataset(new Date())
  const [startMs, endMs] = dayBoundsMs(startDate, endDate)

  const filtered = slackMessages.filter((m) => {
    const ts = Math.round(parseFloat(m.ts) * 1000)
    return ts >= startMs && ts <= endMs
  })

  return Promise.resolve(filtered)
}
