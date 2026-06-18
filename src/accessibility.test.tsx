import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import App from './App'
import { GoalSetting } from './components/GoalSetting'
import { HistoryDetailModal } from './components/HistoryDetailModal'
import { OnboardingModal } from './components/OnboardingModal'
import { ResultsBreakdown } from './components/ResultsBreakdown'
import type { CarbonFootprintBreakdown } from './lib/carbonEngine'
import type { HistoryEntry } from './hooks/useHistory'

const mockBreakdown: CarbonFootprintBreakdown = {
  total: 5.6,
  transport: 2,
  homeEnergy: 1.5,
  diet: 1.3,
  goodsAndWaste: 0.8,
  breakdown: {
    transportDetail: {
      car: 1.2,
      transit: 0.5,
      flights: 0.3,
    },
    homeEnergyDetail: {
      electricity: 0.9,
      gas: 0.6,
    },
  },
}

const mockEntry: HistoryEntry = {
  total: 5.5,
  breakdown: {
    transport: 2,
    homeEnergy: 1.5,
    diet: 1.2,
    goodsWaste: 0.8,
  },
  date: '2024-06-15T10:30:00Z',
}

describe('Accessibility checks', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('has no obvious accessibility violations on the main app form', async () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    const { container } = render(<App />)

    const results = await axe(container)
    expect(results.violations).toHaveLength(0)
  })

  it('has no obvious accessibility violations on the onboarding modal', async () => {
    const { container } = render(<OnboardingModal isOpen={true} onDismiss={() => undefined} />)

    const results = await axe(container)
    expect(results.violations).toHaveLength(0)
  })

  it('has no obvious accessibility violations on the goal form', async () => {
    const { container } = render(<GoalSetting />)

    const results = await axe(container)
    expect(results.violations).toHaveLength(0)
  })

  it('has no obvious accessibility violations on the results breakdown', async () => {
    const { container } = render(<ResultsBreakdown data={mockBreakdown} />)

    const results = await axe(container)
    expect(results.violations).toHaveLength(0)
  })

  it('has no obvious accessibility violations on the history detail modal', async () => {
    const { container } = render(
      <HistoryDetailModal entry={mockEntry} isOpen={true} onClose={() => undefined} />,
    )

    const results = await axe(container)
    expect(results.violations).toHaveLength(0)
  })
})
