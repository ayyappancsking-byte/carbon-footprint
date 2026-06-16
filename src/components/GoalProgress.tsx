import { useGoal, type CarbonGoal } from '../hooks/useGoal'
import { useHistory, type HistoryEntry } from '../hooks/useHistory'
import '../styles/GoalProgress.css'

export function GoalProgress() {
  const { getGoal } = useGoal()
  const { getHistory } = useHistory()
  const goal: CarbonGoal | null = getGoal()
  const history: HistoryEntry[] = getHistory()
  const latestEntry = history.length > 0 ? history[0] : null
  const previousEntry = history.length > 1 ? history[1] : null

  if (!goal || !latestEntry) {
    return null
  }

  const current = latestEntry.total
  const target = goal.target
  const isImproving = previousEntry ? current < previousEntry.total : false
  const remaining = Math.max(0, current - target)
  const progressPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0

  return (
    <div className="goal-progress">
      <h3>Progress Toward Goal</h3>

      <div className="progress-stats">
        <div className="stat">
          <span className="label">Current</span>
          <span className="value">{current.toFixed(2)} t</span>
        </div>
        <div className="stat">
          <span className="label">Goal</span>
          <span className="value">{target.toFixed(2)} t</span>
        </div>
        <div className="stat">
          <span className="label">By {goal.targetYear}</span>
          <span className={`value ${isImproving ? 'improving' : 'stable'}`}>
            {isImproving ? '📈 Improving' : '→ Keep going'}
          </span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
        <p className="progress-text">
          {current <= target
            ? `✓ You've reached your goal!`
            : `${remaining.toFixed(2)} t remaining to reach goal`}
        </p>
      </div>

      {previousEntry && (
        <p className="progress-change">
          {isImproving ? (
            <>
              ✓ <strong>Improving!</strong> Down {(previousEntry.total - current).toFixed(2)}t from last entry
            </>
          ) : (
            <>
              → Last entry: {previousEntry.total.toFixed(2)}t
            </>
          )}
        </p>
      )}
    </div>
  )
}
