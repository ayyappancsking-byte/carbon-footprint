const GOAL_STORAGE_KEY = 'carbon_footprint_goal'
export const GOAL_UPDATED_EVENT = 'carbon-goal-updated'

export interface CarbonGoal {
  target: number
  targetYear: number
  createdAt: string
}

function isValidGoalRecord(value: unknown): value is CarbonGoal {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<CarbonGoal>

  return (
    typeof candidate.target === 'number' &&
    Number.isFinite(candidate.target) &&
    typeof candidate.targetYear === 'number' &&
    Number.isInteger(candidate.targetYear) &&
    typeof candidate.createdAt === 'string' &&
    !Number.isNaN(new Date(candidate.createdAt).getTime())
  )
}

function notifyGoalUpdated(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(GOAL_UPDATED_EVENT))
}

/**
 * Read the stored goal record from localStorage.
 */
export function readGoalRecord(): CarbonGoal | null {
  try {
    const stored = localStorage.getItem(GOAL_STORAGE_KEY)
    if (!stored) {
      return null
    }

    const parsed: unknown = JSON.parse(stored)
    return isValidGoalRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Persist a validated goal record to localStorage.
 */
export function saveGoalRecord(
  target: number,
  targetYear: number,
): { success: boolean; error?: string } {
  try {
    if (
      !Number.isFinite(target) ||
      !Number.isFinite(targetYear) ||
      !Number.isInteger(targetYear)
    ) {
      return { success: false, error: 'Target and year must be valid numbers' }
    }

    if (target <= 0 || target > 100) {
      return { success: false, error: 'Target must be between 1-100 tonnes' }
    }

    if (targetYear < new Date().getFullYear()) {
      return { success: false, error: 'Target year must be current year or later' }
    }

    const goal: CarbonGoal = {
      target,
      targetYear,
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(goal))
    notifyGoalUpdated()
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to save goal' }
  }
}

/**
 * Remove the stored goal record from localStorage.
 */
export function deleteGoalRecord(): boolean {
  try {
    localStorage.removeItem(GOAL_STORAGE_KEY)
    notifyGoalUpdated()
    return true
  } catch {
    return false
  }
}

export function useGoal() {
  return {
    getGoal: readGoalRecord,
    setGoal: saveGoalRecord,
    deleteGoal: deleteGoalRecord,
  }
}
