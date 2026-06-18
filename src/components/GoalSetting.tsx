import { useEffect, useState } from 'react'
import { useGoal, type CarbonGoal } from '../hooks/useGoal'
import '../styles/GoalSetting.css'

interface GoalInputFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  min: number
  max: number
  step: string
  placeholder?: string
  ariaLabel: string
}

interface GoalDisplayProps {
  goal: CarbonGoal
  onEdit: () => void
  onDelete: () => void
}

interface GoalFormProps {
  goal: CarbonGoal | null
  targetInput: string
  yearInput: string
  currentYear: number
  onTargetChange: (value: string) => void
  onYearChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

interface GoalMessageState {
  text: string
  type: 'success' | 'error'
}

interface GoalMessageBannerProps {
  message: GoalMessageState | null
}

/**
 * Render a labeled numeric field with an accessible label.
 */
function GoalInputField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  ariaLabel,
}: GoalInputFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </div>
  )
}

/**
 * Render the saved goal summary and actions.
 */
function GoalDisplay({ goal, onEdit, onDelete }: GoalDisplayProps) {
  return (
    <div className="goal-display">
      <div className="goal-info">
        <p className="goal-target">
          Target: <strong>{goal.target} t CO2e/year</strong> by <strong>{goal.targetYear}</strong>
        </p>
        <p className="goal-set-date">
          Set on{' '}
          {new Date(goal.createdAt).toLocaleDateString('en-US', {
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
          onClick={onEdit}
          aria-label="Edit carbon goal"
        >
          Edit Goal
        </button>
        <button
          type="button"
          className="btn-secondary btn-danger"
          onClick={onDelete}
          aria-label="Delete carbon goal"
        >
          Delete Goal
        </button>
      </div>
    </div>
  )
}

/**
 * Render the editable goal form.
 */
function GoalForm({
  goal,
  targetInput,
  yearInput,
  currentYear,
  onTargetChange,
  onYearChange,
  onSave,
  onCancel,
}: GoalFormProps) {
  return (
    <div className="goal-form">
      <GoalInputField
        id="goal-target"
        label="Target footprint (tonnes CO2e/year)"
        value={targetInput}
        onChange={onTargetChange}
        min={1}
        max={100}
        step="0.1"
        placeholder="2"
        ariaLabel="Target footprint in tonnes CO2e per year"
      />
      <GoalInputField
        id="goal-year"
        label="Target year"
        value={yearInput}
        onChange={onYearChange}
        min={currentYear}
        max={2100}
        step="1"
        ariaLabel="Target year"
      />
      <div className="goal-form-actions">
        <button type="button" className="btn-primary" onClick={onSave} aria-label="Save carbon goal">
          Save Goal
        </button>
        {goal && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            aria-label="Cancel goal editing"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Render success and error feedback for the goal form.
 */
function GoalMessageBanner({ message }: GoalMessageBannerProps) {
  if (!message) {
    return null
  }

  return (
    <div
      className={`goal-message goal-message-${message.type}`}
      role={message.type === 'error' ? 'alert' : 'status'}
      aria-live={message.type === 'error' ? 'assertive' : 'polite'}
    >
      {message.text}
    </div>
  )
}

function getInitialTarget(goal: CarbonGoal | null): string {
  return goal ? String(goal.target) : '2'
}

function getInitialYear(goal: CarbonGoal | null, currentYear: number): string {
  return goal ? String(goal.targetYear) : String(currentYear + 1)
}

export function GoalSetting() {
  const { getGoal, setGoal, deleteGoal } = useGoal()
  const currentYear = new Date().getFullYear()
  const initialGoal = getGoal()
  const [goal, setGoalState] = useState<CarbonGoal | null>(initialGoal)
  const [isEditing, setIsEditing] = useState(() => !initialGoal)
  const [targetInput, setTargetInput] = useState(() => getInitialTarget(initialGoal))
  const [yearInput, setYearInput] = useState(() => getInitialYear(initialGoal, currentYear))
  const [message, setMessage] = useState<GoalMessageState | null>(null)

  useEffect(() => {
    if (!message) {
      return undefined
    }

    const timer = window.setTimeout(() => setMessage(null), 3000)
    return () => window.clearTimeout(timer)
  }, [message])

  const handleSaveGoal = () => {
    if (targetInput.trim() === '' || yearInput.trim() === '') {
      setMessage({ text: 'Target and year must be valid numbers', type: 'error' })
      return
    }

    const target = Number(targetInput)
    const year = Number(yearInput)
    const result = setGoal(target, year)

    if (result.success) {
      setGoalState({ target, targetYear: year, createdAt: new Date().toISOString() })
      setIsEditing(false)
      setMessage({ text: 'Goal saved!', type: 'success' })
      return
    }

    setMessage({ text: result.error || 'Failed to save goal', type: 'error' })
  }

  const handleDeleteGoal = () => {
    if (!window.confirm('Delete your carbon goal?')) {
      return
    }

    if (deleteGoal()) {
      setGoalState(null)
      setIsEditing(true)
      setTargetInput(getInitialTarget(null))
      setYearInput(getInitialYear(null, currentYear))
      setMessage({ text: 'Goal deleted', type: 'success' })
      return
    }

    setMessage({ text: 'Failed to delete goal', type: 'error' })
  }

  return (
    <div className="goal-setting">
      <h3>My Carbon Goal</h3>

      {goal && !isEditing ? (
        <GoalDisplay goal={goal} onEdit={() => setIsEditing(true)} onDelete={handleDeleteGoal} />
      ) : (
        <GoalForm
          goal={goal}
          targetInput={targetInput}
          yearInput={yearInput}
          currentYear={currentYear}
          onTargetChange={setTargetInput}
          onYearChange={setYearInput}
          onSave={handleSaveGoal}
          onCancel={() => setIsEditing(false)}
        />
      )}

      <GoalMessageBanner message={message} />
    </div>
  )
}
