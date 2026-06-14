import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useHistory, type HistoryEntry } from '../hooks/useHistory'
import { HistoryDetailModal } from './HistoryDetailModal'
import '../styles/HistorySection.css'

export function HistorySection() {
  const { getHistory, deleteEntry } = useHistory()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)

  useEffect(() => {
    const entries = getHistory()
    setHistory(entries)
  }, [])

  const handleDelete = (date: string) => {
    if (window.confirm('Delete this entry?')) {
      deleteEntry(date)
      setHistory((prev) => prev.filter((entry) => entry.date !== date))
    }
  }

  const chartData = history.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    total: parseFloat(entry.total.toFixed(2)),
    fullDate: entry.date,
  }))

  const handleRowClick = (entry: HistoryEntry, event: React.MouseEvent<HTMLTableRowElement>) => {
    if ((event.target as HTMLElement).closest('.delete-btn')) {
      return
    }
    setSelectedEntry(entry)
  }

  return (
    <div className="history-section">
      <h2>Your History</h2>

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
              <span>{history[0].total.toFixed(2)} t CO₂e/year</span>
            </div>
          </div>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--text)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="var(--text)"
                  label={{ value: 't CO₂e/year', angle: -90, position: 'insideLeft' }}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                  formatter={(value) => `${(value as number).toFixed(2)} t`}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--accent)"
                  dot={{ fill: 'var(--accent)', r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="history-table-wrapper">
          <h3>Entries</h3>
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total (t CO₂e/year)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr
                  key={entry.date}
                  className="history-row-clickable"
                  onClick={(e) => handleRowClick(entry, e)}
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
}
