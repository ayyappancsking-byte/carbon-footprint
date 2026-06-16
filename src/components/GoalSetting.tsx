import { useState } from 'react'
import { useGoal, type CarbonGoal } from '../hooks/useGoal'
import '../styles/GoalSetting.css'

interface GoalSettingProps {
  onGoalChange?: () => void
}

export function GoalSetting({ onGoalChange }: GoalSettingProps) {
  const { getGoal, setGoal, deleteGoal } = useGoal()
  const initialGoal = getGoal()
  const [goal, setGoalState] = useState<CarbonGoal | null>(initialGoal)
  const [isEditing, setIsEditing] = useState(() => !initialGoal)
  const [targetInput, setTargetInput] = useState(() => {
    return initialGoal ? String(initialGoal.target) : '2'
  })
  const [yearInput, setYearInput] = useState(() => {
    return initialGoal ? String(initialGoal.targetYear) : String(new Date().getFullYear() + 1)
  })
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const handleSaveGoal = () => {
    const target = parseFloat(targetInput)
    const year = Number.parseInt(yearInput, 10)

    const result = setGoal(target, year)
    if (result.success) {
      const newGoal = { target, targetYear: year, createdAt: new Date().toISOString() }
      setGoalState(newGoal)
      setIsEditing(false)
      setMessage({ text: 'Goal saved!', type: 'success' })
      onGoalChange?.()
      setTimeout(() => setMessage(null), 3000)
    } else {
      setMessage({ text: result.error || 'Failed to save goal', type: 'error' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeleteGoal = () => {
    if (window.confirm('Delete your carbon goal?')) {
      const deleted = deleteGoal()
      if (deleted) {
        setGoalState(null)
        setIsEditing(true)
        setMessage({ text: 'Goal deleted', type: 'success' })
        onGoalChange?.()
      } else {
        setMessage({ text: 'Failed to delete goal', type: 'error' })
      }
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div className="goal-setting">
      <h3>My Carbon Goal</h3>

      {goal && !isEditing ? (
        <div className="goal-display">
          <div className="goal-info">
            <p className="goal-target">
              Target: <strong>{goal.target} t CO₂e/year</strong> by <strong>{goal.targetYear}</strong>
            </p>
            <p className="goal-set-date">
              Set on {new Date(goal.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="goal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditing(true)}
            >
              Edit Goal
            </button>
            <button
              type="button"
              className="btn-secondary btn-danger"
              onClick={handleDeleteGoal}
            >
              Delete Goal
            </button>
          </div>
        </div>
      ) : (
        <div className="goal-form">
          <div className="form-field">
            <label>
              Target footprint (tonnes CO₂e/year)
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="2"
              />
            </label>
          </div>
          <div className="form-field">
            <label>
              Target year
              <input
                type="number"
                min={new Date().getFullYear()}
                max="2100"
                step="1"
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
              />
            </label>
          </div>
          <div className="goal-form-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveGoal}
            >
              Save Goal
            </button>
            {goal && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {message && (
        <div className={`goal-message goal-message-${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  )
}
