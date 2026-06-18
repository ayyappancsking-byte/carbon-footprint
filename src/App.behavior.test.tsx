import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import App from './App'
import type { Recommendation } from './lib/insightsEngine'

const { shareResultMock, generatePersonalizedInsightsMock, generatePdfReportMock } = vi.hoisted(() => ({
  shareResultMock: vi.fn(),
  generatePersonalizedInsightsMock: vi.fn(),
  generatePdfReportMock: vi.fn(),
}))

vi.mock('./lib/shareUtils', () => ({
  shareResult: shareResultMock,
}))

vi.mock('./lib/insightsEngine', () => ({
  generatePersonalizedInsights: generatePersonalizedInsightsMock,
}))

vi.mock('./lib/pdfExport', () => ({
  generatePdfReport: generatePdfReportMock,
}))

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

const originalShare = navigator.share

function renderAppWithOnboardingDismissed() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Get started/i }))
}

async function calculateFootprint() {
  const carDistanceInput = screen.getAllByRole('spinbutton')[0] as HTMLInputElement
  fireEvent.change(carDistanceInput, { target: { value: '50' } })
  fireEvent.click(screen.getByRole('button', { name: /Calculate my carbon footprint/i }))

  await screen.findByText(/t CO2e\/year/)
}

describe('App behavior coverage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    shareResultMock.mockReset()
    generatePersonalizedInsightsMock.mockReset()
    generatePdfReportMock.mockReset()

    shareResultMock.mockResolvedValue(true)
    generatePersonalizedInsightsMock.mockResolvedValue({
      usedAI: false,
      recommendations: mockRecommendations,
    })
    generatePdfReportMock.mockImplementation(() => undefined)
  })

  afterEach(() => {
    localStorage.clear()
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: originalShare,
    })
  })

  it('clears validation errors and completes the primary result actions', async () => {
    renderAppWithOnboardingDismissed()

    const carDistanceInput = screen.getAllByRole('spinbutton')[0] as HTMLInputElement

    fireEvent.change(carDistanceInput, { target: { value: '6000' } })
    fireEvent.click(screen.getByRole('button', { name: /Calculate my carbon footprint/i }))

    expect(await screen.findByText(/Car distance must be between 0-5000 km\/week/)).toBeInTheDocument()

    fireEvent.change(carDistanceInput, { target: { value: '50' } })
    await waitFor(() => {
      expect(screen.queryByText(/Car distance must be between 0-5000 km\/week/)).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Calculate my carbon footprint/i }))
    await screen.findByText(/Breakdown by Category/)

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn(),
    })

    fireEvent.click(screen.getByRole('button', { name: /Download carbon footprint report as a PDF/i }))
    await screen.findByText('PDF downloaded.')
    expect(generatePdfReportMock).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: /Share carbon footprint result/i }))
    await screen.findByText('Shared!')
    expect(shareResultMock).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: /Save this entry to history/i }))
    await screen.findByText('Saved!')

    fireEvent.click(screen.getByRole('button', { name: /Save carbon goal/i }))
    await screen.findByText('Goal saved!')

    fireEvent.click(screen.getByRole('button', { name: /Calculate your footprint again/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Calculate my carbon footprint/i })).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /Calculate your footprint again/i })).not.toBeInTheDocument()
  })

  it('shows an error when sharing fails', async () => {
    renderAppWithOnboardingDismissed()
    await calculateFootprint()

    shareResultMock.mockResolvedValueOnce(false)
    fireEvent.click(screen.getByRole('button', { name: /Share carbon footprint result/i }))

    await screen.findByText('Unable to share right now.')
  })

  it('shows an error when PDF generation fails', async () => {
    generatePdfReportMock.mockImplementationOnce(() => {
      throw new Error('pdf failure')
    })

    renderAppWithOnboardingDismissed()
    await calculateFootprint()

    fireEvent.click(screen.getByRole('button', { name: /Download carbon footprint report as a PDF/i }))

    await screen.findByText('Failed to generate PDF.')
  })

  it('shows an error when saving history fails', async () => {
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'carbon_footprint_history') {
        throw new Error('storage failure')
      }

      return originalSetItem.call(this, key, value)
    })

    renderAppWithOnboardingDismissed()
    await calculateFootprint()

    fireEvent.click(screen.getByRole('button', { name: /Save this entry to history/i }))

    await screen.findByText('Failed to save entry')
  })
})
