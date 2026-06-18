import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { markOnboardingSeen, readOnboardingSeen } from './onboarding'

describe('onboarding', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns false when the onboarding flag is not stored', () => {
    expect(readOnboardingSeen()).toBe(false)
  })

  it('returns false when reading onboarding state fails', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    expect(readOnboardingSeen()).toBe(false)
  })

  it('marks onboarding as seen', () => {
    markOnboardingSeen()

    expect(readOnboardingSeen()).toBe(true)
  })

  it('swallows storage errors when marking onboarding as seen', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    expect(() => markOnboardingSeen()).not.toThrow()
  })
})
