/**
 * Toast Component Tests
 *
 * Tests the Toast notification component
 */

import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import Toast from '../Toast'

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders success toast', () => {
    render(<Toast message="Success!" type="success" onClose={() => {}} />)

    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('renders error toast', () => {
    render(<Toast message="Error occurred" type="error" onClose={() => {}} />)

    expect(screen.getByText('Error occurred')).toBeInTheDocument()
    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  it('renders warning toast', () => {
    render(<Toast message="Warning!" type="warning" onClose={() => {}} />)

    expect(screen.getByText('Warning!')).toBeInTheDocument()
    expect(screen.getByText('⚠')).toBeInTheDocument()
  })

  it('renders info toast', () => {
    render(<Toast message="Information" type="info" onClose={() => {}} />)

    expect(screen.getByText('Information')).toBeInTheDocument()
    expect(screen.getByText('ℹ')).toBeInTheDocument()
  })

  it('auto-closes after specified duration', async () => {
    const onClose = jest.fn()

    render(<Toast message="Auto close" type="success" duration={1000} onClose={onClose} />)

    expect(onClose).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('uses default duration of 5000ms when not specified', async () => {
    const onClose = jest.fn()

    render(<Toast message="Default duration" type="success" onClose={onClose} />)

    act(() => {
      jest.advanceTimersByTime(4999)
    })

    expect(onClose).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(1)
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('does not auto-close when duration is 0', () => {
    const onClose = jest.fn()

    render(<Toast message="No auto close" type="success" duration={0} onClose={onClose} />)

    act(() => {
      jest.advanceTimersByTime(10000)
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('cleans up timer on unmount', () => {
    const onClose = jest.fn()

    const { unmount } = render(
      <Toast message="Will unmount" type="success" duration={5000} onClose={onClose} />
    )

    unmount()

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('applies correct CSS classes for success type', () => {
    const { container } = render(<Toast message="Success" type="success" onClose={() => {}} />)

    const toastElement = container.firstChild
    expect(toastElement).toHaveClass('bg-green-500/10')
  })

  it('applies correct CSS classes for error type', () => {
    const { container } = render(<Toast message="Error" type="error" onClose={() => {}} />)

    const toastElement = container.firstChild
    expect(toastElement).toHaveClass('bg-red-500/10')
  })

  it('applies correct CSS classes for warning type', () => {
    const { container } = render(<Toast message="Warning" type="warning" onClose={() => {}} />)

    const toastElement = container.firstChild
    expect(toastElement).toHaveClass('bg-yellow-500/10')
  })

  it('applies correct CSS classes for info type', () => {
    const { container } = render(<Toast message="Info" type="info" onClose={() => {}} />)

    const toastElement = container.firstChild
    expect(toastElement).toHaveClass('bg-blue-500/10')
  })
})
