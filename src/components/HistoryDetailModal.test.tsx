import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HistoryDetailModal } from './HistoryDetailModal'
import type { HistoryEntry } from '../hooks/useHistory'

describe('HistoryDetailModal', () => {
  const mockEntry: HistoryEntry = {
    total: 5.5,
    breakdown: {
      transport: 2.0,
      homeEnergy: 1.5,
      diet: 1.2,
      goodsWaste: 0.8,
    },
    date: '2024-06-15T10:30:00Z',
  }

  it('renders null when isOpen is false', () => {
    const onClose = vi.fn()
    const { container } = render(
      <HistoryDetailModal entry={mockEntry} isOpen={false} onClose={onClose} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders entry details when isOpen is true', () => {
    const onClose = vi.fn()
    render(
      <HistoryDetailModal entry={mockEntry} isOpen={true} onClose={onClose} />
    )

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'history-detail-title')
    expect(screen.getByText('Entry Details')).toBeInTheDocument()
    expect(screen.getByText(/5.50 t CO₂e\/year/)).toBeInTheDocument()
    expect(screen.getByText(/June 15, 2024/)).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(
      <HistoryDetailModal entry={mockEntry} isOpen={true} onClose={onClose} />
    )

    const closeButton = screen.getByLabelText('Close details')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <HistoryDetailModal entry={mockEntry} isOpen={true} onClose={onClose} />
    )

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('displays all 4 category breakdowns correctly', () => {
    const onClose = vi.fn()
    render(
      <HistoryDetailModal entry={mockEntry} isOpen={true} onClose={onClose} />
    )

    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('Home Energy')).toBeInTheDocument()
    expect(screen.getByText('Diet')).toBeInTheDocument()
    expect(screen.getByText('Goods & Waste')).toBeInTheDocument()

    expect(screen.getByText('2.00 t')).toBeInTheDocument()
    expect(screen.getByText('1.50 t')).toBeInTheDocument()
    expect(screen.getByText('1.20 t')).toBeInTheDocument()
    expect(screen.getByText('0.80 t')).toBeInTheDocument()
  })
})
