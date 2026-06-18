import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { PersonalizedInsights } from './PersonalizedInsights'
import type { CarbonFootprintBreakdown } from '../lib/carbonEngine'
import type { Recommendation } from '../lib/insightsEngine'

const { generatePersonalizedInsightsMock } = vi.hoisted(() => ({
  generatePersonalizedInsightsMock: vi.fn(),
}))

vi.mock('../lib/insightsEngine', () => ({
  generatePersonalizedInsights: generatePersonalizedInsightsMock,
}))

const mockBreakdown: CarbonFootprintBreakdown = {
  transport: 2.5,
  homeEnergy: 1.2,
  diet: 1.5,
  goodsAndWaste: 0.8,
  total: 6,
  breakdown: {
    transportDetail: {
      car: 2,
      transit: 0.4,
      flights: 0.1,
    },
    homeEnergyDetail: {
      electricity: 0.7,
      gas: 0.5,
    },
  },
}

const mockRecommendations: Recommendation[] = [
  {
    category: 'Transport',
    action: 'Take the bus twice a week',
    potentialSavingKg: 120,
  },
  {
    category: 'Home Energy',
    action: 'Switch to LED bulbs',
    potentialSavingKg: 80,
  },
]

describe('PersonalizedInsights', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    generatePersonalizedInsightsMock.mockReset()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders the loading state before insights resolve', async () => {
    generatePersonalizedInsightsMock.mockResolvedValue({
      usedAI: false,
      recommendations: mockRecommendations,
    })

    render(<PersonalizedInsights breakdown={mockBreakdown} />)

    expect(
      screen.getByRole('status', { name: /Loading personalized insights/i }),
    ).toBeInTheDocument()

    await screen.findByText('Quick Tips')
  })

  it('renders AI-powered recommendations and tracks commitment state', async () => {
    generatePersonalizedInsightsMock.mockResolvedValue({
      usedAI: true,
      recommendations: mockRecommendations,
    })

    render(<PersonalizedInsights breakdown={mockBreakdown} />)

    expect(await screen.findByText('AI-Personalized')).toBeInTheDocument()
    expect(screen.getByText('Take the bus twice a week')).toBeInTheDocument()
    expect(screen.getByText('Switch to LED bulbs')).toBeInTheDocument()

    const checkbox = screen.getByRole('checkbox', {
      name: /I'll try this: Take the bus twice a week/i,
    })
    fireEvent.click(checkbox)

    expect(checkbox).toBeChecked()
    expect(screen.getByRole('status')).toHaveTextContent(
      /1 action - potential saving: 120 kg CO2e\/year/i,
    )

    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(screen.queryByText(/Your Commitment/i)).not.toBeInTheDocument()
    })
  })

  it('falls back to quick tips when insight generation fails', async () => {
    generatePersonalizedInsightsMock.mockRejectedValue(new Error('boom'))

    render(<PersonalizedInsights breakdown={mockBreakdown} />)

    expect(await screen.findByText('Quick Tips')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})
