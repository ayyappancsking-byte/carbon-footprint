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
    const getStartedBtn = screen.getByRole('button', { name: /Get started/i })
    fireEvent.click(getStartedBtn)
    expect(screen.queryByText('Welcome!')).not.toBeInTheDocument()
  })

  it('should show validation error for out-of-range car distance', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))

    const inputs = screen.getAllByRole('spinbutton')
    const carDistanceInput = inputs[0] as HTMLInputElement
    fireEvent.change(carDistanceInput, { target: { value: '6000' } })

    const calculateBtn = screen.getByRole('button', { name: /Calculate my carbon footprint/i })
    fireEvent.click(calculateBtn)

    await waitFor(() => {
      expect(screen.getByText(/Car distance must be between 0-5000/)).toBeInTheDocument()
    })
  })

  it('should save calculation to localStorage', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))

    const inputs = screen.getAllByRole('spinbutton')
    const carDistanceInput = inputs[0] as HTMLInputElement
    fireEvent.change(carDistanceInput, { target: { value: '50' } })

    const calculateBtn = screen.getByRole('button', { name: /Calculate my carbon footprint/i })
    fireEvent.click(calculateBtn)

    await waitFor(() => {
      expect(screen.getByText(/t CO2e\/year/)).toBeInTheDocument()
    })

    const saveBtn = screen.getByRole('button', { name: /Save this entry to history/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('Saved!')).toHaveAttribute('role', 'status')
    })

    const stored = localStorage.getItem('carbon_footprint_history')
    expect(stored).not.toBeNull()
    const entries = JSON.parse(stored!)
    expect(entries).toHaveLength(1)
  })

  it('should display results and recommendations after calculation', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))

    const inputs = screen.getAllByRole('spinbutton')
    const carDistanceInput = inputs[0] as HTMLInputElement
    fireEvent.change(carDistanceInput, { target: { value: '50' } })

    const calculateBtn = screen.getByRole('button', { name: /Calculate my carbon footprint/i })
    fireEvent.click(calculateBtn)

    await waitFor(() => {
      expect(screen.getByText(/t CO2e\/year/)).toBeInTheDocument()
    })

    expect(screen.getByText(/Breakdown by Category/)).toBeInTheDocument()
    expect(screen.getByText(/Detailed Breakdown/)).toBeInTheDocument()
    expect(screen.queryByText(/Personalized Insights/)).toBeInTheDocument()
  })

  it('should display goal setting section in results', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Get started/i }))

    const inputs = screen.getAllByRole('spinbutton')
    const carDistanceInput = inputs[0] as HTMLInputElement
    fireEvent.change(carDistanceInput, { target: { value: '50' } })

    const calculateBtn = screen.getByRole('button', { name: /Calculate my carbon footprint/i })
    fireEvent.click(calculateBtn)

    await waitFor(() => {
      expect(screen.getByText(/t CO2e\/year/)).toBeInTheDocument()
    })

    expect(screen.getByText('My Carbon Goal')).toBeInTheDocument()
  })
})
