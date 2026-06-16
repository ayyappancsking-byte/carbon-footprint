import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useCompletedActions } from './useCompletedActions'

describe('useCompletedActions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('returns empty array when localStorage empty', () => {
    const { getCompletedActions } = useCompletedActions()
    expect(getCompletedActions()).toEqual([])
  })

  it('toggleAction adds new actionId correctly', () => {
    const { getCompletedActions, toggleAction } = useCompletedActions()

    toggleAction('transport-switch-one-car')
    const result = getCompletedActions()

    expect(result).toContain('transport-switch-one-car')
    expect(result.length).toBe(1)
  })

  it('toggleAction removes existing actionId (toggle off)', () => {
    const { getCompletedActions, toggleAction } = useCompletedActions()

    toggleAction('transport-switch-one-car')
    let result = getCompletedActions()
    expect(result).toContain('transport-switch-one-car')

    toggleAction('transport-switch-one-car')
    result = getCompletedActions()
    expect(result).not.toContain('transport-switch-one-car')
    expect(result.length).toBe(0)
  })

  it('clearActions empties localStorage', () => {
    const { getCompletedActions, toggleAction, clearActions } = useCompletedActions()

    toggleAction('action1')
    toggleAction('action2')
    expect(getCompletedActions().length).toBe(2)

    clearActions()
    expect(getCompletedActions()).toEqual([])
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('carbon_completed_actions', 'invalid json')

    const { getCompletedActions, toggleAction } = useCompletedActions()
    expect(getCompletedActions()).toEqual([])

    toggleAction('action1')
    expect(getCompletedActions()).toContain('action1')
  })
})
