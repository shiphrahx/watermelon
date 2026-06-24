// Slack API client. All calls go through the Cloudflare Worker proxy because
// Slack's Web API does not return CORS headers for browser origins.
//
// The proxy forwards to https://slack.com/api/{path} with the user's token
// (passed in the `token` header) as Bearer auth.

import { getSlackToken } from '../auth/slack.js'
import { getSlackProxyUrl } from '../utils/settings.js'
import { startOfDayISO, endOfDayISO } from '../utils/time.js'

async function slackGet(path, params = {}) {
  const token = getSlackToken()
  const proxyUrl = getSlackProxyUrl()
  if (!token) throw new Error('Slack not connected')
  if (!proxyUrl) throw new Error('Slack proxy URL not configured')

  const query = new URLSearchParams({ path, ...params })
  const url = `${proxyUrl.replace(/\/$/, '')}/?${query.toString()}`
  const res = await fetch(url, { headers: { token } })
  if (!res.ok) {
    throw new Error(`Slack proxy ${path} failed: ${res.status}`)
  }
  const data = await res.json()
  if (!data.ok) {
    throw new Error(`Slack ${path} error: ${data.error || 'unknown'}`)
  }
  return data
}

// List conversations the user is a member of (public/private channels + DMs).
async function listConversations() {
  const conversations = []
  let cursor
  do {
    const data = await slackGet('users.conversations', {
      types: 'public_channel,private_channel,im',
      limit: '200',
      ...(cursor ? { cursor } : {}),
    })
    conversations.push(...(data.channels || []))
    cursor = data.response_metadata?.next_cursor || ''
  } while (cursor)
  return conversations
}

// Fetch messages the user sent/received across all conversations in the time
// range. Takes "YYYY-MM-DD" date keys (consistent with the Graph fetchers and
// the mock layer). Returns raw Slack message objects (with channel set);
// normalization to internal timestamps happens in the normalization layer.
export async function fetchSlackMessages(startKey, endKey) {
  const startMs = new Date(startOfDayISO(startKey)).getTime()
  const endMs = new Date(endOfDayISO(endKey)).getTime()
  const oldest = (startMs / 1000).toFixed(6)
  const latest = (endMs / 1000).toFixed(6)

  const conversations = await listConversations()
  const messages = []

  for (const conv of conversations) {
    try {
      let cursor
      do {
        const data = await slackGet('conversations.history', {
          channel: conv.id,
          oldest,
          latest,
          limit: '200',
          ...(cursor ? { cursor } : {}),
        })
        for (const m of data.messages || []) {
          if (!m.ts) continue
          // Raw Slack message shape, ensuring channel is present for downstream.
          messages.push({ ...m, channel: conv.id })
        }
        cursor = data.response_metadata?.next_cursor || ''
      } while (cursor)
    } catch {
      // Skip conversations we cannot read (e.g. archived / no history scope).
      continue
    }
  }
  return messages
}
