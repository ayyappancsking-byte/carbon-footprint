import { Suspense, lazy, memo, useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { useHistory, type HistoryEntry } from '../hooks/useHistory'
import { HistoryDetailModal } from './HistoryDetailModal'
import { GoalProgress } from './GoalProgress'
import type { HistoryChartPoint } from './HistoryChart'
import '../styles/HistorySection.css'

const HistoryChart = lazy(() => import('./HistoryChart'))

export const HistorySection = memo(function HistorySection() {
  const { getHistory, deleteEntry } = useHistory()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)

  useEffect(() => {
    const entries = getHistory()
    setHistory(entries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = (date: string) => {
    if (window.confirm('Delete this entry?')) {
      const deleted = deleteEntry(date)
      if (deleted) {
        setHistory((prev) => prev.filter((entry) => entry.date !== date))
      } else {
        console.error('Failed to delete history entry')
      }
    }
  }

  const chartData: HistoryChartPoint[] = history.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    total: Number(entry.total.toFixed(2)),
  }))

  const handleRowClick = (entry: HistoryEntry, event: MouseEvent<HTMLTableRowElement>) => {
    if ((event.target as HTMLElement).closest('.delete-btn')) {
      return
    }
    setSelectedEntry(entry)
  }

  const handleRowKeyDown = (entry: HistoryEntry, event: KeyboardEvent<HTMLTableRowElement>) => {
    if ((event.target as HTMLElement).closest('.delete-btn')) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedEntry(entry)
    }
  }

  return (
    <div className="history-section">
      <h2>Your History</h2>

      <GoalProgress />

      <div className="history-content">
        {history.length === 0 ? (
          <div className="empty-state">
            <p>No saved entries yet. Calculate and save a footprint to start tracking your progress.</p>
          </div>
        ) : history.length === 1 ? (
          <div className="single-entry-state">
            <p>Save more entries to see your trend</p>
            <div className="single-point-container">
              <div className="single-point" />
              <span>{history[0].total.toFixed(2)} t CO2e/year</span>
            </div>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="chart-container chart-loading" role="status" aria-live="polite">
                Loading trend chart...
              </div>
            }
          >
            <HistoryChart data={chartData} />
          </Suspense>
        )}
      </div>

      {history.length > 0 && (
        <div className="history-table-wrapper">
          <h3>Entries</h3>
          <table className="history-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Total (t CO2e/year)</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => (
                <tr
                  key={`${entry.date}-${index}`}
                  className="history-row-clickable"
                  onClick={(event) => handleRowClick(entry, event)}
                  tabIndex={0}
                  onKeyDown={(event) => handleRowKeyDown(entry, event)}
                >
                  <td>
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>{entry.total.toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDelete(entry.date)}
                      aria-label="Delete this entry"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <HistoryDetailModal
        entry={selectedEntry}
        isOpen={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  )
})
