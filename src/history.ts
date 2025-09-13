import { Line } from './line'
import { CompassArc } from './compassArc'

export interface HistoryState {
  lines: Line[]
  arcs: CompassArc[]
}

interface SerializedHistoryData {
  history: HistoryState[]
  historyIndex: number
}

const HISTORY_STORAGE_KEY = 'drawing-history'

export class History {
  private history: HistoryState[] = []
  private historyIndex: number = -1

  constructor() {
    // Clear any existing localStorage data and start fresh on reload
    this.removeFromStorage()
    // Don't load from storage - always start fresh on reload
    // this.loadFromStorage()
  }

  pushHistory(state: HistoryState): void {
    // Remove all states after current index (clear redo stack)
    this.history = this.history.slice(0, this.historyIndex + 1)
    
    // Add new state
    this.history.push(state)
    this.historyIndex = this.history.length - 1
    
    // Don't save to localStorage - always start fresh on reload
    // this.saveToStorage()
  }

  undo(): HistoryState | null {
    if (this.historyIndex < 0) {
      // Already at empty state, cannot undo further
      return null
    }
    
    if (this.historyIndex === 0) {
      // Move from first entry to empty state
      this.historyIndex = -1
      return { lines: [], arcs: [] }
    }
    
    // Move to previous state in history
    this.historyIndex--
    return this.history[this.historyIndex] || null
  }

  redo(): HistoryState | null {
    if (this.historyIndex >= this.history.length - 1) {
      return null // Already at end
    }
    
    this.historyIndex++
    return this.history[this.historyIndex] || null
  }

  canUndo(): boolean {
    return this.historyIndex >= 0
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1
  }

  getCurrentState(): HistoryState | null {
    if (this.historyIndex < 0) {
      return null
    }
    return this.history[this.historyIndex] || null
  }

  getHistoryIndex(): number {
    return this.historyIndex
  }

  getHistoryLength(): number {
    return this.history.length
  }

  clearHistory(): void {
    this.history = []
    this.historyIndex = -1
    this.removeFromStorage()
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') {
      return // Skip in server-side environment
    }

    try {
      const data: SerializedHistoryData = {
        history: this.history,
        historyIndex: this.historyIndex
      }
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save history to localStorage:', error)
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return // Skip in server-side environment
    }

    try {
      const savedData = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (savedData) {
        const data: SerializedHistoryData = JSON.parse(savedData)
        
        // Restore history states with proper class instances
        this.history = (data.history || []).map(state => ({
          lines: state.lines.map((lineData: unknown) => Line.fromJSON(lineData as Parameters<typeof Line.fromJSON>[0])),
          arcs: state.arcs.map((arcData: unknown) => CompassArc.fromJSON(arcData as Parameters<typeof CompassArc.fromJSON>[0]))
        }))
        
        this.historyIndex = data.historyIndex ?? -1
      }
    } catch (error) {
      console.warn('Failed to load history from localStorage:', error)
      // Continue with empty history if loading fails
      this.history = []
      this.historyIndex = -1
    }
  }

  private removeFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return // Skip in server-side environment
    }

    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to remove history from localStorage:', error)
    }
  }
}