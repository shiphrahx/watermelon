// Deterministic mock-data generator.
//
// Produces fake-but-realistic Microsoft Graph calendar events, Teams chat
// messages and Slack messages whose shapes match the real APIs exactly.
//
// Determinism: no Math.random(). Output is a pure function of the date +
// profile, so the same date/profile always yields identical data (predictable
// UI development). The only runtime input is "today", passed in explicitly.

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
// Meeting templates per profile. Designed so the week contains realistic
// scheduling pressure: heavy-meetings & mixed have back-to-back blocks (gap
// < 5 min), and mixed/comms-heavy/heavy have inter-meeting gaps under 20 min
// (so the fragmentation panel is non-empty).
const MEETINGS = {
  'heavy-meetings': [
    // 3 morning meetings with gaps under 10 minutes between them.
    ['Daily standup', M(9, 0), M(9, 30), 'accepted', true],
    ['Sprint planning', M(9, 30), M(10, 30), 'accepted', true], // 0-min gap (back-to-back)
    ['Design review', M(10, 35), M(11, 30), 'accepted', true], // 5-min gap (< 10, < 20)
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
    ['Triage sync', M(10, 10), M(10, 40), 'accepted', true], // 10-min gap (< 20)
    ['1:1 with manager', M(15, 0), M(15, 30), 'accepted', true],
    ['Lunch & learn', M(12, 30), M(13, 0), 'declined', false],
  ],
  mixed: [
    ['Daily standup', M(9, 30), M(10, 0), 'accepted', true],
    ['Discovery call', M(10, 15), M(11, 0), 'accepted', true], // 15-min gap (< 20)
    ['Project review', M(11, 0), M(12, 0), 'accepted', true], // 0-min gap (back-to-back)
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

// Other participants — used to seed incoming messages so the user's replies can
// be recognised as responses to someone else (not just consecutive self-sends).
const OTHER_SLACK_USERS = ['U999AAA01', 'U888BBB02']
const OTHER_TEAMS_USERS = [
  { displayName: 'Dev A', id: 'user_777' },
  { displayName: 'PM B', id: 'user_888' },
]

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

function makeTeamsMessage(date, n, instant, sender = TEAMS_USER, chatId) {
  const text = TEAMS_TEXTS[n % TEAMS_TEXTS.length]
  return {
    id: `tmsg_${dateKeyOf(date)}_${pad(n)}`,
    createdDateTime: instant.toISOString(),
    from: { user: { displayName: sender.displayName, id: sender.id } },
    body: { content: text, contentType: 'text' },
    chatId: chatId || TEAMS_CHATS[n % TEAMS_CHATS.length],
  }
}

function makeSlackMessage(date, n, instant, channel, user = SLACK_USER) {
  const text = SLACK_TEXTS[n % SLACK_TEXTS.length]
  return {
    ts: (instant.getTime() / 1000).toFixed(6),
    user,
    text,
    channel,
    type: 'message',
  }
}

// Target number of context switches (15-min windows touching 3+ conversations)
// per profile. comms-heavy is highest; focus-day has none.
const CONTEXT_SWITCHES = {
  'comms-heavy': 7,
  mixed: 5,
  'heavy-meetings': 4,
  light: 2,
  'focus-day': 0,
}
const BURST_SLOTS = [M(9, 0), M(9, 30), M(10, 0), M(10, 30), M(11, 0), M(11, 30), M(13, 30), M(14, 0)]

// Each burst emits 3 messages in 3 distinct conversations within one 15-minute
// window — counted as exactly one context switch.
function buildContextBursts(date, profile) {
  const k = CONTEXT_SWITCHES[profile] ?? 0
  const teams = []
  const slack = []
  const key = dateKeyOf(date)
  for (let i = 0; i < k; i++) {
    const slot = BURST_SLOTS[i % BURST_SLOTS.length]
    slack.push(makeSlackMessage(date, 800 + i * 3, localAt(date, slot + 2), `CB_${key}_${i}_a`))
    teams.push(makeTeamsMessage(date, 800 + i * 3 + 1, localAt(date, slot + 6), TEAMS_USER, `chat_b_${key}_${i}`))
    slack.push(makeSlackMessage(date, 800 + i * 3 + 2, localAt(date, slot + 10), `CB_${key}_${i}_c`))
  }
  return { teams, slack }
}

// Build incoming/reply thread pairs for a day. Each pair is a message from
// another user followed by the user's reply after a chosen gap, giving a
// deterministic mix of immediate / considered / async responses.
function buildReplyThreads(date, dayIndex) {
  const teams = []
  const slack = []
  const specs = [
    { startMin: M(13, 30), gap: 2, platform: 'slack' }, // immediate (< 5)
    { startMin: M(13, 50), gap: 12, platform: 'teams' }, // considered (5–30)
    { startMin: M(14, 10), gap: 45, platform: 'slack' }, // async (> 30)
    { startMin: M(16, 0), gap: 3, platform: 'teams' }, // immediate (< 5)
  ]
  const key = dateKeyOf(date)
  specs.forEach((s, i) => {
    const t0 = localAt(date, s.startMin)
    const t1 = localAt(date, s.startMin + s.gap)
    if (s.platform === 'slack') {
      // Dedicated thread channel so the only sender change is the reply itself.
      const channel = `CT_${key}_${i}`
      const other = OTHER_SLACK_USERS[i % OTHER_SLACK_USERS.length]
      slack.push(makeSlackMessage(date, 900 + i, t0, channel, other))
      slack.push(makeSlackMessage(date, 920 + i, t1, channel, SLACK_USER))
    } else {
      const chatId = `chat_t_${key}_${i}`
      const other = OTHER_TEAMS_USERS[i % OTHER_TEAMS_USERS.length]
      teams.push(makeTeamsMessage(date, 900 + i, t0, other, chatId))
      teams.push(makeTeamsMessage(date, 920 + i, t1, TEAMS_USER, chatId))
    }
  })
  return { teams, slack }
}

// Per-profile messaging-block schedule (minute ranges of dense messaging). The
// schedule is laid out in non-meeting time and leaves deliberate gaps so the
// classifier produces a realistic mix of comms, shallow work and deep focus.
//
//  - focus-day  : almost no messaging -> long deep-focus stretches
//  - comms-heavy: near-continuous blocks with small (<=20 min) gaps -> little focus
//  - mixed/heavy/light: a handful of blocks with focus gaps in between
const MESSAGING_BLOCKS = {
  'heavy-meetings': [
    [M(11, 35), M(12, 0)],
    [M(13, 30), M(13, 55)],
    [M(16, 5), M(16, 30)],
  ],
  'focus-day': [
    [M(11, 0), M(11, 20)],
  ],
  'comms-heavy': [
    [M(10, 45), M(11, 15)],
    [M(11, 25), M(12, 0)],
    [M(12, 10), M(12, 40)],
    [M(12, 50), M(13, 25)],
    [M(13, 35), M(14, 10)],
    [M(14, 20), M(14, 55)],
    [M(15, 35), M(16, 10)],
    [M(16, 20), M(17, 0)],
  ],
  mixed: [
    [M(12, 5), M(12, 30)],
    [M(13, 0), M(13, 25)],
    [M(15, 10), M(15, 40)],
    [M(16, 35), M(17, 0)],
  ],
  light: [
    [M(10, 30), M(10, 50)],
    [M(14, 0), M(14, 20)],
  ],
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

  // Messaging blocks: dense clusters (a message roughly every 3 minutes) that
  // classify as "Responding & messaging". The gaps the schedule leaves between
  // blocks become shallow work (5–20 min) or deep focus (20+ min). The silence
  // around the blocks (and on quiet profiles) is where deep focus accrues.
  const slackChannels = [...SLACK_CHANNELS, SLACK_DM] // include a DM
  for (const [from, to] of MESSAGING_BLOCKS[profile] || []) {
    let toggle = dayIndex % 2 === 0
    for (let m = from; m <= to; m += 3) {
      if (toggle) {
        teamsMessages.push(makeTeamsMessage(date, tN++, localAt(date, m)))
      } else {
        slackMessages.push(
          makeSlackMessage(date, sN++, localAt(date, m), slackChannels[sN % slackChannels.length]),
        )
      }
      toggle = !toggle
    }
  }

  // --- Context-switch bursts ---
  // Deterministically seed 15-minute windows that touch 3+ distinct
  // conversations, so the context-switching panel reflects realistic behaviour
  // (comms-heavy days highest, focus days lowest).
  const bursts = buildContextBursts(date, profile)
  teamsMessages.push(...bursts.teams)
  slackMessages.push(...bursts.slack)

  // --- Reply threads (incoming message from another user -> the user's reply) ---
  // Seeds realistic response-time data: a deterministic mix of immediate
  // (< 5 min), considered (5–30 min) and async (30 min+) replies.
  const threads = buildReplyThreads(date, dayIndex)
  teamsMessages.push(...threads.teams)
  slackMessages.push(...threads.slack)

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

// Friday of the working week containing `date`.
function weekFriday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dow = d.getDay() // 0 Sun .. 6 Sat
  const toMonday = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + toMonday + 4) // Monday + 4 = Friday
  return d
}

// The working days the dataset covers: anchored on the current week's Friday so
// the whole current week (Mon–Fri) always has data, going back far enough to
// total PROFILE_SEQUENCE.length days. Oldest first.
export function datasetDays(today, count = PROFILE_SEQUENCE.length) {
  return recentWorkingDays(weekFriday(today), count)
}

// Build the full deterministic dataset covering the current week plus enough
// prior working days to total PROFILE_SEQUENCE.length.
export function buildRecentDataset(today) {
  const days = datasetDays(today)
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
