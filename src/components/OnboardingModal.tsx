import { useEffect, useRef } from 'react'
import { trapDialogFocus } from './dialogFocus'
import '../styles/OnboardingModal.css'

interface OnboardingModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export function OnboardingModal({ isOpen, onDismiss }: OnboardingModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !dialogRef.current) {
      return undefined
    }

    return trapDialogFocus(dialogRef.current, onDismiss)
  }, [isOpen, onDismiss])

  if (!isOpen) {
    return null
  }

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
          <h2 id="onboarding-title" className="onboarding-title">
            Welcome!
          </h2>
          <p id="onboarding-description" className="onboarding-text">
            Answer a few questions about your lifestyle to discover your carbon footprint and get
            personalized tips to reduce it.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={onDismiss} aria-label="Get started">
          Get Started
        </button>
      </div>
    </div>
  )
}
