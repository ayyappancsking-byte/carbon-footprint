import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoalProgress } from './GoalProgress'

describe('GoalProgress', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('returns null when no goal is set', () => {
    const { container } = render(<GoalProgress />)
    expect(container.firstChild).toBeNull()
  })

  it('shows a full progress bar when the current footprint is below the goal', () => {
    const goal = {
      target: 4,
      targetYear: 2030,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('carbon_footprint_goal', JSON.stringify(goal))

    const historyEntry = {
      total: 2,
      breakdown: {
        transport: 1,
        homeEnergy: 0.5,
        diet: 0.3,
        goodsWaste: 0.2,
      },
      date: new Date().toISOString(),
    }
    localStorage.setItem('carbon_footprint_history', JSON.stringify([historyEntry]))

    render(<GoalProgress />)

    const progressBar = screen.getByRole('progressbar', { name: /Carbon goal progress/ })
    const progressFill = document.querySelector('.progress-fill') as HTMLElement

    expect(progressFill?.style.width).toBe('100%')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    expect(progressBar).toHaveAttribute('aria-valuetext', 'Goal achieved')
    expect(screen.getByText("You've reached your goal!")).toBeInTheDocument()
  })

  it('shows improving status when latest is lower than previous entry', () => {
    const goal = {
      target: 2,
      targetYear: 2030,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('carbon_footprint_goal', JSON.stringify(goal))

    const latestEntry = {
      total: 3,
      breakdown: { transport: 1, homeEnergy: 1, diet: 1, goodsWaste: 0 },
      date: new Date().toISOString(),
    }
    const previousEntry = {
      total: 4,
      breakdown: { transport: 2, homeEnergy: 1, diet: 1, goodsWaste: 0 },
      date: new Date(Date.now() - 86400000).toISOString(),
    }
    localStorage.setItem('carbon_footprint_history', JSON.stringify([latestEntry, previousEntry]))

    render(<GoalProgress />)

    expect(screen.getByText(/^Improving$/)).toBeInTheDocument()
    expect(screen.getByText(/Improving! Down 1.00t CO2e from last entry/)).toBeInTheDocument()
  })

  it('shows keep going when not improving or stable', () => {
    const goal = {
      target: 2,
      targetYear: 2030,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('carbon_footprint_goal', JSON.stringify(goal))

    const latestEntry = {
      total: 4,
      breakdown: { transport: 2, homeEnergy: 1, diet: 1, goodsWaste: 0 },
      date: new Date().toISOString(),
    }
    const previousEntry = {
      total: 3,
      breakdown: { transport: 1, homeEnergy: 1, diet: 1, goodsWaste: 0 },
      date: new Date(Date.now() - 86400000).toISOString(),
    }
    localStorage.setItem('carbon_footprint_history', JSON.stringify([latestEntry, previousEntry]))

    render(<GoalProgress />)

    expect(screen.getByText('Keep going')).toBeInTheDocument()
    expect(screen.getByText(/Last entry: 3.00t CO2e/)).toBeInTheDocument()
  })

  it('handles the single history entry edge case correctly', () => {
    const goal = {
      target: 2,
      targetYear: 2030,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('carbon_footprint_goal', JSON.stringify(goal))

    const singleEntry = {
      total: 3,
      breakdown: { transport: 1, homeEnergy: 1, diet: 1, goodsWaste: 0 },
      date: new Date().toISOString(),
    }
    localStorage.setItem('carbon_footprint_history', JSON.stringify([singleEntry]))

    render(<GoalProgress />)

    expect(screen.getByText('Keep going')).toBeInTheDocument()
    expect(screen.queryByText(/Down/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Improving/)).not.toBeInTheDocument()
  })
})
