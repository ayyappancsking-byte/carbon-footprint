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

export function useHistory() {
  const getHistory = (): HistoryEntry[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return []
      return parsed.sort((a: HistoryEntry, b: HistoryEntry) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    } catch {
      return []
    }
  }

  const addEntry = (entry: Omit<HistoryEntry, 'date'>): { success: boolean; error?: string } => {
    try {
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
