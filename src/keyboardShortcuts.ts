import { History } from './history'
import { P5Instance } from './types/p5'

export class KeyboardShortcuts {
  private history: History
  private onUndo: () => void
  private onRedo: () => void

  constructor(history: History, onUndo: () => void, onRedo: () => void) {
    this.history = history
    this.onUndo = onUndo
    this.onRedo = onRedo
  }

  handleKeyPressed(p: P5Instance): void {
    const controlKey = p.CONTROL || 17 // Default control key code
    const commandKey = p.COMMAND || 91 // Default command key code (Mac)
    const isCtrlPressed = p.keyIsDown(controlKey) || p.keyIsDown(commandKey) // Support both Ctrl and Cmd
    const isShiftPressed = p.keyIsDown(16) // SHIFT key code
    
    // Handle Ctrl+Z (Undo)
    if (isCtrlPressed && p.keyCode === 90) { // 90 is 'Z' key
      if (isShiftPressed) {
        // Ctrl+Shift+Z = Redo (alternative shortcut)
        this.handleRedo()
      } else {
        // Ctrl+Z = Undo
        this.handleUndo()
      }
      return
    }
    
    // Handle Ctrl+Y (Redo)
    if (isCtrlPressed && p.keyCode === 89) { // 89 is 'Y' key
      this.handleRedo()
      return
    }
  }

  private handleUndo(): void {
    if (this.history.canUndo()) {
      this.onUndo()
    }
  }

  private handleRedo(): void {
    if (this.history.canRedo()) {
      this.onRedo()
    }
  }
}