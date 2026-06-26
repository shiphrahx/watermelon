import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PrivacyNotice from './PrivacyNotice.jsx'
import { isPrivacyNoticeDismissed } from '../utils/privacy.js'

beforeEach(() => localStorage.clear())

describe('PrivacyNotice', () => {
  it('shows the notice and dismisses it once', () => {
    const { container } = render(<PrivacyNotice />)
    expect(screen.getByText(/processed in your browser/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(container.firstChild).toBeNull()
    expect(isPrivacyNoticeDismissed()).toBe(true)
  })

  it('does not render when already dismissed', () => {
    localStorage.setItem('watermelon.privacyNoticeDismissed', '1')
    const { container } = render(<PrivacyNotice />)
    expect(container.firstChild).toBeNull()
  })
})
