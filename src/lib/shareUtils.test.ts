import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { shareResult } from '../lib/shareUtils'

describe('shareUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Remove share and clipboard from navigator
    delete (globalThis.navigator as any).share
    delete (globalThis.navigator as any).clipboard
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('shareResult', () => {
    it('should use Web Share API if available', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined)
      ;(globalThis.navigator as any).share = shareMock

      const result = await shareResult(5.5)

      expect(shareMock).toHaveBeenCalledWith({
        text: 'My carbon footprint is 5.50 tCO2e/year — calculate yours and start reducing it!',
        title: 'Carbon Footprint Report',
      })
      expect(result).toBe(true)
    })

    it('should fallback to clipboard if Web Share API is not available', async () => {
      const clipboardMock = {
        writeText: vi.fn().mockResolvedValue(undefined),
      }
      ;(globalThis.navigator as any).clipboard = clipboardMock

      const result = await shareResult(5.5)

      expect(clipboardMock.writeText).toHaveBeenCalledWith(
        'My carbon footprint is 5.50 tCO2e/year — calculate yours and start reducing it!'
      )
      expect(result).toBe(true)
    })

    it('should return false if Web Share API throws and no clipboard', async () => {
      ;(globalThis.navigator as any).share = vi.fn().mockRejectedValue(new Error('Share failed'))

      const result = await shareResult(5.5)

      expect(result).toBe(false)
    })

    it('should return false if clipboard also fails', async () => {
      const clipboardMock = {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard failed')),
      }
      ;(globalThis.navigator as any).clipboard = clipboardMock

      const result = await shareResult(5.5)

      expect(result).toBe(false)
    })

    it('should return false on AbortError without trying clipboard', async () => {
      const error = new Error('User cancelled')
      ;(error as any).name = 'AbortError'
      ;(globalThis.navigator as any).share = vi.fn().mockRejectedValue(error)

      const result = await shareResult(5.5)

      expect(result).toBe(false)
    })

    it('should format the total correctly', async () => {
      const clipboardMock = {
        writeText: vi.fn().mockResolvedValue(undefined),
      }
      ;(globalThis.navigator as any).clipboard = clipboardMock

      await shareResult(3.14159)

      const callText = clipboardMock.writeText.mock.calls[0][0]
      expect(callText).toContain('3.14 tCO2e/year')
    })
  })
})


