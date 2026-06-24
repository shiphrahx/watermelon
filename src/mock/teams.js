// Mock Teams chat messages. Returns raw Microsoft Graph chat-message objects
// for the requested range from the deterministic dataset.
//
// Drop-in for api/graph.js#fetchTeamsMessages.

import { buildRecentDataset, dayBoundsMs } from './generator.js'

export function getMockTeamsMessages(startDate, endDate) {
  const { teamsMessages } = buildRecentDataset(new Date())
  const [startMs, endMs] = dayBoundsMs(startDate, endDate)

  const filtered = teamsMessages.filter((m) => {
    const ts = new Date(m.createdDateTime).getTime()
    return ts >= startMs && ts <= endMs
  })

  return Promise.resolve(filtered)
}
