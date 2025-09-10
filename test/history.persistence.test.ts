import { History, HistoryState } from '../src/history'
import { Line } from '../src/line'
import { CompassArc } from '../src/compassArc'

describe('History localStorage persistence', () => {
  let history: History

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    history = new History()
  })

  describe('save/load functionality', () => {
    it('should save history to localStorage when pushing new state', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      
      // Check that something was saved to localStorage
      const savedData = localStorage.getItem('drawing-history')
      expect(savedData).not.toBeNull()
      
      // Verify the saved data structure
      const parsedData = JSON.parse(savedData!)
      expect(parsedData).toHaveProperty('history')
      expect(parsedData).toHaveProperty('historyIndex')
      expect(parsedData.historyIndex).toBe(0)
    })

    it('should load history from localStorage on initialization', () => {
      // Manually set up localStorage data
      const line = new Line()
      line.setFirstPoint(5, 5)
      line.setSecondPoint(15, 15)
      
      const savedState: HistoryState = { lines: [line], arcs: [] }
      const savedData = JSON.stringify({
        history: [savedState],
        historyIndex: 0
      })
      
      localStorage.setItem('drawing-history', savedData)
      
      // Create new History instance - should load from localStorage
      const newHistory = new History()
      expect(newHistory.getHistoryLength()).toBe(1)
      expect(newHistory.getHistoryIndex()).toBe(0)
      expect(newHistory.canUndo()).toBe(true)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('drawing-history', 'invalid-json')
      
      const newHistory = new History()
      expect(newHistory.getHistoryLength()).toBe(0)
      expect(newHistory.getHistoryIndex()).toBe(-1)
    })

    it('should clear localStorage when clearing history', () => {
      // First add some data
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      
      // Verify data exists
      expect(localStorage.getItem('drawing-history')).not.toBeNull()
      
      // Clear history
      history.clearHistory()
      
      // Verify localStorage was cleared
      expect(localStorage.getItem('drawing-history')).toBeNull()
    })

    it('should preserve history across browser sessions', () => {
      // Simulate first session
      const line1 = new Line()
      line1.setFirstPoint(0, 0)
      line1.setSecondPoint(10, 10)
      
      const line2 = new Line()  
      line2.setFirstPoint(20, 20)
      line2.setSecondPoint(30, 30)
      
      history.pushHistory({ lines: [line1], arcs: [] })
      history.pushHistory({ lines: [line1, line2], arcs: [] })
      
      // Simulate second session (new History instance)
      const newHistory = new History()
      expect(newHistory.getHistoryLength()).toBe(2)
      expect(newHistory.getHistoryIndex()).toBe(1)
      
      // Should be able to undo
      const undoResult = newHistory.undo()
      expect(undoResult).not.toBeNull()
      expect(undoResult!.lines).toHaveLength(1)
    })
  })
})