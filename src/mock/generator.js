// Deterministic mock-data generator.
//
// Produces fake-but-realistic Microsoft Graph calendar events, Teams chat
// messages and Slack messages whose shapes match the real APIs exactly.
//
// Determinism: no Math.random(). All variation comes from a seeded PRNG keyed
// off the date + profile, so the same date/profile always yields identical data
// (predictable UI development). The only runtime input is "today", which is
// passed in explicitly so callers/tests stay deterministic.

// --- Seeded PRNG ----------------------------------------------------------

// djb2 string hash -> 32-bit seed.
function hashSeed(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return h >>> 0
}

// mulberry32 PRNG. Returns a function producing floats in [0, 1).
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function rngFor(...parts) {
  return mulberry32(hashSeed(parts.join('|')))
}

// Deterministic integer in [min, max] inclusive from a PRNG.
function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1))
}

// --- Date / time helpers --------------------------------------------------

const pad = (n) => String(n).padStart(2, '0')

export function dateKeyOf(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// A local Date at the given hour/minute on `date`'s calendar day.
function localAt(date, totalMinutes) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  d.setMinutes(totalMinutes)
  return d
}

// Format an instant as Graph local wall-clock "YYYY-MM-DDTHH:MM:SS" (no zone).
function fmtLocalNoZone(d) {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

const TZ = 'Europe/London'

// --- Profiles -------------------------------------------------------------

export const PROFILES = ['heavy-meetings', 'focus-day', 'comms-heavy', 'mixed', 'light']

// Order in which profiles are assigned to the 10 working days (oldest -> newest).
export const PROFILE_SEQUENCE = [
  'mixed',
  'heavy-meetings',
  'focus-day',
  'comms-heavy',
  'mixed',
  'light',
  'heavy-meetings',
  'mixed',
  'focus-day',
  'comms-heavy',
]

// Meeting templates per profile. Each: [subject, startMin, endMin, response, online].
// Every profile includes exactly one declined meeting (to verify the filter).
const M = (h, m) => h * 60 + m
const MEETINGS = {
  'heavy-meetings': [
    ['Daily standup', M(9, 0), M(9, 30), 'accepted', true],
    ['Sprint planning', M(9, 30), M(10, 30), 'accepted', true],
    ['Design review', M(10, 30), M(11, 30), 'accepted', true],
    ['Stakeholder sync', M(14, 0), M(14, 30), 'accepted', false],
    ['Roadmap review', M(15, 0), M(16, 0), 'organizer', true],
    ['Vendor pitch', M(16, 30), M(17, 0), 'declined', false],
  ],
  'focus-day': [
    ['Daily standup', M(9, 30), M(10, 0), 'accepted', true],
    ['Optional brown-bag', M(12, 30), M(13, 0), 'declined', true],
  ],
  'comms-heavy': [
    ['Daily standup', M(9, 30), M(10, 0), 'accepted', true],
    ['1:1 with manager', M(15, 0), M(15, 30), 'accepted', true],
    ['Lunch & learn', M(12, 30), M(13, 0), 'declined', false],
  ],
  mixed: [
    ['Daily standup', M(9, 30), M(10, 0), 'accepted', true],
    ['Project review', M(11, 0), M(12, 0), 'accepted', true],
    ['Afternoon catch-up', M(14, 30), M(15, 0), 'accepted', false],
    ['External webinar', M(16, 0), M(16, 30), 'declined', false],
  ],
  light: [
    ['Daily standup', M(9, 30), M(10, 0), 'accepted', true],
    ['Optional sync', M(11, 0), M(11, 30), 'declined', true],
  ],
}

// --- Identities -----------------------------------------------------------

const TEAMS_USER = { displayName: 'Cass', id: 'user_123' }
const TEAMS_CHATS = ['chat_abc', 'chat_def', 'chat_ghi']
const SLACK_USER = 'U012AB3CD'
const SLACK_CHANNELS = ['C012AB3EF', 'C034CD5GH', 'C056EF7IJ'] // 3+ channels
const SLACK_DM = 'D078GH9KL' // DM channel (different format)

const TEAMS_TEXTS = [
  'Just reviewing the PR now',
  'Can you take a look when you get a sec?',
  'Thanks, that makes sense',
  'Heading into a meeting, back shortly',
  'Pushed the fix, tests are green',
  'Standup in 5',
]
const SLACK_TEXTS = [
  'Sounds good, will pick that up after lunch',
  'Anyone seen the latest deploy?',
  'Merged — thanks for the review',
  'Quick q about the staging env',
  'On it 👍',
  'Will follow up in the thread',
]

// --- Builders -------------------------------------------------------------

function makeCalendarEvent(date, idx, [subject, startMin, endMin, response, online]) {
  const start = localAt(date, startMin)
  const end = localAt(date, endMin)
  return {
    id: `evt_${dateKeyOf(date)}_${pad(idx)}`,
    subject,
    start: { dateTime: fmtLocalNoZone(start), timeZone: TZ },
    end: { dateTime: fmtLocalNoZone(end), timeZone: TZ },
    isAllDay: false,
    responseStatus: { response },
    attendees: [
      {
        emailAddress: { name: 'Alice Smith', address: 'alice@example.com' },
        status: { response: 'accepted' },
      },
    ],
    isOnlineMeeting: online,
    onlineMeetingProvider: online ? 'teamsForBusiness' : 'unknown',
  }
}

function makeAllDayEvent(date) {
  const start = localAt(date, 0)
  const end = new Date(start.getTime())
  end.setDate(end.getDate() + 1)
  return {
    id: `evt_${dateKeyOf(date)}_allday`,
    subject: 'Company offsite (all day)',
    start: { dateTime: fmtLocalNoZone(start), timeZone: TZ },
    end: { dateTime: fmtLocalNoZone(end), timeZone: TZ },
    isAllDay: true,
    responseStatus: { response: 'accepted' },
    attendees: [],
    isOnlineMeeting: false,
    onlineMeetingProvider: 'unknown',
  }
}

function makeTeamsMessage(date, n, instant) {
  const text = TEAMS_TEXTS[n % TEAMS_TEXTS.length]
  return {
    id: `tmsg_${dateKeyOf(date)}_${pad(n)}`,
    createdDateTime: instant.toISOString(),
    from: { user: { displayName: TEAMS_USER.displayName, id: TEAMS_USER.id } },
    body: { content: text, contentType: 'text' },
    chatId: TEAMS_CHATS[n % TEAMS_CHATS.length],
  }
}

function makeSlackMessage(date, n, instant, channel) {
  const text = SLACK_TEXTS[n % SLACK_TEXTS.length]
  return {
    ts: (instant.getTime() / 1000).toFixed(6),
    user: SLACK_USER,
    text,
    channel,
    type: 'message',
  }
}

// Evenly spread `count` instants across [startMin, endMin) on `date`.
function spread(date, startMin, endMin, count) {
  const out = []
  if (count <= 0) return out
  const span = endMin - startMin
  for (let i = 0; i < count; i++) {
    const min = startMin + Math.round(((i + 1) * span) / (count + 1))
    out.push(localAt(date, min))
  }
  return out
}

// Per-profile message intensity per window (rough message counts before the
// source split). Windows model a realistic daily rhythm.
const WINDOWS = {
  preStandup: [M(8, 45), M(9, 15)],
  morningMeeting: [M(9, 30), M(10, 0)],
  midMorning: [M(10, 30), M(12, 0)],
  // lunch 12:30-13:30 is intentionally silent (no window)
  earlyAfternoon: [M(13, 30), M(14, 30)],
  lateAfternoon: [M(15, 0), M(17, 0)],
  tail: [M(17, 0), M(17, 45)],
}

const INTENSITY = {
  'heavy-meetings': { preStandup: 3, morningMeeting: 2, midMorning: 1, earlyAfternoon: 2, lateAfternoon: 3, tail: 1 },
  'focus-day': { preStandup: 2, morningMeeting: 0, midMorning: 0, earlyAfternoon: 1, lateAfternoon: 0, tail: 0 },
  'comms-heavy': { preStandup: 4, morningMeeting: 2, midMorning: 10, earlyAfternoon: 8, lateAfternoon: 8, tail: 2 },
  mixed: { preStandup: 3, morningMeeting: 1, midMorning: 4, earlyAfternoon: 3, lateAfternoon: 0, tail: 1 },
  light: { preStandup: 2, morningMeeting: 0, midMorning: 1, earlyAfternoon: 1, lateAfternoon: 0, tail: 0 },
}

// Split a count between Teams and Slack. Even day index => Teams-heavy,
// odd => Slack-heavy, so the dataset varies which tool dominates per day.
function splitSources(count, dayIndex) {
  if (count <= 0) return { teams: 0, slack: 0 }
  const dominantTeams = dayIndex % 2 === 0
  const teamsCount = dominantTeams ? Math.ceil(count * 0.7) : Math.floor(count * 0.3)
  return { teams: teamsCount, slack: count - teamsCount }
}

// Generate one realistic day. Returns raw API-shaped arrays.
// options: { allDay?: boolean, outOfHours?: boolean, dayIndex?: number }
export function generateDay(date, profile, options = {}) {
  const { allDay = false, outOfHours = false, dayIndex = 0 } = options
  if (!MEETINGS[profile]) {
    throw new Error(`Unknown profile: ${profile}`)
  }

  // --- Calendar ---
  const calendarEvents = MEETINGS[profile].map((tpl, i) =>
    makeCalendarEvent(date, i, tpl),
  )
  if (allDay) calendarEvents.push(makeAllDayEvent(date))

  // --- Messages ---
  const teamsMessages = []
  const slackMessages = []
  let tN = 0
  let sN = 0
  const intensity = INTENSITY[profile]

  for (const [windowName, [startMin, endMin]] of Object.entries(WINDOWS)) {
    const baseCount = intensity[windowName] || 0
    const rng = rngFor(dateKeyOf(date), profile, windowName)
    // small deterministic ±1 jitter for realism
    const count = Math.max(0, baseCount + (baseCount > 0 ? randInt(rng, -1, 1) : 0))
    const { teams, slack } = splitSources(count, dayIndex)

    for (const instant of spread(date, startMin, endMin, teams)) {
      teamsMessages.push(makeTeamsMessage(date, tN++, instant))
    }
    spread(date, startMin, endMin, slack).forEach((instant, i) => {
      // mix channels; include a DM occasionally
      const channel = i === 0 && slack > 2 ? SLACK_DM : SLACK_CHANNELS[sN % SLACK_CHANNELS.length]
      slackMessages.push(makeSlackMessage(date, sN++, instant, channel))
    })
  }

  // --- Special scenario: possible ad-hoc (mixed profile) ---
  // Activity 15:00-15:10, then a 50-min silence, then resume 16:00-16:40,
  // leaving the 15:30-16:00 block empty but bracketed by activity within 30m.
  if (profile === 'mixed') {
    for (const instant of spread(date, M(15, 0), M(15, 10), 2)) {
      teamsMessages.push(makeTeamsMessage(date, tN++, instant))
    }
    spread(date, M(16, 0), M(16, 40), 3).forEach((instant) => {
      slackMessages.push(
        makeSlackMessage(date, sN++, instant, SLACK_CHANNELS[sN % SLACK_CHANNELS.length]),
      )
    })
  }

  // --- Out-of-hours messages (excluded from the report) ---
  if (outOfHours) {
    teamsMessages.push(makeTeamsMessage(date, tN++, localAt(date, M(8, 30))))
    slackMessages.push(
      makeSlackMessage(date, sN++, localAt(date, M(18, 45)), SLACK_CHANNELS[0]),
    )
  }

  return { calendarEvents, teamsMessages, slackMessages }
}

// --- 10-working-day dataset ----------------------------------------------

// Returns the last 10 working days (Mon-Fri) up to and including `today`,
// oldest first.
export function recentWorkingDays(today, count = 10) {
  const days = []
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  while (days.length < count) {
    const dow = cursor.getDay()
    if (dow >= 1 && dow <= 5) days.unshift(new Date(cursor.getTime()))
    cursor.setDate(cursor.getDate() - 1)
  }
  return days
}

// Build the full deterministic dataset for the last 10 working days.
export function buildRecentDataset(today) {
  const days = recentWorkingDays(today, PROFILE_SEQUENCE.length)
  const calendarEvents = []
  const teamsMessages = []
  const slackMessages = []

  days.forEach((date, dayIndex) => {
    const profile = PROFILE_SEQUENCE[dayIndex]
    const day = generateDay(date, profile, {
      dayIndex,
      allDay: dayIndex === 2 || dayIndex === 5, // all-day event on >= 2 days
      outOfHours: dayIndex === 0 || dayIndex === 4, // out-of-hours on some days
    })
    calendarEvents.push(...day.calendarEvents)
    teamsMessages.push(...day.teamsMessages)
    slackMessages.push(...day.slackMessages)
  })

  return { calendarEvents, teamsMessages, slackMessages }
}

// Inclusive [startMs, endMs] day bounds for a start/end that may be a Date or a
// "YYYY-MM-DD" string. Used by the per-source mock fetchers to filter the set.
export function dayBoundsMs(start, end) {
  const toDate = (v) =>
    v instanceof Date ? v : new Date(`${v}T00:00:00`)
  const s = toDate(start)
  const e = toDate(end)
  const startMs = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0).getTime()
  const endMs = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999).getTime()
  return [startMs, endMs]
}

// Parse a Graph local wall-clock dateTime ("...:SS", no zone) as a local instant.
export function parseGraphDateTime(dateTime) {
  if (dateTime.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateTime)) {
    return new Date(dateTime)
  }
  const [datePart, timePart = '00:00:00'] = dateTime.split('T')
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h, mi, s] = timePart.split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi || 0, s || 0, 0)
}
