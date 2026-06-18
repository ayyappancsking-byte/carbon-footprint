const STORAGE_KEY = 'carbon_footprint_history'
export const HISTORY_UPDATED_EVENT = 'carbon-history-updated'

export interface HistoryEntry {
  date: string
  total: number
  breakdown: {
    transport: number
    homeEnergy: number
    diet: number
    goodsWaste: number
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isValidHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<HistoryEntry>
  const breakdown = candidate.breakdown

  return (
    typeof candidate.date === 'string' &&
    !Number.isNaN(new Date(candidate.date).getTime()) &&
    isFiniteNumber(candidate.total) &&
    typeof breakdown === 'object' &&
    breakdown !== null &&
    isFiniteNumber(breakdown.transport) &&
    isFiniteNumber(breakdown.homeEnergy) &&
    isFiniteNumber(breakdown.diet) &&
    isFiniteNumber(breakdown.goodsWaste)
  )
}

function isValidHistoryEntryInput(entry: Omit<HistoryEntry, 'date'>): boolean {
  return (
    isFiniteNumber(entry.total) &&
    isFiniteNumber(entry.breakdown.transport) &&
    isFiniteNumber(entry.breakdown.homeEnergy) &&
    isFiniteNumber(entry.breakdown.diet) &&
    isFiniteNumber(entry.breakdown.goodsWaste)
  )
}

/**
 * Sort history entries from newest to oldest.
 */
function sortHistoryEntries(entries: HistoryEntry[]): HistoryEntry[] {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function notifyHistoryUpdated(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT))
}

/**
 * Read and validate history entries from localStorage.
 */
export function readHistoryEntries(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      return []
    }

    return sortHistoryEntries(parsed.filter(isValidHistoryEntry))
  } catch {
    return []
  }
}

/**
 * Persist a validated history entry to localStorage.
 */
export function addHistoryEntry(entry: Omit<HistoryEntry, 'date'>): { success: boolean; error?: string } {
  try {
    if (!isValidHistoryEntryInput(entry)) {
      return { success: false, error: 'Invalid entry data' }
    }

    const nextHistory = sortHistoryEntries([
      ...readHistoryEntries(),
      {
        ...entry,
        date: new Date().toISOString(),
      },
    ])

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory))
    notifyHistoryUpdated()
    return { success: true }
  } catch (error) {
    if (error instanceof DOMException && error.code === 22) {
      return { success: false, error: 'Storage quota exceeded' }
    }

    return { success: false, error: 'Failed to save entry' }
  }
}

/**
 * Remove a history entry from localStorage by timestamp.
 */
export function deleteHistoryEntry(date: string): boolean {
  try {
    const filtered = readHistoryEntries().filter((entry) => entry.date !== date)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    notifyHistoryUpdated()
    return true
  } catch {
    return false
  }
}

export function useHistory() {
  return {
    getHistory: readHistoryEntries,
    addEntry: addHistoryEntry,
    deleteEntry: deleteHistoryEntry,
  }
}
