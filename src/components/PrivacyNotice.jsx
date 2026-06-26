// One-time, dismissible privacy note explaining what Watermelon reads and why.

import { useState } from 'react'
import { isPrivacyNoticeDismissed, dismissPrivacyNotice } from '../utils/privacy.js'

export default function PrivacyNotice() {
  const [dismissed, setDismissed] = useState(isPrivacyNoticeDismissed())
  if (dismissed) return null

  function handleDismiss() {
    dismissPrivacyNotice()
    setDismissed(true)
  }

  return (
    <div className="privacy-notice" role="note">
      <p>
        Watermelon reads your calendar and message <strong>metadata</strong> (event times, message
        timestamps) to analyse your week. Everything is processed in your browser — only small
        aggregated summaries are stored on this device, and nothing is sent to any third party.
      </p>
      <button onClick={handleDismiss}>Got it</button>
    </div>
  )
}
