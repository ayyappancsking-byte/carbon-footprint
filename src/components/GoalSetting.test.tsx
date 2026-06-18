import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoalSetting } from './GoalSetting'

describe('GoalSetting', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders form with target and year inputs', () => {
    render(<GoalSetting />)
    expect(screen.getByText('My Carbon Goal')).toBeInTheDocument()
    expect(screen.getByLabelText(/Target footprint/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Target year/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save carbon goal/ })).toBeInTheDocument()
  })

  it('validates target range - rejects 0', async () => {
    const user = userEvent.setup()
    render(<GoalSetting />)

    const targetInput = screen.getByDisplayValue('2') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save carbon goal/ })

    await user.clear(targetInput)
    await user.type(targetInput, '0')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Target must be between/)
    })

    expect(screen.queryByText('Goal saved!')).not.toBeInTheDocument()
  })

  it('validates target range - rejects values > 100', async () => {
    const user = userEvent.setup()
    render(<GoalSetting />)

    const targetInput = screen.getByDisplayValue('2') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save carbon goal/ })

    await user.clear(targetInput)
    await user.type(targetInput, '101')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Target must be between/)
    })
  })

  it('validates year - rejects years before the current year', async () => {
    const user = userEvent.setup()
    render(<GoalSetting />)

    const yearInput = screen.getByDisplayValue(String(new Date().getFullYear() + 1)) as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save carbon goal/ })

    await user.clear(yearInput)
    await user.type(yearInput, String(new Date().getFullYear() - 1))
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Target year must be/)
    })
  })

  it('rejects empty goal input that parses to NaN', async () => {
    const user = userEvent.setup()
    render(<GoalSetting />)

    const targetInput = screen.getByDisplayValue('2') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save carbon goal/ })

    await user.clear(targetInput)
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Target and year must be valid numbers/)
    })

    expect(localStorage.getItem('carbon_footprint_goal')).toBeNull()
  })

  it('saves goal to localStorage on valid submit', async () => {
    const user = userEvent.setup()
    render(<GoalSetting />)

    const targetInput = screen.getByDisplayValue('2') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save carbon goal/ })

    await user.clear(targetInput)
    await user.type(targetInput, '2.5')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Goal saved!')
    })

    const stored = localStorage.getItem('carbon_footprint_goal')
    expect(stored).toBeTruthy()
    const goal = JSON.parse(stored!)
    expect(goal.target).toBe(2.5)
  })

  it('shows edit/delete buttons when goal exists', () => {
    localStorage.setItem(
      'carbon_footprint_goal',
      JSON.stringify({
        target: 2,
        targetYear: 2030,
        createdAt: new Date().toISOString(),
      }),
    )

    render(<GoalSetting />)

    expect(screen.getByRole('button', { name: /Edit carbon goal/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delete carbon goal/ })).toBeInTheDocument()
    expect(screen.getByText(/Target:/)).toBeInTheDocument()
    expect(screen.getByText('2 t CO2e/year')).toBeInTheDocument()
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

    const saveButton = screen.getByRole('button', { name: /Save carbon goal/ })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Failed to save goal/)
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
      }),
    )

    render(<GoalSetting />)

    const editButton = screen.getByRole('button', { name: /Edit carbon goal/ })
    await user.click(editButton)

    const targetInput = screen.getByDisplayValue('2') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /Save carbon goal/ })

    await user.clear(targetInput)
    await user.type(targetInput, '3')
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Goal saved!')
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
      }),
    )

    render(<GoalSetting />)

    const deleteButton = screen.getByRole('button', { name: /Delete carbon goal/ })

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Goal deleted')
    })

    expect(localStorage.getItem('carbon_footprint_goal')).toBeNull()
    expect(screen.getByLabelText(/Target footprint/)).toBeInTheDocument()
  })

  it('returns to the goal display when editing is cancelled', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'carbon_footprint_goal',
      JSON.stringify({
        target: 2,
        targetYear: 2030,
        createdAt: new Date().toISOString(),
      }),
    )

    render(<GoalSetting />)

    await user.click(screen.getByRole('button', { name: /Edit carbon goal/ }))
    await user.click(screen.getByRole('button', { name: /Cancel goal editing/ }))

    expect(screen.getByRole('button', { name: /Edit carbon goal/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delete carbon goal/ })).toBeInTheDocument()
  })

  it('keeps the goal when deletion is cancelled', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'carbon_footprint_goal',
      JSON.stringify({
        target: 2,
        targetYear: 2030,
        createdAt: new Date().toISOString(),
      }),
    )

    render(<GoalSetting />)

    vi.spyOn(window, 'confirm').mockReturnValue(false)

    await user.click(screen.getByRole('button', { name: /Delete carbon goal/ }))

    expect(screen.getByText(/Target:/)).toBeInTheDocument()
    expect(localStorage.getItem('carbon_footprint_goal')).not.toBeNull()
  })

  it('shows an error when deleting the goal fails', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'carbon_footprint_goal',
      JSON.stringify({
        target: 2,
        targetYear: 2030,
        createdAt: new Date().toISOString(),
      }),
    )

    render(<GoalSetting />)

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    await user.click(screen.getByRole('button', { name: /Delete carbon goal/ }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to delete goal')
    })
  })

  it('shows an error when saving the goal fails', async () => {
    const user = userEvent.setup()
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'carbon_footprint_goal') {
        throw new Error('storage unavailable')
      }

      return originalSetItem.call(this, key, value)
    })

    render(<GoalSetting />)

    await user.click(screen.getByRole('button', { name: /Save carbon goal/ }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to save goal')
    })
  })
})
