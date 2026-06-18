import { Suspense, lazy, useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { HISTORY_UPDATED_EVENT, useHistory, type HistoryEntry } from '../hooks/useHistory'
import { GoalProgress } from './GoalProgress'
import { HistoryDetailModal } from './HistoryDetailModal'
import type { HistoryChartPoint } from './HistoryChart'
import '../styles/HistorySection.css'

const HistoryChart = lazy(() => import('./HistoryChart'))

interface HistoryStatusMessage {
  text: string
  type: 'success' | 'error'
}

interface HistoryStatusBannerProps {
  message: HistoryStatusMessage | null
}

interface HistoryContentProps {
  history: HistoryEntry[]
  chartData: HistoryChartPoint[]
}

interface HistoryEntriesTableProps {
  history: HistoryEntry[]
  onRowClick: (entry: HistoryEntry, event: MouseEvent<HTMLTableRowElement>) => void
  onRowKeyDown: (entry: HistoryEntry, event: KeyboardEvent<HTMLTableRowElement>) => void
  onDelete: (date: string) => void
}

/**
 * Format a stored timestamp for display.
 */
function formatDisplayDate(value: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleDateString('en-US', options)
}

/**
 * Convert history entries into chart points.
 */
function buildChartData(history: HistoryEntry[]): HistoryChartPoint[] {
  return history.map((entry) => ({
    date: formatDisplayDate(entry.date, {
      month: 'short',
      day: 'numeric',
    }),
    total: Number(entry.total.toFixed(2)),
  }))
}

/**
 * Check whether a row event originated from the delete button.
 */
function isDeleteButtonTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('.delete-btn'))
}

/**
 * Render the empty history state.
 */
function HistoryEmptyState() {
  return (
    <div className="empty-state">
      <p>No saved entries yet. Calculate and save a footprint to start tracking your progress.</p>
    </div>
  )
}

/**
 * Render the single-entry history state.
 */
function HistorySingleEntryState({ entry }: { entry: HistoryEntry }) {
  return (
    <div className="single-entry-state">
      <p>Save more entries to see your trend</p>
      <div className="single-point-container">
        <div className="single-point" />
        <span>{entry.total.toFixed(2)} t CO2e/year</span>
      </div>
    </div>
  )
}

/**
 * Render the loading fallback for the chart.
 */
function HistoryChartLoadingState() {
  return (
    <div
      className="chart-container chart-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading trend chart"
    >
      Loading trend chart...
    </div>
  )
}

/**
 * Render the history chart when multiple entries are available.
 */
function HistoryChartSection({ chartData }: { chartData: HistoryChartPoint[] }) {
  return (
    <Suspense fallback={<HistoryChartLoadingState />}>
      <HistoryChart data={chartData} />
    </Suspense>
  )
}

/**
 * Choose the correct empty, single-entry, or chart view.
 */
function HistoryContent({ history, chartData }: HistoryContentProps) {
  if (history.length === 0) {
    return <HistoryEmptyState />
  }

  if (history.length === 1) {
    return <HistorySingleEntryState entry={history[0]} />
  }

  return <HistoryChartSection chartData={chartData} />
}

/**
 * Render the saved entries table.
 */
function HistoryEntriesTable({
  history,
  onRowClick,
  onRowKeyDown,
  onDelete,
}: HistoryEntriesTableProps) {
  return (
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
          {history.map((entry) => (
            <tr
              key={entry.date}
              className="history-row-clickable"
              onClick={(event) => onRowClick(entry, event)}
              tabIndex={0}
              role="button"
              aria-label={`View details for the entry from ${formatDisplayDate(entry.date, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}`}
              onKeyDown={(event) => onRowKeyDown(entry, event)}
            >
              <td>
                {formatDisplayDate(entry.date, {
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
                  onClick={() => onDelete(entry.date)}
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
  )
}

/**
 * Render transient status announcements.
 */
function HistoryStatusBanner({ message }: HistoryStatusBannerProps) {
  if (!message) {
    return null
  }

  return (
    <div
      className={`history-message history-message-${message.type}`}
      role={message.type === 'error' ? 'alert' : 'status'}
      aria-live={message.type === 'error' ? 'assertive' : 'polite'}
    >
      {message.text}
    </div>
  )
}

export function HistorySection() {
  const { getHistory, deleteEntry } = useHistory()
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory())
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const [statusMessage, setStatusMessage] = useState<HistoryStatusMessage | null>(null)

  useEffect(() => {
    const syncHistory = () => setHistory(getHistory())

    syncHistory()
    window.addEventListener(HISTORY_UPDATED_EVENT, syncHistory)
    window.addEventListener('storage', syncHistory)

    return () => {
      window.removeEventListener(HISTORY_UPDATED_EVENT, syncHistory)
      window.removeEventListener('storage', syncHistory)
    }
  }, [getHistory])

  const chartData = buildChartData(history)
  const activeSelectedEntry =
    selectedEntry && history.some((entry) => entry.date === selectedEntry.date)
      ? selectedEntry
      : null

  const handleDelete = (date: string) => {
    if (!window.confirm('Delete this entry?')) {
      return
    }

    const deleted = deleteEntry(date)
    if (deleted) {
      setSelectedEntry((previous) => (previous?.date === date ? null : previous))
      setStatusMessage({ text: 'History entry deleted.', type: 'success' })
      return
    }

    setStatusMessage({ text: 'Failed to delete history entry.', type: 'error' })
  }

  const handleRowClick = (entry: HistoryEntry, event: MouseEvent<HTMLTableRowElement>) => {
    if (isDeleteButtonTarget(event.target)) {
      return
    }

    setSelectedEntry(entry)
  }

  const handleRowKeyDown = (entry: HistoryEntry, event: KeyboardEvent<HTMLTableRowElement>) => {
    if (isDeleteButtonTarget(event.target)) {
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

      <div className="history-content" aria-live="polite" aria-atomic="true">
        <HistoryContent history={history} chartData={chartData} />
      </div>

      {history.length > 0 && (
        <HistoryEntriesTable
          history={history}
          onRowClick={handleRowClick}
          onRowKeyDown={handleRowKeyDown}
          onDelete={handleDelete}
        />
      )}

      <HistoryStatusBanner message={statusMessage} />

      <HistoryDetailModal
        entry={activeSelectedEntry}
        isOpen={activeSelectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  )
}
