import { History, HistoryState } from '../src/history'
import { Line } from '../src/line'
import { CompassArc } from '../src/compassArc'

describe('History', () => {
  let history: History
  
  beforeEach(() => {
    history = new History()
  })

  describe('initialization', () => {
    it('should create a History instance', () => {
      expect(history).toBeInstanceOf(History)
    })

    it('should initialize with empty history', () => {
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(false)
    })

    it('should have historyIndex starting at -1', () => {
      expect(history.getHistoryIndex()).toBe(-1)
    })

    it('should have empty history array', () => {
      expect(history.getHistoryLength()).toBe(0)
    })
  })

  describe('pushHistory', () => {
    it('should add new state to history', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = {
        lines: [line],
        arcs: []
      }
      
      history.pushHistory(state)
      
      expect(history.getHistoryLength()).toBe(1)
      expect(history.getHistoryIndex()).toBe(0)
      expect(history.canUndo()).toBe(true)
      expect(history.canRedo()).toBe(false)
    })

    it('should clear redo stack when pushing new state', () => {
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
      
      // Undo to create redo stack
      history.undo()
      expect(history.canRedo()).toBe(true)
      
      // Push new state should clear redo stack
      const line3 = new Line()
      line3.setFirstPoint(40, 40)
      line3.setSecondPoint(50, 50)
      const state3: HistoryState = { lines: [line1, line3], arcs: [] }
      
      history.pushHistory(state3)
      expect(history.canRedo()).toBe(false)
    })
  })

  describe('undo', () => {
    it('should return null when history is empty', () => {
      expect(history.undo()).toBeNull()
    })

    it('should return previous state when undoing', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state1: HistoryState = { lines: [], arcs: [] }
      const state2: HistoryState = { lines: [line], arcs: [] }
      
      history.pushHistory(state1)
      history.pushHistory(state2)
      
      const undoResult = history.undo()
      expect(undoResult).toEqual(state1)
      expect(history.getHistoryIndex()).toBe(0)
      expect(history.canUndo()).toBe(true)
      expect(history.canRedo()).toBe(true)
    })

    it('should return null when already at oldest state', () => {
      const state: HistoryState = { lines: [], arcs: [] }
      history.pushHistory(state)
      
      // First undo should work
      expect(history.undo()).not.toBeNull()
      
      // Second undo should return null
      expect(history.undo()).toBeNull()
    })
  })

  describe('redo', () => {
    it('should return null when there is nothing to redo', () => {
      expect(history.redo()).toBeNull()
    })

    it('should return next state when redoing', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state1: HistoryState = { lines: [], arcs: [] }
      const state2: HistoryState = { lines: [line], arcs: [] }
      
      history.pushHistory(state1)
      history.pushHistory(state2)
      
      // Undo first
      history.undo()
      
      // Then redo
      const redoResult = history.redo()
      expect(redoResult).toEqual(state2)
      expect(history.getHistoryIndex()).toBe(1)
      expect(history.canUndo()).toBe(true)
      expect(history.canRedo()).toBe(false)
    })

    it('should return null when already at newest state', () => {
      const state: HistoryState = { lines: [], arcs: [] }
      history.pushHistory(state)
      
      expect(history.redo()).toBeNull()
    })
  })

  describe('getCurrentState', () => {
    it('should return null when history is empty', () => {
      expect(history.getCurrentState()).toBeNull()
    })

    it('should return current state', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      
      expect(history.getCurrentState()).toEqual(state)
    })
  })

  describe('clearHistory', () => {
    it('should clear all history and reset to initial state', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      
      expect(history.getHistoryLength()).toBe(1)
      expect(history.canUndo()).toBe(true)
      
      history.clearHistory()
      
      expect(history.getHistoryLength()).toBe(0)
      expect(history.getHistoryIndex()).toBe(-1)
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(false)
    })
  })

  describe('deep copy behavior', () => {
    it('should create deep copies to prevent history pollution', () => {
      const originalLine = new Line()
      originalLine.setFirstPoint(0, 0)
      originalLine.setSecondPoint(10, 10)
      
      const originalState: HistoryState = {
        lines: [originalLine],
        arcs: []
      }
      
      history.pushHistory(originalState)
      
      // Modify the original line after pushing to history
      originalLine.setSecondPoint(20, 20)
      
      // The history should not be affected by changes to the original objects
      const storedState = history.getCurrentState()
      expect(storedState).not.toBeNull()
      expect(storedState!.lines[0].getSecondPoint()).toEqual({ x: 10, y: 10 })
      expect(storedState!.lines[0]).not.toBe(originalLine) // Different instance
    })

    it('should create deep copies of arcs', () => {
      const originalArc = new CompassArc()
      originalArc.setCenter(5, 5)
      originalArc.setRadiusDistance(10)
      
      const originalState: HistoryState = {
        lines: [],
        arcs: [originalArc]
      }
      
      history.pushHistory(originalState)
      
      // Modify the original arc after pushing to history
      originalArc.setCenter(15, 15)
      
      // The history should not be affected
      const storedState = history.getCurrentState()
      expect(storedState).not.toBeNull()
      expect(storedState!.arcs[0].getCenterPoint()).toEqual({ x: 5, y: 5 })
      expect(storedState!.arcs[0]).not.toBe(originalArc) // Different instance
    })
  })
})