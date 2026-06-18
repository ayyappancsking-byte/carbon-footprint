import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import HistoryChart from './HistoryChart'

const { tooltipFormatterMock } = vi.hoisted(() => ({
  tooltipFormatterMock: vi.fn(),
}))

vi.mock('recharts', () => ({
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Line: () => <div data-testid="line" />,
  LineChart: ({ children, data }: { children: ReactNode; data: Array<{ date: string; total: number }> }) => (
    <div data-testid="line-chart" data-count={data.length}>
      {children}
    </div>
  ),
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: ({ formatter }: { formatter?: (value: number) => string }) => {
    const formattedValue = formatter?.(12.345)
    tooltipFormatterMock(formattedValue)
    return <div data-testid="tooltip-value">{formattedValue}</div>
  },
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
}))

describe('HistoryChart', () => {
  it('renders the chart shell and tooltip formatter output', () => {
    render(
      <HistoryChart
        data={[
          { date: 'Jun 1', total: 5.5 },
          { date: 'Jul 1', total: 4.25 },
        ]}
      />,
    )

    expect(
      screen.getByRole('img', { name: /carbon footprint history line chart showing total emissions over time/i }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toHaveAttribute('data-count', '2')
    expect(screen.getByTestId('tooltip-value')).toHaveTextContent('12.35 t')
    expect(tooltipFormatterMock).toHaveBeenCalledOnce()
  })
})
