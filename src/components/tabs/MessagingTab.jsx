// Messaging tab: volume by hour, meeting multitasking, context switching,
// quietest hour, response pattern, and Teams/Slack split.

import { useMemo } from 'react'
import MessageVolumeByHour from '../panels/MessageVolumeByHour.jsx'
import MeetingMultitasking from '../panels/MeetingMultitasking.jsx'
import ContextSwitching from '../panels/ContextSwitching.jsx'
import QuietestHour from '../panels/QuietestHour.jsx'
import ResponsePattern from '../panels/ResponsePattern.jsx'
import TeamsVsSlack from '../panels/TeamsVsSlack.jsx'
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
    <div className="panels">
      <MessageVolumeByHour volume={data.volume} />
      <MeetingMultitasking multitasking={data.multitasking} />
      <ContextSwitching switching={data.switching} />
      <QuietestHour quietest={data.quietest} />
      <ResponsePattern pattern={data.pattern} />
      <TeamsVsSlack split={data.split} />
    </div>
  )
}
