const STORAGE_KEY = 'carbon_footprint_history'

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

export function useHistory() {
  const getHistory = (): HistoryEntry[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      const parsed: unknown = JSON.parse(stored)
      if (!Array.isArray(parsed)) return []
      return parsed
        .filter(isValidHistoryEntry)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch {
      return []
    }
  }

  const addEntry = (entry: Omit<HistoryEntry, 'date'>): { success: boolean; error?: string } => {
    try {
      if (!isValidHistoryEntryInput(entry)) {
        return { success: false, error: 'Invalid entry data' }
      }
      const history = getHistory()
      const newEntry: HistoryEntry = {
        ...entry,
        date: new Date().toISOString(),
      }
      history.push(newEntry)
      const sorted = history.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted))
      return { success: true }
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        return { success: false, error: 'Storage quota exceeded' }
      }
      return { success: false, error: 'Failed to save entry' }
    }
  }

  const deleteEntry = (date: string): boolean => {
    try {
      const history = getHistory()
      const filtered = history.filter((entry) => entry.date !== date)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      return true
    } catch {
      return false
    }
  }

  return { getHistory, addEntry, deleteEntry }
}
