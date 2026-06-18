import { useEffect, useState } from 'react'
import { GOAL_UPDATED_EVENT, useGoal, type CarbonGoal } from '../hooks/useGoal'
import { HISTORY_UPDATED_EVENT, useHistory, type HistoryEntry } from '../hooks/useHistory'
import '../styles/GoalProgress.css'

interface GoalStatProps {
  label: string
  value: string
  valueClassName?: string
}

function GoalStat({ label, value, valueClassName }: GoalStatProps) {
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <span className={`value ${valueClassName ?? ''}`.trim()}>{value}</span>
    </div>
  )
}

export function GoalProgress() {
  const { getGoal } = useGoal()
  const { getHistory } = useHistory()
  const [goal, setGoal] = useState<CarbonGoal | null>(() => getGoal())
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory())

  useEffect(() => {
    const syncState = () => {
      setGoal(getGoal())
      setHistory(getHistory())
    }

    syncState()
    window.addEventListener(GOAL_UPDATED_EVENT, syncState)
    window.addEventListener(HISTORY_UPDATED_EVENT, syncState)
    window.addEventListener('storage', syncState)

    return () => {
      window.removeEventListener(GOAL_UPDATED_EVENT, syncState)
      window.removeEventListener(HISTORY_UPDATED_EVENT, syncState)
      window.removeEventListener('storage', syncState)
    }
  }, [getGoal, getHistory])

  const latestEntry = history.length > 0 ? history[0] : null
  const previousEntry = history.length > 1 ? history[1] : null

  if (!goal || !latestEntry) {
    return null
  }

  const current = latestEntry.total
  const target = goal.target
  const isImproving = previousEntry ? current < previousEntry.total : false
  const gapToGoal = Math.max(0, current - target)
  const hasReachedGoal = current <= target
  const progressPercent = hasReachedGoal ? 100 : Math.min(100, (target / current) * 100)

  return (
    <div className="goal-progress">
      <h3>Progress Toward Goal</h3>

      <div className="progress-stats">
        <GoalStat label="Current" value={`${current.toFixed(2)} t CO2e`} />
        <GoalStat label="Goal" value={`${target.toFixed(2)} t CO2e`} />
        <GoalStat
          label={`By ${goal.targetYear}`}
          value={isImproving ? 'Improving' : 'Keep going'}
          valueClassName={isImproving ? 'improving' : 'stable'}
        />
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar"
          role="progressbar"
          aria-label="Carbon goal progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
          aria-valuetext={hasReachedGoal ? 'Goal achieved' : `${progressPercent.toFixed(0)} percent of goal reached`}
        >
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="progress-text" aria-live="polite">
          {hasReachedGoal
            ? "You've reached your goal!"
            : `${gapToGoal.toFixed(2)} t CO2e above your goal`}
        </p>
      </div>

      {previousEntry && (
        <p className="progress-change" aria-live="polite">
          {isImproving ? (
            <>
              Improving! Down {(previousEntry.total - current).toFixed(2)}t CO2e from last entry
            </>
          ) : (
            <>Last entry: {previousEntry.total.toFixed(2)}t CO2e</>
          )}
        </p>
      )}
    </div>
  )
}
