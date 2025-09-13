import { History, HistoryState } from '../src/history'
import { Line } from '../src/line'
import { CompassArc } from '../src/compassArc'

describe('History', () => {
  let history: History
  
  beforeEach(() => {
    // Mock localStorage before creating History instance
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true,
      configurable: true
    })
    
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

  describe('localStorage methods', () => {
    // Create a mock localStorage for testing
    let localStorageMock: { [key: string]: string }
    
    beforeEach(() => {
      localStorageMock = {}
      
      // Mock localStorage
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn((key: string) => localStorageMock[key] || null),
          setItem: jest.fn((key: string, value: string) => {
            localStorageMock[key] = value
          }),
          removeItem: jest.fn((key: string) => {
            delete localStorageMock[key]
          })
        },
        writable: true,
        configurable: true
      })
      
      // Create fresh history instance with clean localStorage mock
      history = new History()
    })

    afterEach(() => {
      // Clear mocks
      jest.clearAllMocks()
    })

    describe('saveToStorage', () => {
      it('should save history to localStorage when available', () => {
        const line = new Line()
        line.setFirstPoint(0, 0)
        line.setSecondPoint(10, 10)
        
        const state: HistoryState = { lines: [line], arcs: [] }
        history.pushHistory(state)
        
        // Access private method via any cast for testing
        ;(history as any).saveToStorage()
        
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'drawing-history',
          expect.stringContaining('"history"')
        )
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'drawing-history', 
          expect.stringContaining('"historyIndex"')
        )
      })

      it('should handle localStorage setItem errors gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
        
        // Mock localStorage.setItem to throw error
        ;(localStorage.setItem as jest.Mock).mockImplementation(() => {
          throw new Error('Storage quota exceeded')
        })
        
        const state: HistoryState = { lines: [], arcs: [] }
        history.pushHistory(state)
        
        expect(() => (history as any).saveToStorage()).not.toThrow()
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to save history to localStorage:', 
          expect.any(Error)
        )
        
        consoleSpy.mockRestore()
      })

      it('should skip saving when localStorage is undefined', () => {
        // Mock undefined localStorage
        Object.defineProperty(global, 'localStorage', {
          value: undefined,
          writable: true
        })
        
        const state: HistoryState = { lines: [], arcs: [] }
        history.pushHistory(state)
        
        expect(() => (history as any).saveToStorage()).not.toThrow()
      })
    })

    describe('loadFromStorage', () => {
      it('should load history from localStorage when available', () => {
        const line = new Line()
        line.setFirstPoint(5, 5)
        line.setSecondPoint(15, 15)
        
        const arc = new CompassArc()
        arc.setCenter(10, 10)
        arc.setRadiusDistance(5)
        
        const mockData = {
          history: [
            { 
              lines: [line.toJSON()],
              arcs: [arc.toJSON()]
            }
          ],
          historyIndex: 0
        }
        
        // Override the localStorage mock for this test
        ;(localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockData))
        
        // Create new history instance to test loading
        const newHistory = new History()
        ;(newHistory as any).loadFromStorage()
        
        expect(newHistory.getHistoryLength()).toBe(1)
        expect(newHistory.getHistoryIndex()).toBe(0)
        expect(newHistory.canUndo()).toBe(true)
        expect(newHistory.canRedo()).toBe(false)
      })

      it('should handle missing localStorage data', () => {
        localStorageMock = {} // Empty storage
        
        const newHistory = new History()
        ;(newHistory as any).loadFromStorage()
        
        expect(newHistory.getHistoryLength()).toBe(0)
        expect(newHistory.getHistoryIndex()).toBe(-1)
      })

      it('should handle corrupted localStorage data', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
        
        // Override localStorage mock to return invalid JSON
        ;(localStorage.getItem as jest.Mock).mockReturnValue('invalid json')
        
        const newHistory = new History()
        ;(newHistory as any).loadFromStorage()
        
        expect(newHistory.getHistoryLength()).toBe(0)
        expect(newHistory.getHistoryIndex()).toBe(-1)
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load history from localStorage:',
          expect.any(Error)
        )
        
        consoleSpy.mockRestore()
      })

      it('should skip loading when localStorage is undefined', () => {
        Object.defineProperty(global, 'localStorage', {
          value: undefined,
          writable: true
        })
        
        const newHistory = new History()
        expect(() => (newHistory as any).loadFromStorage()).not.toThrow()
        expect(newHistory.getHistoryLength()).toBe(0)
      })
    })

    describe('removeFromStorage', () => {
      it('should remove history from localStorage when available', () => {
        localStorageMock['drawing-history'] = 'some data'
        
        ;(history as any).removeFromStorage()
        
        expect(localStorage.removeItem).toHaveBeenCalledWith('drawing-history')
        expect(localStorageMock['drawing-history']).toBeUndefined()
      })

      it('should handle localStorage removeItem errors gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
        
        ;(localStorage.removeItem as jest.Mock).mockImplementation(() => {
          throw new Error('Storage access denied')
        })
        
        expect(() => (history as any).removeFromStorage()).not.toThrow()
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to remove history from localStorage:',
          expect.any(Error)
        )
        
        consoleSpy.mockRestore()
      })

      it('should skip removal when localStorage is undefined', () => {
        Object.defineProperty(global, 'localStorage', {
          value: undefined,
          writable: true
        })
        
        expect(() => (history as any).removeFromStorage()).not.toThrow()
      })
    })
  })

})