// Meetings tab: recurring cost, decline candidates, back-to-back, inter-meeting
// gaps, top consumers, and the longest unbroken meeting block.

import { useMemo } from 'react'
import TopConsumers from '../panels/TopConsumers.jsx'
import BackToBack from '../panels/BackToBack.jsx'
import InterMeetingGaps from '../panels/InterMeetingGaps.jsx'
import LongestMeetingBlock from '../panels/LongestMeetingBlock.jsx'
import RecurringMeetingCost from '../panels/RecurringMeetingCost.jsx'
import DeclineCandidates from '../panels/DeclineCandidates.jsx'
import {
  topConsumers,
  backToBack,
  interMeetingGaps,
  longestMeetingBlock,
} from '../../analysis/meetings.js'
import { declineCandidates } from '../../analysis/messaging.js'
import { recurringAudit } from '../../analysis/recurring.js'
import { getAllWeeks } from '../../storage/history.js'
import KpiCard from '../ui/KpiCard.jsx'
import { formatDuration } from '../../utils/time.js'

export default function MeetingsTab({ days }) {
  const data = useMemo(
    () => ({
      consumers: topConsumers(days),
      b2b: backToBack(days),
      gaps: interMeetingGaps(days),
      longest: longestMeetingBlock(days),
      recurring: recurringAudit({ weeks: getAllWeeks(), days }),
      decline: declineCandidates(days),
    }),
    [days],
  )

  return (
    <>
      <div className="insight-cards">
        <KpiCard icon="🔁" label="Back-to-back" value={`${Math.round(data.b2b.rate)}%`} />
        <KpiCard icon="🧩" label="Lost to short gaps" small value={formatDuration(data.gaps.tooShortMinutes)} />
        <KpiCard icon="📋" label="Recurring meetings" value={data.recurring.items.length} />
      </div>
      <div className="split">
        <RecurringMeetingCost audit={data.recurring} />
        <DeclineCandidates candidates={data.decline} />
      </div>
      <div className="panels">
        <BackToBack backToBack={data.b2b} />
        <InterMeetingGaps gaps={data.gaps} />
        <TopConsumers topConsumers={data.consumers} />
        <LongestMeetingBlock block={data.longest} />
      </div>
    </>
  )
}
