import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import EndOfDayOverrun from './EndOfDayOverrun.jsx'
import BackToBack from './BackToBack.jsx'
import Fragmentation from './Fragmentation.jsx'
import RecoveryTime from './RecoveryTime.jsx'
import LongestMeetingBlock from './LongestMeetingBlock.jsx'
import FocusBlockDistribution from './FocusBlockDistribution.jsx'
import MorningAfternoon from './MorningAfternoon.jsx'
import FocusConsistency from './FocusConsistency.jsx'
import LongestFocusBlock from './LongestFocusBlock.jsx'
import MessageVolumeByHour from './MessageVolumeByHour.jsx'
import MeetingMultitasking from './MeetingMultitasking.jsx'
import ContextSwitching from './ContextSwitching.jsx'
import QuietestHour from './QuietestHour.jsx'
import ResponsePattern from './ResponsePattern.jsx'
import TeamsVsSlack from './TeamsVsSlack.jsx'

describe('EndOfDayOverrun', () => {
  it('shows only the days that ran over, with no empty rows or dashes', () => {
    const { container } = render(
      <EndOfDayOverrun
        workingEnd="18:00"
        overrun={{
          totalDays: 5,
          daysOver: 1,
          perDay: [
            { dateKey: '2025-06-23', weekday: 'Monday', overrunMinutes: 40, displayMinutes: 40 },
            { dateKey: '2025-06-24', weekday: 'Tuesday', overrunMinutes: 0, displayMinutes: 0 },
            { dateKey: '2025-06-25', weekday: 'Wednesday', overrunMinutes: 0, displayMinutes: 0 },
          ],
        }}
      />,
    )
    expect(screen.getByText(/past 18:00 on 1 of 5 days/)).toBeInTheDocument()
    // only the overrun day is a row
    expect(container.querySelectorAll('.hbar-row')).toHaveLength(1)
    expect(screen.getByText('Monday')).toBeInTheDocument()
    expect(screen.queryByText('Tuesday')).toBeNull()
    expect(container.textContent).not.toContain('—')
  })

  it('shows only the positive message and no rows for a clean week', () => {
    const { container } = render(
      <EndOfDayOverrun
        workingEnd="18:00"
        overrun={{
          totalDays: 5,
          daysOver: 0,
          perDay: [
            { dateKey: '2025-06-23', weekday: 'Monday', overrunMinutes: 0, displayMinutes: 0 },
            { dateKey: '2025-06-24', weekday: 'Tuesday', overrunMinutes: 0, displayMinutes: 0 },
          ],
        }}
      />,
    )
    expect(screen.getByText(/stayed within your working hours every day/)).toBeInTheDocument()
    expect(container.querySelectorAll('.hbar-row')).toHaveLength(0)
    expect(container.textContent).not.toContain('—')
  })
})


describe('BackToBack', () => {
  it('shows the rate and pairs', () => {
    render(
      <BackToBack
        backToBack={{
          totalMeetings: 11,
          count: 4,
          rate: 36,
          pairs: [{ weekday: 'Monday', from: 'Standup', to: 'Product sync', gapMinutes: 0 }],
        }}
      />,
    )
    expect(screen.getByText('36%')).toBeInTheDocument()
    expect(screen.getByText(/4 out of 11 meetings/)).toBeInTheDocument()
    expect(screen.getByText(/Standup → Product sync/)).toBeInTheDocument()
  })

  it('shows an empty state with no meetings', () => {
    render(<BackToBack backToBack={{ totalMeetings: 0, pairs: [] }} />)
    expect(screen.getByText(/No meetings found/)).toBeInTheDocument()
  })
})

describe('Fragmentation', () => {
  it('reports total time lost', () => {
    render(
      <Fragmentation
        fragmentation={{
          perDay: [{ dateKey: 'a', weekday: 'Monday', count: 3, lostMinutes: 45 }],
          totalLostMinutes: 115,
        }}
      />,
    )
    expect(screen.getByText(/lost 1h 55m this week/)).toBeInTheDocument()
  })
})

describe('RecoveryTime', () => {
  it('shows the average gap and distribution', () => {
    render(
      <RecoveryTime
        recovery={{ averageGapMinutes: 22, totalGaps: 20, distribution: { under10: 4, between: 7, over30: 9 } }}
      />,
    )
    expect(screen.getByText(/22 minutes/)).toBeInTheDocument()
    expect(screen.getByText('Under 10 min')).toBeInTheDocument()
  })
})

describe('LongestMeetingBlock', () => {
  it('describes the block or says none', () => {
    const { rerender } = render(<LongestMeetingBlock block={{ weekday: 'Wednesday', minutes: 220 }} />)
    expect(screen.getByText(/Wednesday/)).toBeInTheDocument()
    expect(screen.getByText(/3h 40m/)).toBeInTheDocument()
    rerender(<LongestMeetingBlock block={null} />)
    expect(screen.getByText(/No back-to-back meeting blocks/)).toBeInTheDocument()
  })
})

describe('FocusBlockDistribution', () => {
  it('summarises blocks and average', () => {
    render(
      <FocusBlockDistribution
        distribution={{
          buckets: [
            { key: 'under20', label: 'Under 20 min', counted: false, count: 0, minutes: 0 },
            { key: '20to30', label: '20–30 min', counted: true, count: 4, minutes: 120 },
          ],
          totalMinutes: 310,
          totalBlocks: 8,
          averageMinutes: 39,
        }}
      />,
    )
    expect(screen.getByText(/came in 8 blocks, averaging 39 minutes/)).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<FocusBlockDistribution distribution={{ buckets: [], totalBlocks: 0 }} />)
    expect(screen.getByText(/No focus blocks detected/)).toBeInTheDocument()
  })
})

