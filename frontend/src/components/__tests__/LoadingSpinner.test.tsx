/**
 * LoadingSpinner Component Tests
 */

import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders loading spinner', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('renders loading text', () => {
    render(<LoadingSpinner />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('has spinning animation', () => {
    const { container } = render(<LoadingSpinner />)

    const animatedElement = container.querySelector('.animate-spin')
    expect(animatedElement).toBeInTheDocument()
  })

  it('applies correct CSS classes', () => {
    const { container } = render(<LoadingSpinner />)

    const spinner = container.firstChild
    expect(spinner).toHaveClass('flex', 'items-center', 'justify-center')
  })

  it('has accessibility attribute', () => {
    const { container } = render(<LoadingSpinner />)

    const spinner = container.querySelector('[role="status"]')
    expect(spinner).toBeInTheDocument()
  })

  it('renders centered layout', () => {
    const { container } = render(<LoadingSpinner />)

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('flex-col')
  })
})
