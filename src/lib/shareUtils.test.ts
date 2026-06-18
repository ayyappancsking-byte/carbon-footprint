import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { shareResult } from './shareUtils'

describe('shareUtils', () => {
  const originalShare = navigator.share
  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: originalShare,
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    })
    vi.restoreAllMocks()
  })

  it('uses the Web Share API when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    })

    const result = await shareResult(5.5)

    expect(result).toBe(true)
    expect(share).toHaveBeenCalledOnce()
    expect(share).toHaveBeenCalledWith({
      title: 'Carbon Footprint Report',
      text: 'My carbon footprint is 5.50 tCO2e/year - calculate yours and start reducing it!',
    })
  })

  it('falls back to the clipboard when Web Share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const result = await shareResult(3.14159)

    expect(result).toBe(true)
    expect(writeText).toHaveBeenCalledOnce()
    expect(writeText).toHaveBeenCalledWith(
      'My carbon footprint is 3.14 tCO2e/year - calculate yours and start reducing it!'
    )
  })

  it('returns false when no sharing surface exists', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })

    const result = await shareResult(0)

    expect(result).toBe(false)
  })

  it('falls back to the clipboard when native sharing rejects', async () => {
    const share = vi.fn().mockRejectedValue(new Error('native share failed'))
    const writeText = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const result = await shareResult(7.25)

    expect(result).toBe(true)
    expect(share).toHaveBeenCalledOnce()
    expect(writeText).toHaveBeenCalledOnce()
  })

  it('returns false when clipboard copying fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard unavailable'))

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    const result = await shareResult(4.2)

    expect(result).toBe(false)
    expect(writeText).toHaveBeenCalledOnce()
  })
})
