// Erase all locally-stored Watermelon data: weekly summaries, manual
// corrections, settings (goals/working hours), the privacy-notice flag, and the
// Slack token. Microsoft sign-out is handled by the caller (auth concern).

import { clearHistory } from './history.js'
import { clearAllCorrections } from './corrections.js'
import { logoutSlack } from '../auth/slack.js'

export function eraseLocalData() {
  clearHistory()
  clearAllCorrections()
  localStorage.removeItem('watermelon.settings')
  localStorage.removeItem('watermelon.privacyNoticeDismissed')
  logoutSlack()
}
