// One-time privacy-notice dismissal flag.

const KEY = 'watermelon.privacyNoticeDismissed'

export function isPrivacyNoticeDismissed() {
  return localStorage.getItem(KEY) === '1'
}

export function dismissPrivacyNotice() {
  localStorage.setItem(KEY, '1')
}
