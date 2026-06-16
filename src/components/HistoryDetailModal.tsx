import { useEffect, useRef } from 'react'
import { type HistoryEntry } from '../hooks/useHistory'
import '../styles/HistoryDetailModal.css'

interface HistoryDetailModalProps {
  entry: HistoryEntry | null
  isOpen: boolean
  onClose: () => void
}

export function HistoryDetailModal({ entry, isOpen, onClose }: HistoryDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return

    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    firstElement?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        previouslyFocused?.focus()
      }

      if (event.key === 'Tab' && focusableElements.length > 0) {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen || !entry) return null

  const hasBreakdown = entry.breakdown && Object.values(entry.breakdown).some(v => v > 0)
  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-detail-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-modal-header">
          <h2 id="history-detail-title">Entry Details</h2>
          <button
            type="button"
            className="detail-modal-close"
            onClick={onClose}
            aria-label="Close details"
          >
            ×
          </button>
        </div>

        <div className="detail-modal-content">
          <div className="detail-section">
            <h3>Date</h3>
            <p className="detail-date">{formattedDate}</p>
          </div>

          <div className="detail-section">
            <h3>Total Emissions</h3>
            <p className="detail-total">{entry.total.toFixed(2)} t CO₂e/year</p>
          </div>

          <div className="detail-section">
            <h3>Category Breakdown</h3>
            {hasBreakdown ? (
              <table className="breakdown-table">
                <tbody>
                  <tr>
                    <td>Transport</td>
                    <td className="breakdown-value">{entry.breakdown.transport.toFixed(2)} t</td>
                  </tr>
                  <tr>
                    <td>Home Energy</td>
                    <td className="breakdown-value">{entry.breakdown.homeEnergy.toFixed(2)} t</td>
                  </tr>
                  <tr>
                    <td>Diet</td>
                    <td className="breakdown-value">{entry.breakdown.diet.toFixed(2)} t</td>
                  </tr>
                  <tr>
                    <td>Goods & Waste</td>
                    <td className="breakdown-value">{entry.breakdown.goodsWaste.toFixed(2)} t</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="detail-no-data">Details not available</p>
            )}
          </div>
        </div>

        <div className="detail-modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
