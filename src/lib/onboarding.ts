const ONBOARDING_STORAGE_KEY = 'hasSeenOnboarding'

/**
 * Read whether the onboarding modal has already been shown.
 */
export function readOnboardingSeen(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Persist that the onboarding modal has been dismissed.
 */
export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
  } catch {
    // Ignore storage failures so the app still works in restricted browsers.
  }
}
