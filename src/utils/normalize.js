// Normalisation layer: converts raw Microsoft Graph / Slack API objects into
// the internal shapes the analysis code works with. Both the mock layer and the
// real API clients return raw API shapes, so this is the single place that
// understands those shapes — keeping mock and real truly interchangeable.

import { parseGraphDateTime } from '../mock/generator.js'

// Raw Graph events -> [{ id, subject, start: Date, end: Date, isOnlineMeeting }]
// Excludes all-day events and events the user declined.
export function normalizeCalendarEvents(rawEvents = []) {
  return rawEvents
    .filter((e) => !e.isAllDay)
    .filter((e) => e.responseStatus?.response !== 'declined')
    .map((e) => ({
      id: e.id,
      subject: e.subject || '(no subject)',
      start: parseGraphDateTime(e.start.dateTime),
      end: parseGraphDateTime(e.end.dateTime),
      showAs: e.showAs,
      isOnlineMeeting: !!e.isOnlineMeeting,
    }))
}

// Raw Graph chat message -> { timestamp, source: 'teams', chatId }
export function normalizeTeamsMessages(rawMessages = []) {
  return rawMessages
    .filter((m) => m.createdDateTime)
    .map((m) => ({
      timestamp: new Date(m.createdDateTime).getTime(),
      source: 'teams',
      chatId: m.chatId,
    }))
}

// Raw Slack message -> { timestamp, source: 'slack', channel }
export function normalizeSlackMessages(rawMessages = []) {
  return rawMessages
    .filter((m) => m.ts)
    .map((m) => ({
      timestamp: Math.round(parseFloat(m.ts) * 1000),
      source: 'slack',
      channel: m.channel,
    }))
}
