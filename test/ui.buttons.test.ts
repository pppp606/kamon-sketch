/**
 * @jest-environment jsdom
 */

import { UndoRedoButtons } from '../src/undoRedoButtons'
import { History, HistoryState } from '../src/history'
import { Line } from '../src/line'

describe('UndoRedoButtons', () => {
  let undoRedoButtons: UndoRedoButtons
  let history: History
  let onUndo: jest.Mock
  let onRedo: jest.Mock
  let undoButton: HTMLButtonElement
  let redoButton: HTMLButtonElement

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    
    // Set up DOM elements
    document.body.innerHTML = `
      <div class="mode-buttons">
        <button id="undo-btn" class="mode-btn">Undo</button>
        <button id="redo-btn" class="mode-btn">Redo</button>
      </div>
    `
    
    undoButton = document.getElementById('undo-btn') as HTMLButtonElement
    redoButton = document.getElementById('redo-btn') as HTMLButtonElement
    
    history = new History()
    onUndo = jest.fn()
    onRedo = jest.fn()
    
    undoRedoButtons = new UndoRedoButtons(history, onUndo, onRedo)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('initialization', () => {
    it('should create UndoRedoButtons instance', () => {
      expect(undoRedoButtons).toBeInstanceOf(UndoRedoButtons)
    })

    it('should find and store undo/redo button elements', () => {
      expect(undoButton).toBeTruthy()
      expect(redoButton).toBeTruthy()
    })

    it('should disable both buttons when history is empty', () => {
      undoRedoButtons.updateButtonStates()
      
      expect(undoButton.disabled).toBe(true)
      expect(redoButton.disabled).toBe(true)
    })

    it('should add disabled class to buttons when disabled', () => {
      undoRedoButtons.updateButtonStates()
      
      expect(undoButton.classList.contains('disabled')).toBe(true)
      expect(redoButton.classList.contains('disabled')).toBe(true)
    })
  })

  describe('button state management', () => {
    it('should enable undo button when history has items', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      
      undoRedoButtons.updateButtonStates()
      
      expect(undoButton.disabled).toBe(false)
      expect(redoButton.disabled).toBe(true)
      expect(undoButton.classList.contains('disabled')).toBe(false)
      expect(redoButton.classList.contains('disabled')).toBe(true)
    })

    it('should enable redo button after undo', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      history.undo() // Create redo opportunity - this moves index to -1 (empty state)
      
      undoRedoButtons.updateButtonStates()
      
      // After undo from the first state, we're at empty state (-1 index)
      // canUndo() returns false because historyIndex < 0
      // canRedo() returns true because historyIndex < history.length - 1
      expect(undoButton.disabled).toBe(true)
      expect(redoButton.disabled).toBe(false)
      expect(undoButton.classList.contains('disabled')).toBe(true)
      expect(redoButton.classList.contains('disabled')).toBe(false)
    })

    it('should disable undo button when at oldest state', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      
      // Undo to beginning
      history.undo()
      history.undo() // Now at beginning
      
      undoRedoButtons.updateButtonStates()
      
      expect(undoButton.disabled).toBe(true)
      expect(redoButton.disabled).toBe(false)
    })

    it('should disable redo button when at newest state', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      history.undo()
      history.redo() // Back to newest
      
      undoRedoButtons.updateButtonStates()
      
      expect(undoButton.disabled).toBe(false)
      expect(redoButton.disabled).toBe(true)
    })
  })

  describe('button click handling', () => {
    it('should call onUndo when undo button is clicked', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      
      // Update button states to enable undo button
      undoRedoButtons.updateButtonStates()
      expect(undoButton.disabled).toBe(false)
      
      undoButton.click()
      
      expect(onUndo).toHaveBeenCalledTimes(1)
      expect(onRedo).toHaveBeenCalledTimes(0)
    })

    it('should call onRedo when redo button is clicked', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      history.undo() // Create redo opportunity
      
      // Update button states to enable redo button
      undoRedoButtons.updateButtonStates()
      expect(redoButton.disabled).toBe(false)
      
      redoButton.click()
      
      expect(onRedo).toHaveBeenCalledTimes(1)
      expect(onUndo).toHaveBeenCalledTimes(0)
    })

    it('should not call onUndo when undo button is disabled', () => {
      // Empty history - undo should be disabled
      undoRedoButtons.updateButtonStates()
      expect(undoButton.disabled).toBe(true)
      
      undoButton.click()
      
      expect(onUndo).toHaveBeenCalledTimes(0)
    })

    it('should not call onRedo when redo button is disabled', () => {
      // No redo available
      undoRedoButtons.updateButtonStates()
      expect(redoButton.disabled).toBe(true)
      
      redoButton.click()
      
      expect(onRedo).toHaveBeenCalledTimes(0)
    })
  })

  describe('DOM integration', () => {
    it('should handle missing button elements gracefully', () => {
      // Remove buttons from DOM
      document.body.innerHTML = ''
      
      expect(() => {
        const buttons = new UndoRedoButtons(history, onUndo, onRedo)
        buttons.updateButtonStates()
      }).not.toThrow()
    })

    it('should update button text/titles when state changes', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      
      undoRedoButtons.updateButtonStates()
      
      // Should have appropriate title attributes or aria-labels
      expect(undoButton.getAttribute('title')).toBeTruthy()
      expect(redoButton.getAttribute('title')).toBeTruthy()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      undoRedoButtons.updateButtonStates()
      
      expect(undoButton.getAttribute('aria-label')).toBeTruthy()
      expect(redoButton.getAttribute('aria-label')).toBeTruthy()
    })

    it('should update ARIA attributes based on state', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      
      undoRedoButtons.updateButtonStates()
      
      expect(undoButton.getAttribute('aria-disabled')).toBe('false')
      expect(redoButton.getAttribute('aria-disabled')).toBe('true')
    })
  })
})