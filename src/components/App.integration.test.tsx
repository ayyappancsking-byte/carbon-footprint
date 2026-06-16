import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import App from '../App'

describe('App Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should display onboarding modal on first visit', () => {
    render(<App />)
    expect(screen.getByText('Welcome!')).toBeInTheDocument()
  })

  it('should dismiss onboarding modal when button clicked', () => {
    render(<App />)
    const getStartedBtn = screen.getByText('Get Started')
    fireEvent.click(getStartedBtn)
    expect(screen.queryByText('Welcome!')).not.toBeInTheDocument()
  })

  it('should show validation error for out-of-range car distance', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('Get Started'))

    const inputs = screen.getAllByRole('spinbutton')
    const carDistanceInput = inputs[0] as HTMLInputElement
    fireEvent.change(carDistanceInput, { target: { value: '6000' } })

    const calculateBtn = screen.getByText('Calculate my footprint')
    fireEvent.click(calculateBtn)

    await waitFor(() => {
      expect(screen.getByText(/Car distance must be between 0-5000/)).toBeInTheDocument()
    })
  })

  it('should save calculation to localStorage', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('Get Started'))

    const inputs = screen.getAllByRole('spinbutton')
    const carDistanceInput = inputs[0] as HTMLInputElement
    fireEvent.change(carDistanceInput, { target: { value: '50' } })

    const calculateBtn = screen.getByText('Calculate my footprint')
    fireEvent.click(calculateBtn)

    await waitFor(() => {
      expect(screen.getByText(/t CO₂e\/year/)).toBeInTheDocument()
    })

    const saveBtn = screen.getByText('Save this entry to my history')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('Saved!')).toBeInTheDocument()
    })

    const stored = localStorage.getItem('carbon_footprint_history')
    expect(stored).not.toBeNull()
    const entries = JSON.parse(stored!)
    expect(entries).toHaveLength(1)
  })

  it('should display results and recommendations after calculation', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('Get Started'))

    const inputs = screen.getAllByRole('spinbutton')
    const carDistanceInput = inputs[0] as HTMLInputElement
    fireEvent.change(carDistanceInput, { target: { value: '50' } })

    const calculateBtn = screen.getByText('Calculate my footprint')
    fireEvent.click(calculateBtn)

    await waitFor(() => {
      expect(screen.getByText(/t CO₂e\/year/)).toBeInTheDocument()
    })

    // Check for results breakdown
    expect(screen.getByText(/Breakdown by Category/)).toBeInTheDocument()
    expect(screen.getByText(/Detailed Breakdown/)).toBeInTheDocument()

    // Check for recommendations section (could be "Personalized Insights" or "Quick Tips")
    expect(screen.queryByText(/Personalized Insights/)).toBeInTheDocument()
  })

  it('should display goal setting section in results', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('Get Started'))

    const inputs = screen.getAllByRole('spinbutton')
    const carDistanceInput = inputs[0] as HTMLInputElement
    fireEvent.change(carDistanceInput, { target: { value: '50' } })

    const calculateBtn = screen.getByText('Calculate my footprint')
    fireEvent.click(calculateBtn)

    await waitFor(() => {
      expect(screen.getByText(/t CO₂e\/year/)).toBeInTheDocument()
    })

    // Check for goal setting
    expect(screen.getByText('My Carbon Goal')).toBeInTheDocument()
  })
})


