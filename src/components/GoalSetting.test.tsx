import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoalSetting } from './GoalSetting'

describe('GoalSetting', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders form with target and year inputs', () => {
    render(<GoalSetting />)
    expect(screen.getByText('My Carbon Goal')).toBeInTheDocument()
    expect(screen.getByLabelText(/Target footprint/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Target year/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save Goal/ })).toBeInTheDocument()
  })

  it('validates target range - rejects 0', async () => {
    const user = userEvent.setup()
    render(<GoalSetting />)

    const targetInput = screen.getByDisplayValue('2') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save Goal/ })

    await user.clear(targetInput)
    await user.type(targetInput, '0')
    await user.click(saveButton)

    expect(screen.getByText(/Target must be between/)).toBeInTheDocument()
    expect(screen.queryByText('Goal saved!')).not.toBeInTheDocument()
  })

  it('validates target range - rejects values > 100', async () => {
    const user = userEvent.setup()
    render(<GoalSetting />)

    const targetInput = screen.getByDisplayValue('2') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save Goal/ })

    await user.clear(targetInput)
    await user.type(targetInput, '101')
    await user.click(saveButton)

    expect(screen.getByText(/Target must be between/)).toBeInTheDocument()
  })

  it('validates year - rejects years < current year', async () => {
    const user = userEvent.setup()
    render(<GoalSetting />)

    const yearInput = screen.getByDisplayValue(String(new Date().getFullYear() + 1)) as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save Goal/ })

    await user.clear(yearInput)
    await user.type(yearInput, String(new Date().getFullYear() - 1))
    await user.click(saveButton)

    expect(screen.getByText(/Target year must be/)).toBeInTheDocument()
  })

  it('rejects empty goal input that parses to NaN', async () => {
    const user = userEvent.setup()
    render(<GoalSetting />)

    const targetInput = screen.getByDisplayValue('2') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save Goal/ })

    await user.clear(targetInput)
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/Target and year must be valid numbers/)).toBeInTheDocument()
    })

    expect(localStorage.getItem('carbon_footprint_goal')).toBeNull()
  })

  it('saves goal to localStorage on valid submit', async () => {
    const user = userEvent.setup()
    render(<GoalSetting />)

    const targetInput = screen.getByDisplayValue('2') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save Goal/ })

    await user.clear(targetInput)
    await user.type(targetInput, '2.5')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Goal saved!')).toBeInTheDocument()
    })

    const stored = localStorage.getItem('carbon_footprint_goal')
    expect(stored).toBeTruthy()
    const goal = JSON.parse(stored!)
    expect(goal.target).toBe(2.5)
  })

  it('notifies the parent when a goal is saved', async () => {
    const user = userEvent.setup()
    const onGoalChange = vi.fn()
    render(<GoalSetting onGoalChange={onGoalChange} />)

    const targetInput = screen.getByDisplayValue('2') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save Goal/ })

    await user.clear(targetInput)
    await user.type(targetInput, '2.5')
    await user.click(saveButton)

    await waitFor(() => {
      expect(onGoalChange).toHaveBeenCalledOnce()
    })
  })

  it('shows edit/delete buttons when goal exists', async () => {
    localStorage.setItem(
      'carbon_footprint_goal',
      JSON.stringify({
        target: 2,
        targetYear: 2030,
        createdAt: new Date().toISOString(),
      })
    )

    render(<GoalSetting />)

    expect(screen.getByRole('button', { name: /Edit Goal/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delete Goal/ })).toBeInTheDocument()
    expect(screen.getByText(/Target:/)).toBeInTheDocument()
    expect(screen.getByText('2 t CO₂e/year')).toBeInTheDocument()
    expect(screen.getByText('2030')).toBeInTheDocument()
  })

  it('handles localStorage quota exceeded gracefully', async () => {
    const user = userEvent.setup()
    const originalSetItem = Storage.prototype.setItem
    const mockSetItem = vi.fn((key: string, value: string) => {
      if (key === 'carbon_footprint_goal') {
        throw new Error('QuotaExceededError')
      }
      originalSetItem.call(localStorage, key, value)
    })

    Storage.prototype.setItem = mockSetItem as typeof Storage.prototype.setItem

    render(<GoalSetting />)

    const saveButton = screen.getByRole('button', { name: /Save Goal/ })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/Failed to save goal/)).toBeInTheDocument()
    })

    Storage.prototype.setItem = originalSetItem
  })

  it('updates goal when editing existing goal', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'carbon_footprint_goal',
      JSON.stringify({
        target: 2,
        targetYear: 2030,
        createdAt: new Date().toISOString(),
      })
    )

    render(<GoalSetting />)

    const editButton = screen.getByRole('button', { name: /Edit Goal/ })
    await user.click(editButton)

    const targetInput = screen.getByDisplayValue('2') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save Goal/ })

    await user.clear(targetInput)
    await user.type(targetInput, '3')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Goal saved!')).toBeInTheDocument()
    })

    const stored = localStorage.getItem('carbon_footprint_goal')
    const goal = JSON.parse(stored!)
    expect(goal.target).toBe(3)
  })

  it('clears goal and resets form on delete', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'carbon_footprint_goal',
      JSON.stringify({
        target: 2,
        targetYear: 2030,
        createdAt: new Date().toISOString(),
      })
    )

    render(<GoalSetting />)

    const deleteButton = screen.getByRole('button', { name: /Delete Goal/ })

    window.confirm = vi.fn(() => true)

    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Goal deleted')).toBeInTheDocument()
    })

    expect(localStorage.getItem('carbon_footprint_goal')).toBeNull()
    expect(screen.getByLabelText(/Target footprint/)).toBeInTheDocument()
  })
})
