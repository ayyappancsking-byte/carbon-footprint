const COMPLETED_ACTIONS_KEY = 'carbon_completed_actions'

export function useCompletedActions() {
  const getCompletedActions = (): string[] => {
    try {
      const stored = localStorage.getItem(COMPLETED_ACTIONS_KEY)
      if (!stored) return []
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        return parsed
      }
      return []
    } catch {
      return []
    }
  }

  const toggleAction = (actionId: string): void => {
    try {
      const completed = getCompletedActions()
      const index = completed.indexOf(actionId)
      if (index > -1) {
        completed.splice(index, 1)
      } else {
        completed.push(actionId)
      }
      localStorage.setItem(COMPLETED_ACTIONS_KEY, JSON.stringify(completed))
    } catch {
      // Silent fail on localStorage error
    }
  }

  const clearActions = (): void => {
    try {
      localStorage.removeItem(COMPLETED_ACTIONS_KEY)
    } catch {
      // Silent fail on localStorage error
    }
  }

  return {
    getCompletedActions,
    toggleAction,
    clearActions,
  }
}
