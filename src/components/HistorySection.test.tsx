import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { HistorySection } from './HistorySection'
import { useHistory } from '../hooks/useHistory'

vi.mock('../hooks/useHistory')

describe('HistorySection', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  beforeEach(() => {
    vi.mocked(useHistory).mockReturnValue({
      getHistory: vi.fn(() => []),
      addEntry: vi.fn(),
      deleteEntry: vi.fn(),
    })
  })

  it('should render history section header', () => {
    render(<HistorySection />)
    expect(screen.getByText('Your History')).toBeInTheDocument()
  })

  it('should display empty state when no history entries exist', () => {
    render(<HistorySection />)
    expect(
      screen.getByText(/No saved entries yet/i)
    ).toBeInTheDocument()
  })

  it('should display single entry state when only one entry exists', () => {
    const mockEntry = {
      date: '2024-01-01T12:00:00.000Z',
      total: 5.5,
      breakdown: {
        transport: 2.0,
        homeEnergy: 1.5,
        diet: 1.2,
        goodsWaste: 0.8,
      },
    }

    vi.mocked(useHistory).mockReturnValue({
      getHistory: vi.fn(() => [mockEntry]),
      addEntry: vi.fn(),
      deleteEntry: vi.fn(),
    })

    render(<HistorySection />)
    expect(screen.getByText(/Save more entries to see your trend/i)).toBeInTheDocument()
  })

  it('opens the detail modal from the keyboard', () => {
    const mockEntry = {
      date: '2024-01-01T12:00:00.000Z',
      total: 5.5,
      breakdown: {
        transport: 2.0,
        homeEnergy: 1.5,
        diet: 1.2,
        goodsWaste: 0.8,
      },
    }

    vi.mocked(useHistory).mockReturnValue({
      getHistory: vi.fn(() => [mockEntry]),
      addEntry: vi.fn(),
      deleteEntry: vi.fn(),
    })

    render(<HistorySection />)

    const row = document.querySelector('.history-row-clickable') as HTMLTableRowElement
    fireEvent.keyDown(row, { key: 'Enter' })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Entry Details')).toBeInTheDocument()
  })

  it('should display chart when multiple entries exist', () => {
    const mockEntries = [
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
    ]

    vi.mocked(useHistory).mockReturnValue({
      getHistory: vi.fn(() => mockEntries),
      addEntry: vi.fn(),
      deleteEntry: vi.fn(),
    })

    render(<HistorySection />)
    expect(screen.getByText(/Your History/)).toBeInTheDocument()
  })
})
