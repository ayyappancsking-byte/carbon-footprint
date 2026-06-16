import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { PersonalizedInsights } from './PersonalizedInsights'
import type { CarbonFootprintBreakdown } from '../lib/carbonEngine'

describe('PersonalizedInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mockBreakdown: CarbonFootprintBreakdown = {
    transport: 2.5,
    homeEnergy: 1.2,
    diet: 1.5,
    goodsAndWaste: 0.8,
    total: 6.0,
    breakdown: {
      transportDetail: {
        car: 2.0,
        transit: 0.4,
        flights: 0.1,
      },
      homeEnergyDetail: {
        electricity: 0.7,
        gas: 0.5,
      },
    },
  }

  it('should render loading state initially', () => {
    render(<PersonalizedInsights breakdown={mockBreakdown} />)
    expect(screen.getByText('Generating your personalized insights...')).toBeInTheDocument()
  })

  it('should render with personalized insights header', async () => {
    render(<PersonalizedInsights breakdown={mockBreakdown} />)
    const header = screen.getByText('Personalized Insights')
    expect(header).toBeInTheDocument()
  })

  it('should display recommendations grid after loading', async () => {
    render(<PersonalizedInsights breakdown={mockBreakdown} />)
    await waitFor(() => {
      const grid = document.querySelector('.recommendations-grid')
      expect(grid).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should not display recommendations while loading', () => {
    render(<PersonalizedInsights breakdown={mockBreakdown} />)
    const grid = document.querySelector('.recommendations-grid')
    expect(grid).not.toBeInTheDocument()
  })
})
