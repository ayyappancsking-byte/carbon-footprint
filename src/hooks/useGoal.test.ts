import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useGoal } from './useGoal'

describe('useGoal', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('rejects NaN target values', () => {
    const { setGoal, getGoal } = useGoal()

    const result = setGoal(Number.NaN, 2030)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Target and year must be valid numbers')
    expect(getGoal()).toBeNull()
  })

  it('rejects NaN year values', () => {
    const { setGoal, getGoal } = useGoal()

    const result = setGoal(2.5, Number.NaN)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Target and year must be valid numbers')
    expect(getGoal()).toBeNull()
  })

  it('rejects malformed stored goal data', () => {
    localStorage.setItem(
      'carbon_footprint_goal',
      JSON.stringify({
        target: 2,
        targetYear: 2030,
      })
    )

    const { getGoal } = useGoal()

    expect(getGoal()).toBeNull()
  })

  it('returns null when stored goal data is not an object', () => {
    localStorage.setItem('carbon_footprint_goal', JSON.stringify(123))

    const { getGoal } = useGoal()

    expect(getGoal()).toBeNull()
  })

  it('returns null when reading the stored goal fails', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    const { getGoal } = useGoal()

    expect(getGoal()).toBeNull()
  })

  it('returns false when deleting the goal fails', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    const { deleteGoal } = useGoal()

    expect(deleteGoal()).toBe(false)
  })
})
