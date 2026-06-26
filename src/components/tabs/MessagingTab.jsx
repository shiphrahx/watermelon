// Messaging tab: stat row, primary+secondary split, then detail grid.

import { useMemo } from 'react'
import MessageVolumeByHour from '../panels/MessageVolumeByHour.jsx'
import MeetingMultitasking from '../panels/MeetingMultitasking.jsx'
import ContextSwitching from '../panels/ContextSwitching.jsx'
import QuietestHour from '../panels/QuietestHour.jsx'
import ResponsePattern from '../panels/ResponsePattern.jsx'
import TeamsVsSlack from '../panels/TeamsVsSlack.jsx'
import KpiCard from '../ui/KpiCard.jsx'
import {
  messageVolumeByHour,
  meetingMultitasking,
  contextSwitching,
  quietestHour,
  responsePattern,
  teamsVsSlack,
} from '../../analysis/messaging.js'

export default function MessagingTab({ days, workingStart, workingEnd }) {
  const data = useMemo(
    () => ({
      volume: messageVolumeByHour(days, workingStart, workingEnd),
      multitasking: meetingMultitasking(days),
      switching: contextSwitching(days),
      quietest: quietestHour(days, workingStart, workingEnd),
      pattern: responsePattern(days),
      split: teamsVsSlack(days),
    }),
    [days, workingStart, workingEnd],
  )

  return (
    <>
      <div className="insight-cards">
        <KpiCard icon="💬" label="Msgs in meetings" value={data.multitasking.total} />
        <KpiCard icon="🔀" label="Context switches" value={data.switching.total} />
        <KpiCard icon="🕘" label="Busiest hour" small value={data.volume.busiest?.label || '—'} />
      </div>
      <div className="split">
        <MessageVolumeByHour volume={data.volume} />
        <TeamsVsSlack split={data.split} />
      </div>
      <div className="panels">
        <MeetingMultitasking multitasking={data.multitasking} />
        <ContextSwitching switching={data.switching} />
        <QuietestHour quietest={data.quietest} />
        <ResponsePattern pattern={data.pattern} />
      </div>
    </>
  )
}
