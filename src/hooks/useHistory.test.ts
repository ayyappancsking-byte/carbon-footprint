import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useHistory } from './useHistory'

describe('useHistory', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should add entry to localStorage', () => {
    const { addEntry, getHistory } = useHistory()

    const result = addEntry({
      total: 5.5,
      breakdown: {
        transport: 2,
        homeEnergy: 1.5,
        diet: 1,
        goodsWaste: 1,
      },
    })

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()

    const history = getHistory()
    expect(history).toHaveLength(1)
    expect(history[0].total).toBe(5.5)
  })

  it('should retrieve entries sorted newest first', async () => {
    const { addEntry, getHistory } = useHistory()

    const entry1 = {
      total: 5.5,
      breakdown: {
        transport: 2,
        homeEnergy: 1.5,
        diet: 1,
        goodsWaste: 1,
      },
    }

    const entry2 = {
      total: 4.2,
      breakdown: {
        transport: 1.5,
        homeEnergy: 1,
        diet: 1,
        goodsWaste: 0.7,
      },
    }

    addEntry(entry1)
    await new Promise((resolve) => setTimeout(resolve, 10))
    addEntry(entry2)

    const history = getHistory()
    expect(history).toHaveLength(2)
    expect(history[0].total).toBe(4.2)
    expect(history[1].total).toBe(5.5)
  })

  it('should delete entry by date', () => {
    const { addEntry, getHistory, deleteEntry } = useHistory()

    addEntry({
      total: 5.5,
      breakdown: {
        transport: 2,
        homeEnergy: 1.5,
        diet: 1,
        goodsWaste: 1,
      },
    })

    const history = getHistory()
    const dateToDelete = history[0].date

    const deleteResult = deleteEntry(dateToDelete)
    expect(deleteResult).toBe(true)

    const updatedHistory = getHistory()
    expect(updatedHistory).toHaveLength(0)
  })

  it('should return empty array if localStorage is empty', () => {
    const { getHistory } = useHistory()

    const history = getHistory()
    expect(history).toEqual([])
  })

  it('should return empty array if data is corrupted', () => {
    localStorage.setItem('carbon_footprint_history', 'invalid json {')

    const { getHistory } = useHistory()

    const history = getHistory()
    expect(history).toEqual([])
  })

  it('should return empty array if localStorage is disabled', () => {
    const originalLocalStorage = globalThis.localStorage

    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('localStorage disabled')
        },
        setItem: () => {
          throw new Error('localStorage disabled')
        },
        clear: () => {},
      },
      writable: true,
    })

    const { getHistory } = useHistory()

    const history = getHistory()
    expect(history).toEqual([])

    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    })
  })

  it('should handle QuotaExceededError gracefully', () => {
    const { addEntry } = useHistory()

    const error = new DOMException('QuotaExceededError', 'QuotaExceededError')
    Object.defineProperty(error, 'code', {
      value: 22,
      writable: false,
      configurable: true,
    })

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw error
    })

    const result = addEntry({
      total: 5.5,
      breakdown: {
        transport: 2,
        homeEnergy: 1.5,
        diet: 1,
        goodsWaste: 1,
      },
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Storage quota exceeded')

    vi.restoreAllMocks()
  })

  it('should preserve breakdown structure in saved entries', () => {
    const { addEntry, getHistory } = useHistory()

    const breakdown = {
      transport: 2.1,
      homeEnergy: 1.5,
      diet: 1.2,
      goodsWaste: 0.7,
    }

    addEntry({
      total: 5.5,
      breakdown,
    })

    const history = getHistory()
    expect(history[0].breakdown).toEqual(breakdown)
  })

  it('should include ISO timestamp for each saved entry', () => {
    const { addEntry, getHistory } = useHistory()

    addEntry({
      total: 5.5,
      breakdown: {
        transport: 2,
        homeEnergy: 1.5,
        diet: 1,
        goodsWaste: 1,
      },
    })

    const history = getHistory()
    const entry = history[0]

    expect(entry.date).toBeDefined()
    expect(typeof entry.date).toBe('string')
    expect(new Date(entry.date).getTime()).toBeGreaterThan(0)
  })
})
