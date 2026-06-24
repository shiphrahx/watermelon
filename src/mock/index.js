// Data-fetching feature flag. This is the single seam between mock and real
// data: when USE_MOCK is true everything reads from src/mock; when false it
// calls the real Graph / Slack clients. Both branches return the same raw
// API-shaped data, so nothing outside this layer changes when swapping.

export const USE_MOCK = true

export function getCalendarEvents(startDate, endDate) {
  return USE_MOCK
    ? import('./calendar.js').then((m) => m.getMockCalendarEvents(startDate, endDate))
    : import('../api/graph.js').then((m) => m.fetchCalendarEvents(startDate, endDate))
}

export function getTeamsMessages(startDate, endDate) {
  return USE_MOCK
    ? import('./teams.js').then((m) => m.getMockTeamsMessages(startDate, endDate))
    : import('../api/graph.js').then((m) => m.fetchTeamsMessages(startDate, endDate))
}

export function getSlackMessages(startDate, endDate) {
  return USE_MOCK
    ? import('./slack.js').then((m) => m.getMockSlackMessages(startDate, endDate))
    : import('../api/slack.js').then((m) => m.fetchSlackMessages(startDate, endDate))
}
