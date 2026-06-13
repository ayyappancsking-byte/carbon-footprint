import { useEffect, useRef } from 'react'
import '../styles/OnboardingModal.css'

interface OnboardingModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export function OnboardingModal({ isOpen, onDismiss }: OnboardingModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return

    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement as HTMLElement

    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    firstElement?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss()
        previouslyFocused?.focus()
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onDismiss])

  if (!isOpen) return null

  return (
    <div className="onboarding-overlay">
      <div
        ref={dialogRef}
        className="onboarding-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        <div className="onboarding-content">
          <h2 id="onboarding-title" className="onboarding-title">Welcome!</h2>
          <p id="onboarding-description" className="onboarding-text">
            Answer a few questions about your lifestyle to discover your carbon footprint
            and get personalized tips to reduce it.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={onDismiss}
        >
          Get Started
        </button>
      </div>
    </div>
  )
}
