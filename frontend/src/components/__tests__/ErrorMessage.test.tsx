/**
 * ErrorMessage Component Tests
 */

import { render, screen } from '@testing-library/react'
import ErrorMessage from '../ErrorMessage'

describe('ErrorMessage', () => {
  it('renders error message', () => {
    const errorText = 'Something went wrong'
    render(<ErrorMessage message={errorText} />)

    expect(screen.getByText(errorText)).toBeInTheDocument()
  })

  it('renders error icon', () => {
    render(<ErrorMessage message="Error" />)

    expect(screen.getByText('⚠️')).toBeInTheDocument()
  })

  it('applies error styling', () => {
    const { container } = render(<ErrorMessage message="Error" />)

    const errorElement = container.firstChild
    expect(errorElement).toHaveClass('bg-red-500/10', 'border-red-500/20')
  })

  it('renders long error messages', () => {
    const longError = 'This is a very long error message that should still be displayed correctly without breaking the layout or causing any visual issues'
    render(<ErrorMessage message={longError} />)

    expect(screen.getByText(longError)).toBeInTheDocument()
  })

  it('handles empty message', () => {
    render(<ErrorMessage message="" />)

    expect(screen.queryByText('⚠️')).toBeInTheDocument()
  })

  it('renders with correct role for accessibility', () => {
    const { container } = render(<ErrorMessage message="Error" />)

    const alertElement = container.querySelector('[role="alert"]')
    expect(alertElement).toBeInTheDocument()
  })
})
