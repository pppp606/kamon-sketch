import { History } from './history'

export class UndoRedoButtons {
  private history: History
  private onUndo: () => void
  private onRedo: () => void
  private undoButton: HTMLButtonElement | null = null
  private redoButton: HTMLButtonElement | null = null

  constructor(history: History, onUndo: () => void, onRedo: () => void) {
    this.history = history
    this.onUndo = onUndo
    this.onRedo = onRedo
    
    this.initializeButtons()
  }

  private initializeButtons(): void {
    // Skip initialization if running in non-browser environment
    if (typeof document === 'undefined') {
      return
    }
    
    this.undoButton = document.getElementById('undo-btn') as HTMLButtonElement
    this.redoButton = document.getElementById('redo-btn') as HTMLButtonElement
    
    if (this.undoButton) {
      this.undoButton.addEventListener('click', () => this.handleUndoClick())
      this.undoButton.setAttribute('title', 'Undo (Ctrl+Z)')
      this.undoButton.setAttribute('aria-label', 'Undo last action')
    }
    
    if (this.redoButton) {
      this.redoButton.addEventListener('click', () => this.handleRedoClick())
      this.redoButton.setAttribute('title', 'Redo (Ctrl+Y)')
      this.redoButton.setAttribute('aria-label', 'Redo last undone action')
    }
    
    // Initial state update
    this.updateButtonStates()
  }

  updateButtonStates(): void {
    const canUndo = this.history.canUndo()
    const canRedo = this.history.canRedo()
    
    if (this.undoButton) {
      this.undoButton.disabled = !canUndo
      this.undoButton.classList.toggle('disabled', !canUndo)
      this.undoButton.setAttribute('aria-disabled', (!canUndo).toString())
      this.undoButton.setAttribute('title', canUndo ? 'Undo (Ctrl+Z)' : 'Nothing to undo')
    }
    
    if (this.redoButton) {
      this.redoButton.disabled = !canRedo
      this.redoButton.classList.toggle('disabled', !canRedo)
      this.redoButton.setAttribute('aria-disabled', (!canRedo).toString())
      this.redoButton.setAttribute('title', canRedo ? 'Redo (Ctrl+Y)' : 'Nothing to redo')
    }
  }

  private handleUndoClick(): void {
    if (!this.undoButton?.disabled && this.history.canUndo()) {
      this.onUndo()
    }
  }

  private handleRedoClick(): void {
    if (!this.redoButton?.disabled && this.history.canRedo()) {
      this.onRedo()
    }
  }
}