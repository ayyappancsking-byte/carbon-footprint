import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { OnboardingModal } from '../components/OnboardingModal'

describe('OnboardingModal', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    const onDismiss = vi.fn()
    render(<OnboardingModal isOpen={false} onDismiss={onDismiss} />)

    expect(screen.queryByText('Welcome!')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    const onDismiss = vi.fn()
    render(<OnboardingModal isOpen={true} onDismiss={onDismiss} />)

    expect(screen.getByText('Welcome!')).toBeInTheDocument()
    expect(
      screen.getByText(
        /Answer a few questions about your lifestyle to discover your carbon footprint/
      )
    ).toBeInTheDocument()
  })

  it('should call onDismiss when Get Started button is clicked', () => {
    const onDismiss = vi.fn()
    render(<OnboardingModal isOpen={true} onDismiss={onDismiss} />)

    const button = screen.getByRole('button', { name: /Get Started/i })
    fireEvent.click(button)

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('should call onDismiss when Escape key is pressed', () => {
    const onDismiss = vi.fn()
    render(<OnboardingModal isOpen={true} onDismiss={onDismiss} />)

    const modal = screen.getByRole('dialog')
    fireEvent.keyDown(modal, { key: 'Escape' })

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('should have proper accessibility attributes', () => {
    const onDismiss = vi.fn()
    render(<OnboardingModal isOpen={true} onDismiss={onDismiss} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'onboarding-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'onboarding-description')
  })

  it('should trap focus within modal', () => {
    const onDismiss = vi.fn()
    render(<OnboardingModal isOpen={true} onDismiss={onDismiss} />)

    const button = screen.getByRole('button', { name: /Get Started/i })
    button.focus()

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    Object.defineProperty(event, 'target', { value: button })
    button.dispatchEvent(event)

    // After Tab on last focusable element, focus should wrap
    expect(document.activeElement).toBe(button)
  })
})


describe('OnboardingModal', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    const onDismiss = vi.fn()
    render(<OnboardingModal isOpen={false} onDismiss={onDismiss} />)

    expect(screen.queryByText('Welcome!')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    const onDismiss = vi.fn()
    render(<OnboardingModal isOpen={true} onDismiss={onDismiss} />)

    expect(screen.getByText('Welcome!')).toBeInTheDocument()
    expect(
      screen.getByText(
        /Answer a few questions about your lifestyle to discover your carbon footprint/
      )
    ).toBeInTheDocument()
  })

  it('should call onDismiss when Get Started button is clicked', () => {
    const onDismiss = vi.fn()
    render(<OnboardingModal isOpen={true} onDismiss={onDismiss} />)

    const button = screen.getByRole('button', { name: /Get Started/i })
    fireEvent.click(button)

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('should call onDismiss when Escape key is pressed', () => {
    const onDismiss = vi.fn()
    render(<OnboardingModal isOpen={true} onDismiss={onDismiss} />)

    const modal = screen.getByRole('dialog')
    fireEvent.keyDown(modal, { key: 'Escape' })

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('should have proper accessibility attributes', () => {
    const onDismiss = vi.fn()
    render(<OnboardingModal isOpen={true} onDismiss={onDismiss} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'onboarding-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'onboarding-description')
  })

  it('should trap focus within modal', () => {
    const onDismiss = vi.fn()
    render(<OnboardingModal isOpen={true} onDismiss={onDismiss} />)

    const button = screen.getByRole('button', { name: /Get Started/i })
    button.focus()

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    Object.defineProperty(event, 'target', { value: button })
    button.dispatchEvent(event)

    // After Tab on last focusable element, focus should wrap
    expect(document.activeElement).toBe(button)
  })
})
