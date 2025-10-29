/**
 * StatsCard Component Tests
 */

import { render, screen } from '@testing-library/react'
import StatsCard from '../StatsCard'

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Total Users" value="1,234" />)

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('renders numeric value', () => {
    render(<StatsCard title="Count" value={42} />)

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders with subtitle', () => {
    render(<StatsCard title="Total" value="100" subtitle="Last 24h" />)

    expect(screen.getByText('Last 24h')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    const icon = <span data-testid="test-icon">🎯</span>
    render(<StatsCard title="Goals" value="10" icon={icon} />)

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('renders upward trend', () => {
    render(
      <StatsCard title="Users" value="100" trend="up" trendValue="+15%" />
    )

    expect(screen.getByText('↗')).toBeInTheDocument()
    expect(screen.getByText('+15%')).toBeInTheDocument()
  })

  it('renders downward trend', () => {
    render(
      <StatsCard title="Users" value="100" trend="down" trendValue="-5%" />
    )

    expect(screen.getByText('↘')).toBeInTheDocument()
    expect(screen.getByText('-5%')).toBeInTheDocument()
  })

  it('renders neutral trend', () => {
    render(
      <StatsCard title="Users" value="100" trend="neutral" trendValue="0%" />
    )

    expect(screen.getByText('→')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('applies correct trend color for up', () => {
    const { container } = render(
      <StatsCard title="Users" value="100" trend="up" trendValue="+15%" />
    )

    const trendElement = container.querySelector('.text-green-400')
    expect(trendElement).toBeInTheDocument()
  })

  it('applies correct trend color for down', () => {
    const { container } = render(
      <StatsCard title="Users" value="100" trend="down" trendValue="-5%" />
    )

    const trendElement = container.querySelector('.text-red-400')
    expect(trendElement).toBeInTheDocument()
  })

  it('applies correct trend color for neutral', () => {
    const { container } = render(
      <StatsCard title="Users" value="100" trend="neutral" trendValue="0%" />
    )

    const trendElement = container.querySelector('.text-gray-400')
    expect(trendElement).toBeInTheDocument()
  })

  it('renders without trend when not provided', () => {
    const { container } = render(<StatsCard title="Total" value="100" />)

    expect(container.querySelector('.text-green-400')).not.toBeInTheDocument()
    expect(container.querySelector('.text-red-400')).not.toBeInTheDocument()
  })

  it('renders with all props', () => {
    const icon = <span data-testid="icon">📊</span>

    render(
      <StatsCard
        title="Revenue"
        value="$10,000"
        subtitle="This month"
        icon={icon}
        trend="up"
        trendValue="+20%"
        delay={0.2}
      />
    )

    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('$10,000')).toBeInTheDocument()
    expect(screen.getByText('This month')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('↗')).toBeInTheDocument()
    expect(screen.getByText('+20%')).toBeInTheDocument()
  })

  it('handles long values', () => {
    render(<StatsCard title="Total" value="1,234,567,890" />)

    expect(screen.getByText('1,234,567,890')).toBeInTheDocument()
  })

  it('handles special characters in value', () => {
    render(<StatsCard title="Amount" value="$1,234.56" />)

    expect(screen.getByText('$1,234.56')).toBeInTheDocument()
  })

  it('renders without subtitle when not provided', () => {
    render(<StatsCard title="Total" value="100" />)

    expect(screen.queryByText('Last 24h')).not.toBeInTheDocument()
  })

  it('applies glass styling', () => {
    const { container } = render(<StatsCard title="Test" value="100" />)

    const card = container.firstChild
    expect(card).toHaveClass('glass')
  })
})
