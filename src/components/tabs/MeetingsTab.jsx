// Meetings tab: top consumers, back-to-back rate, fragmentation, recovery time,
// and the longest unbroken meeting block.

import { useMemo } from 'react'
import TopConsumers from '../panels/TopConsumers.jsx'
import BackToBack from '../panels/BackToBack.jsx'
import Fragmentation from '../panels/Fragmentation.jsx'
import InterMeetingGaps from '../panels/InterMeetingGaps.jsx'
import LongestMeetingBlock from '../panels/LongestMeetingBlock.jsx'
import RecurringMeetingCost from '../panels/RecurringMeetingCost.jsx'
import {
  topConsumers,
  backToBack,
  fragmentation,
  interMeetingGaps,
  longestMeetingBlock,
} from '../../analysis/meetings.js'
import { recurringAudit } from '../../analysis/recurring.js'
import { getAllWeeks } from '../../storage/history.js'

export default function MeetingsTab({ days }) {
  const data = useMemo(
    () => ({
      consumers: topConsumers(days),
      b2b: backToBack(days),
      frag: fragmentation(days),
      gaps: interMeetingGaps(days),
      longest: longestMeetingBlock(days),
      recurring: recurringAudit({ weeks: getAllWeeks(), days }),
    }),
    [days],
  )

  return (
    <div className="panels">
      <TopConsumers topConsumers={data.consumers} />
      <RecurringMeetingCost audit={data.recurring} />
      <BackToBack backToBack={data.b2b} />
      <Fragmentation fragmentation={data.frag} />
      <InterMeetingGaps gaps={data.gaps} />
      <LongestMeetingBlock block={data.longest} />
    </div>
  )
}
