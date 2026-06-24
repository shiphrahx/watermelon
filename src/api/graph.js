// Microsoft Graph API client. Calls are made directly from the browser with
// the bearer token from MSAL. Covers calendar events and Teams chat messages.

import { GRAPH_BASE } from '../config.js'
import { getMicrosoftToken } from '../auth/microsoft.js'
import { startOfDayISO, endOfDayISO } from '../utils/time.js'

async function graphGet(path) {
  const token = await getMicrosoftToken()
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Required to interpret event times in a consistent zone.
      Prefer: 'outlook.timezone="UTC"',
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Graph ${path} failed: ${res.status} ${body}`)
  }
  return res.json()
}

// Follow @odata.nextLink to gather all pages of a collection.
async function graphGetAll(path) {
  let results = []
  let next = path
  while (next) {
    const data = await graphGet(next)
    results = results.concat(data.value || [])
    // nextLink is an absolute URL; strip the base so graphGet can re-prefix it.
    next = data['@odata.nextLink']
      ? data['@odata.nextLink'].replace(GRAPH_BASE, '')
      : null
  }
  return results
}

// Fetch calendar events overlapping the range. Uses calendarView so recurring
// events are expanded into instances. Excludes all-day and declined events.
export async function fetchCalendarEvents(startKey, endKey) {
  const start = startOfDayISO(startKey)
  const end = endOfDayISO(endKey)
  const params = new URLSearchParams({
    startDateTime: start,
    endDateTime: end,
    $select: 'subject,start,end,isAllDay,responseStatus,showAs',
    $orderby: 'start/dateTime',
    $top: '100',
  })
  // Return raw Graph event objects. Filtering (declined / all-day) and date
  // parsing happen in the normalization layer, so mock and real data flow
  // through identical downstream code.
  return graphGetAll(`/me/calendarView?${params.toString()}`)
}

// Fetch Teams chat messages across the user's chats within the range.
// Returns raw Graph chat-message objects (with chatId set).
export async function fetchTeamsMessages(startKey, endKey) {
  const start = new Date(startOfDayISO(startKey)).getTime()
  const end = new Date(endOfDayISO(endKey)).getTime()

  // Get the user's chats, then their messages. Graph does not support a single
  // range query across all chats, so we page per chat and filter client-side.
  const chats = await graphGetAll('/me/chats?$select=id&$top=50')
  const messages = []

  for (const chat of chats) {
    try {
      const chatMsgs = await graphGetAll(
        `/me/chats/${chat.id}/messages?$top=50`,
      )
      for (const m of chatMsgs) {
        if (!m.createdDateTime) continue
        const ts = new Date(m.createdDateTime).getTime()
        if (ts >= start && ts <= end) {
          // Raw Graph message shape, ensuring chatId is present for downstream.
          messages.push({ ...m, chatId: chat.id })
        }
      }
    } catch {
      // Skip chats we cannot read rather than failing the whole fetch.
      continue
    }
  }
  return messages
}

export async function fetchMe() {
  const data = await graphGet('/me?$select=displayName,mail,userPrincipalName')
  return data
}