describe('MorningAfternoon', () => {
  it('labels the stronger half', () => {
    render(
      <MorningAfternoon
        split={{ morningMinutes: 192, afternoonMinutes: 118, morningPct: 62, afternoonPct: 38, better: 'morning' }}
      />,
    )
    expect(screen.getByText('You focus better in the mornings.')).toBeInTheDocument()
    expect(screen.getByText('62%')).toBeInTheDocument()
  })
})

describe('FocusConsistency', () => {
  it('renders the verdict and dot plot rows', () => {
    render(
      <FocusConsistency
        consistency={{ level: 'low', perDay: [{ dateKey: 'a', weekday: 'Monday', starts: [600] }] }}
      />,
    )
    expect(screen.getByText(/focus time is consistent/)).toBeInTheDocument()
  })
})

describe('LongestFocusBlock', () => {
  it('describes the longest block', () => {
    render(<LongestFocusBlock block={{ weekday: 'Tuesday', minutes: 100, startMinute: 620 }} />)
    expect(screen.getByText(/1h 40m/)).toBeInTheDocument()
    expect(screen.getByText(/10:20/)).toBeInTheDocument()
  })
})

describe('MessageVolumeByHour', () => {
  it('labels the busiest hour and shows source legend', () => {
    render(
      <MessageVolumeByHour
        volume={{
          hours: [{ startMinute: 540, label: '09:00–10:00', teams: 3, slack: 1, total: 4 }],
          busiest: { startMinute: 540, label: '09:00–10:00', total: 4 },
        }}
      />,
    )
    expect(screen.getByText(/Busiest hour: 09:00–10:00/)).toBeInTheDocument()
    expect(screen.getByText('Teams')).toBeInTheDocument()
    expect(screen.getByText('Slack')).toBeInTheDocument()
  })

  it('renders bar lengths proportional to message count (issue #7)', () => {
    const { container } = render(
      <MessageVolumeByHour
        volume={{
          hours: [
            { startMinute: 540, label: '09:00–10:00', teams: 10, slack: 5, total: 15 },
            { startMinute: 600, label: '10:00–11:00', teams: 3, slack: 0, total: 3 },
            { startMinute: 660, label: '11:00–12:00', teams: 0, slack: 0, total: 0 },
          ],
          busiest: { startMinute: 540, label: '09:00–10:00', total: 15 },
        }}
      />,
    )
    const bars = container.querySelectorAll('.vol-bar')
    expect(bars[0].style.width).toBe('100%') // busiest -> full width
    expect(bars[1].style.width).toBe('20%') // 3/15
    expect(bars[2].style.width).toBe('0%') // no messages
  })
})

describe('MeetingMultitasking', () => {
  it('shows the headline count and breakdown', () => {
    render(
      <MeetingMultitasking
        multitasking={{ total: 31, perMeeting: [{ subject: 'Standup', messages: 12, occurrences: 3 }] }}
      />,
    )
    expect(screen.getByText(/sent 31 messages during meetings/)).toBeInTheDocument()
    expect(screen.getByText(/12 messages across 3 occurrences/)).toBeInTheDocument()
  })

  it('praises zero multitasking', () => {
    render(<MeetingMultitasking multitasking={{ total: 0, perMeeting: [] }} />)
    expect(screen.getByText(/No messages sent during meetings this week. Well done./)).toBeInTheDocument()
  })
})

describe('ContextSwitching', () => {
  it('explains the definition and frames high counts', () => {
    render(
      <ContextSwitching
        switching={{ perDay: [{ dateKey: 'a', weekday: 'Monday', count: 6 }], total: 17 }}
      />,
    )
    expect(screen.getByText(/3 or more different channels or chats/)).toBeInTheDocument()
    expect(screen.getByText(/High context switching this week/)).toBeInTheDocument()
  })

  it('frames low and moderate counts differently', () => {
    const { rerender } = render(
      <ContextSwitching switching={{ perDay: [{ dateKey: 'a', weekday: 'Monday', count: 2 }], total: 3 }} />,
    )
    expect(screen.getByText(/Low context switching/)).toBeInTheDocument()
    rerender(
      <ContextSwitching switching={{ perDay: [{ dateKey: 'a', weekday: 'Monday', count: 6 }], total: 10 }} />,
    )
    expect(screen.getByText(/Moderate context switching/)).toBeInTheDocument()
  })
})

describe('QuietestHour', () => {
  it('names the quietest hour', () => {
    render(<QuietestHour quietest={{ label: '14:00–15:00' }} />)
    expect(screen.getByText(/14:00–15:00/)).toBeInTheDocument()
  })
})

describe('ResponsePattern', () => {
  it('renders buckets when sufficient', () => {
    render(<ResponsePattern pattern={{ sufficient: true, immediate: 62, considered: 28, async: 10 }} />)
    expect(screen.getByText(/respond immediately to 62%/)).toBeInTheDocument()
  })

  it('shows insufficient-data message', () => {
    render(<ResponsePattern pattern={{ sufficient: false }} />)
    expect(screen.getByText(/Not enough message data/)).toBeInTheDocument()
  })
})

describe('TeamsVsSlack', () => {
  it('shows the split and pattern note', () => {
    render(
      <TeamsVsSlack split={{ teamsPct: 68, slackPct: 32, teamsCount: 68, slackCount: 32, patternHolds: true }} />,
    )
    expect(screen.getByText('This week: 68% Teams · 32% Slack')).toBeInTheDocument()
    expect(screen.getByText(/Teams more on meeting-heavy days/)).toBeInTheDocument()
  })

  it('shows empty state with no messages', () => {
    render(<TeamsVsSlack split={{ teamsCount: 0, slackCount: 0 }} />)
    expect(screen.getByText(/No messages found/)).toBeInTheDocument()
  })
})
