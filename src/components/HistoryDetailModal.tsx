import { type HistoryEntry } from '../hooks/useHistory'
import '../styles/HistoryDetailModal.css'

interface HistoryDetailModalProps {
  entry: HistoryEntry | null
  isOpen: boolean
  onClose: () => void
}

export function HistoryDetailModal({ entry, isOpen, onClose }: HistoryDetailModalProps) {
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
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <h2>Entry Details</h2>
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
