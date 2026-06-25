import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import EndOfDayOverrun from './EndOfDayOverrun.jsx'
import FocusRateTrend from './FocusRateTrend.jsx'
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
  it('summarises days that ran over', () => {
    render(
      <EndOfDayOverrun
        workingEnd="18:00"
        overrun={{
          totalDays: 5,
          daysOver: 3,
          perDay: [{ dateKey: '2025-06-23', weekday: 'Monday', overrunMinutes: 40, displayMinutes: 40 }],
        }}
      />,
    )
    expect(screen.getByText(/past 18:00 on 3 of 5 days/)).toBeInTheDocument()
  })

  it('congratulates a clean week', () => {
    render(<EndOfDayOverrun workingEnd="18:00" overrun={{ totalDays: 5, daysOver: 0, perDay: [] }} />)
    expect(screen.getByText(/stayed within your working hours every day/)).toBeInTheDocument()
  })
})

describe('FocusRateTrend', () => {
  it('labels the high and low points', () => {
    render(
      <FocusRateTrend
        trend={{
          rows: [
            { dateKey: '2025-06-23', weekday: 'Monday', focusRate: 20 },
            { dateKey: '2025-06-24', weekday: 'Tuesday', focusRate: 80 },
          ],
          high: { weekday: 'Tuesday', focusRate: 80 },
          low: { weekday: 'Monday', focusRate: 20 },
        }}
      />,
    )
    expect(screen.getByText(/High: Tuesday 80%/)).toBeInTheDocument()
    expect(screen.getByText(/Low: Monday 20%/)).toBeInTheDocument()
  })

  it('shows an empty state', () => {
    render(<FocusRateTrend trend={{ rows: [] }} />)
    expect(screen.getByText(/No focus data/)).toBeInTheDocument()
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
          busiest: { label: '09:00–10:00', total: 4 },
        }}
      />,
    )
    expect(screen.getByText(/Busiest hour: 09:00–10:00/)).toBeInTheDocument()
    expect(screen.getByText('Teams')).toBeInTheDocument()
    expect(screen.getByText('Slack')).toBeInTheDocument()
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
