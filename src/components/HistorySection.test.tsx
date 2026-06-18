import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { HistorySection } from './HistorySection'
import { useHistory, type HistoryEntry } from '../hooks/useHistory'

vi.mock('../hooks/useHistory')

const entries = [
  {
    date: '2024-01-02T12:00:00.000Z',
    total: 5.2,
    breakdown: {
      transport: 1.9,
      homeEnergy: 1.5,
      diet: 1.2,
      goodsWaste: 0.6,
    },
  },
  {
    date: '2024-01-01T12:00:00.000Z',
    total: 5.5,
    breakdown: {
      transport: 2.0,
      homeEnergy: 1.5,
      diet: 1.2,
      goodsWaste: 0.8,
    },
  },
]

function setHistoryMock(history: HistoryEntry[] = []) {
  const deleteEntry = vi.fn()

  vi.mocked(useHistory).mockReturnValue({
    getHistory: vi.fn(() => history),
    addEntry: vi.fn(),
    deleteEntry,
  })

  return { deleteEntry }
}

describe('HistorySection', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders the empty history state', () => {
    setHistoryMock([])

    render(<HistorySection />)

    expect(screen.getByText('Your History')).toBeInTheDocument()
    expect(
      screen.getByText(/No saved entries yet. Calculate and save a footprint to start tracking your progress./i),
    ).toBeInTheDocument()
  })

  it('renders the single-entry state when only one entry exists', () => {
    setHistoryMock([entries[0]])

    render(<HistorySection />)

    expect(screen.getByText(/Save more entries to see your trend/i)).toBeInTheDocument()
    expect(screen.getByText(/5.20 t CO2e\/year/)).toBeInTheDocument()
  })

  it('shows the chart loading fallback before the chart renders', async () => {
    setHistoryMock(entries)

    render(<HistorySection />)

    expect(screen.getByRole('status', { name: /Loading trend chart/i })).toBeInTheDocument()
    expect(screen.getByText(/Entries/)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: /Loading trend chart/i })).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('opens the detail modal from a row click and ignores delete button clicks', async () => {
    const { deleteEntry } = setHistoryMock(entries)
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<HistorySection />)

    fireEvent.click(screen.getAllByRole('button', { name: /Delete this entry/i })[0])
    expect(deleteEntry).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /View details for the entry from Jan 2, 2024/i }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Entry Details')).toBeInTheDocument()
  })

  it('opens the modal from the space key', async () => {
    setHistoryMock([entries[0]])

    render(<HistorySection />)

    const row = screen.getByRole('button', {
      name: /View details for the entry from Jan 2, 2024/i,
    })

    fireEvent.keyDown(row, { key: ' ' })

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('announces successful deletions and closes the selected modal entry', async () => {
    const { deleteEntry } = setHistoryMock([entries[0]])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    deleteEntry.mockReturnValue(true)

    render(<HistorySection />)

    fireEvent.click(screen.getByRole('button', { name: /View details for the entry from Jan 2, 2024/i }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Delete this entry/i }))

    expect(deleteEntry).toHaveBeenCalledWith(entries[0].date)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('History entry deleted.')
  })

  it('announces failed deletions with an error banner', async () => {
    const { deleteEntry } = setHistoryMock([entries[0]])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    deleteEntry.mockReturnValue(false)

    render(<HistorySection />)

    fireEvent.click(screen.getByRole('button', { name: /Delete this entry/i }))

    expect(deleteEntry).toHaveBeenCalledWith(entries[0].date)
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to delete history entry.')
  })
})
