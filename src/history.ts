import { Line } from './line'
import { CompassArc } from './compassArc'

export interface HistoryState {
  lines: Line[]
  arcs: CompassArc[]
}

export class History {
  private history: HistoryState[] = []
  private historyIndex: number = -1

  constructor() {
    // Intentionally stateless across sessions - no persistence needed
  }

  pushHistory(state: HistoryState): void {
    // Remove all states after current index (clear redo stack)
    this.history = this.history.slice(0, this.historyIndex + 1)
    
    // Add new state with deep copy to prevent history pollution
    this.history.push(this.deepCopyState(state))
    this.historyIndex = this.history.length - 1
  }

  private deepCopyState(state: HistoryState): HistoryState {
    return {
      lines: state.lines.map(line => Line.fromJSON(line.toJSON())),
      arcs: state.arcs.map(arc => CompassArc.fromJSON(arc.toJSON()))
    }
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
  }
}
