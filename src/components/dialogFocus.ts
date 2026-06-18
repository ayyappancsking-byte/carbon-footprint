const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Trap keyboard focus inside a dialog and restore the previously focused element on cleanup.
 */
export function trapDialogFocus(dialog: HTMLElement, onEscape: () => void): () => void {
  const previouslyFocused = document.activeElement as HTMLElement | null
  const focusableElements = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  firstElement?.focus()

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onEscape()
      previouslyFocused?.focus()
      return
    }

    if (event.key !== 'Tab' || focusableElements.length === 0) {
      return
    }

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      }
      return
    }

    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement?.focus()
    }
  }

  dialog.addEventListener('keydown', handleKeyDown)
  return () => {
    dialog.removeEventListener('keydown', handleKeyDown)
    previouslyFocused?.focus()
  }
}
