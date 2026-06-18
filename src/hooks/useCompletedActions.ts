const COMPLETED_ACTIONS_KEY = 'carbon_completed_actions'

function isCompletedActionId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeCompletedActions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(new Set(value.filter(isCompletedActionId).map((actionId) => actionId.trim())))
}

/**
 * Read the user's completed action ids from localStorage.
 */
export function readCompletedActions(): string[] {
  try {
    const stored = localStorage.getItem(COMPLETED_ACTIONS_KEY)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    return normalizeCompletedActions(parsed)
  } catch {
    return []
  }
}

/**
 * Toggle a completed action in localStorage.
 */
export function toggleCompletedAction(actionId: string): void {
  try {
    if (!isCompletedActionId(actionId)) {
      return
    }

    const normalizedActionId = actionId.trim()
    const completed = readCompletedActions()
    const index = completed.indexOf(normalizedActionId)
    if (index > -1) {
      completed.splice(index, 1)
    } else {
      completed.push(normalizedActionId)
    }

    localStorage.setItem(COMPLETED_ACTIONS_KEY, JSON.stringify(completed))
  } catch {
    // Silent fail on localStorage error.
  }
}

/**
 * Clear all completed actions from localStorage.
 */
export function clearCompletedActions(): void {
  try {
    localStorage.removeItem(COMPLETED_ACTIONS_KEY)
  } catch {
    // Silent fail on localStorage error.
  }
}

export function useCompletedActions() {
  return {
    getCompletedActions: readCompletedActions,
    toggleAction: toggleCompletedAction,
    clearActions: clearCompletedActions,
  }
}
