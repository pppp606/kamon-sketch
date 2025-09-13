import { History, HistoryState } from '../src/history'
import { Line } from '../src/line'

describe('History Edge Cases', () => {
  let history: History
  
  beforeEach(() => {
    history = new History()
  })

  describe('excessive undo operations', () => {
    it('should handle undoing beyond history limit without breaking redo', () => {
      // Set up a simple history with one state
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state1: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state1)
      
      
      // First undo should work (go to empty state)
      const undoResult1 = history.undo()
      
      expect(undoResult1).toEqual({ lines: [], arcs: [] })
      expect(history.canRedo()).toBe(true)
      
      // Second undo should return null (no more to undo)
      const undoResult2 = history.undo()
      
      expect(undoResult2).toBeNull()
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(true) // This should still be true
      
      // Redo should still work after excessive undo
      const redoResult = history.redo()
      
      expect(redoResult).toEqual(state1)
      expect(history.canUndo()).toBe(true)
      expect(history.canRedo()).toBe(false)
    })

    it('should handle multiple excessive undo operations', () => {
      // Set up history with two states
      const line1 = new Line()
      line1.setFirstPoint(0, 0)
      line1.setSecondPoint(10, 10)
      
      const line2 = new Line()
      line2.setFirstPoint(20, 20)
      line2.setSecondPoint(30, 30)
      
      const state1: HistoryState = { lines: [line1], arcs: [] }
      const state2: HistoryState = { lines: [line1, line2], arcs: [] }
      
      history.pushHistory(state1)
      history.pushHistory(state2)
      
      // Try undoing more times than history length
      for (let i = 0; i < 5; i++) {
        const result = history.undo()
      }
      
      // Should still be able to redo
      expect(history.canRedo()).toBe(true)
      
      const redoResult1 = history.redo()
      expect(redoResult1).toEqual(state1)
      
      const redoResult2 = history.redo()
      expect(redoResult2).toEqual(state2)
    })

    it('should properly stop at empty state and not allow further undo', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state1: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state1)
      
      // Initial state: can undo, cannot redo
      expect(history.getHistoryIndex()).toBe(0)
      expect(history.canUndo()).toBe(true)
      expect(history.canRedo()).toBe(false)
      
      // First undo: go to empty state
      const undo1 = history.undo()
      expect(undo1).toEqual({ lines: [], arcs: [] })
      expect(history.getHistoryIndex()).toBe(-1)
      expect(history.canUndo()).toBe(false) // Cannot undo from empty state
      expect(history.canRedo()).toBe(true)
      
      // Try to undo from empty state - should do nothing
      const undo2 = history.undo()
      expect(undo2).toBeNull() // Should return null
      expect(history.getHistoryIndex()).toBe(-1) // Should stay at -1
      expect(history.canUndo()).toBe(false) // Still cannot undo
      expect(history.canRedo()).toBe(true) // Redo should still be available
      
      // Multiple attempts should all fail
      for (let i = 0; i < 3; i++) {
        const result = history.undo()
        expect(result).toBeNull()
        expect(history.getHistoryIndex()).toBe(-1)
        expect(history.canUndo()).toBe(false)
        expect(history.canRedo()).toBe(true)
      }
      
      // Redo should still work after any number of failed undo attempts
      const redo1 = history.redo()
      expect(redo1).toEqual(state1)
      expect(history.getHistoryIndex()).toBe(0)
      expect(history.canUndo()).toBe(true)
      expect(history.canRedo()).toBe(false)
    })

    it('should maintain proper state when alternating excessive undo and redo', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state1: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state1)
      
      // Initial state: historyIndex = 0, history = [state1]
      expect(history.getHistoryIndex()).toBe(0)
      expect(history.canUndo()).toBe(true)
      expect(history.canRedo()).toBe(false)
      
      // First undo: should go to empty state (historyIndex = -1)
      const undo1 = history.undo()
      expect(undo1).toEqual({ lines: [], arcs: [] })
      expect(history.getHistoryIndex()).toBe(-1)
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(true)
      
      // Excessive undo: should return null and maintain historyIndex = -1
      const undo2 = history.undo()
      expect(undo2).toBeNull()
      expect(history.getHistoryIndex()).toBe(-1)
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(true)
      
      // More excessive undo: should still maintain state
      const undo3 = history.undo()
      expect(undo3).toBeNull()
      expect(history.getHistoryIndex()).toBe(-1)
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(true) // This is the critical test
      
      // Redo should work: historyIndex should go from -1 to 0
      const redo1 = history.redo()
      expect(redo1).toEqual(state1)
      expect(history.getHistoryIndex()).toBe(0)
      expect(history.canUndo()).toBe(true)
      expect(history.canRedo()).toBe(false)
      
      // Try excessive redo
      const redo2 = history.redo()
      expect(redo2).toBeNull()
      expect(history.getHistoryIndex()).toBe(0) // Should remain at 0
      expect(history.canUndo()).toBe(true)
      expect(history.canRedo()).toBe(false)
    })
  })
})