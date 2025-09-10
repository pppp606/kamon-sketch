/**
 * @jest-environment jsdom
 */

import { KeyboardShortcuts } from '../src/keyboardShortcuts'
import { History, HistoryState } from '../src/history'
import { Line } from '../src/line'

// Mock P5Instance for tests
interface MockP5Instance {
  keyCode: number
  keyIsDown: jest.Mock
  CONTROL: number
  COMMAND: number
}

describe('KeyboardShortcuts', () => {
  let keyboardShortcuts: KeyboardShortcuts
  let history: History
  let mockP5: MockP5Instance
  let onUndo: jest.Mock
  let onRedo: jest.Mock

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    
    history = new History()
    onUndo = jest.fn()
    onRedo = jest.fn()
    
    mockP5 = {
      keyCode: 0,
      keyIsDown: jest.fn(),
      CONTROL: 17, // Standard control key code
      COMMAND: 91  // Standard command key code (Mac)
    }
    
    keyboardShortcuts = new KeyboardShortcuts(history, onUndo, onRedo)
  })

  describe('initialization', () => {
    it('should create KeyboardShortcuts instance', () => {
      expect(keyboardShortcuts).toBeInstanceOf(KeyboardShortcuts)
    })
  })

  describe('Ctrl+Z (Undo)', () => {
    it('should trigger undo callback when Ctrl+Z is pressed', () => {
      // Set up history with some states
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      
      // Mock Ctrl key being held down
      mockP5.keyIsDown.mockImplementation((key: number) => key === mockP5.CONTROL)
      mockP5.keyCode = 90 // 'Z' key
      
      keyboardShortcuts.handleKeyPressed(mockP5 as any)
      
      expect(onUndo).toHaveBeenCalledTimes(1)
      expect(onRedo).toHaveBeenCalledTimes(0)
    })

    it('should trigger undo callback when Cmd+Z is pressed (Mac)', () => {
      // Set up history with some states
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      
      // Mock Cmd key being held down (Mac)
      mockP5.keyIsDown.mockImplementation((key: number) => key === mockP5.COMMAND)
      mockP5.keyCode = 90 // 'Z' key
      
      keyboardShortcuts.handleKeyPressed(mockP5 as any)
      
      expect(onUndo).toHaveBeenCalledTimes(1)
      expect(onRedo).toHaveBeenCalledTimes(0)
    })

    it('should not trigger undo when Z is pressed without modifier keys', () => {
      mockP5.keyIsDown.mockReturnValue(false)
      mockP5.keyCode = 90 // 'Z' key
      
      keyboardShortcuts.handleKeyPressed(mockP5 as any)
      
      expect(onUndo).toHaveBeenCalledTimes(0)
      expect(onRedo).toHaveBeenCalledTimes(0)
    })

    it('should not trigger undo when history is empty', () => {
      // Empty history
      expect(history.canUndo()).toBe(false)
      
      mockP5.keyIsDown.mockImplementation((key: number) => key === mockP5.CONTROL)
      mockP5.keyCode = 90 // 'Z' key
      
      keyboardShortcuts.handleKeyPressed(mockP5 as any)
      
      expect(onUndo).toHaveBeenCalledTimes(0)
    })
  })

  describe('Ctrl+Y (Redo)', () => {
    it('should trigger redo callback when Ctrl+Y is pressed', () => {
      // Set up history and undo to create redo opportunity
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      history.undo() // Create redo opportunity
      
      expect(history.canRedo()).toBe(true)
      
      // Mock Ctrl key being held down
      mockP5.keyIsDown.mockImplementation((key: number) => key === mockP5.CONTROL)
      mockP5.keyCode = 89 // 'Y' key
      
      keyboardShortcuts.handleKeyPressed(mockP5 as any)
      
      expect(onRedo).toHaveBeenCalledTimes(1)
      expect(onUndo).toHaveBeenCalledTimes(0)
    })

    it('should trigger redo callback when Cmd+Y is pressed (Mac)', () => {
      // Set up history and undo to create redo opportunity
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      history.undo() // Create redo opportunity
      
      expect(history.canRedo()).toBe(true)
      
      // Mock Cmd key being held down (Mac)
      mockP5.keyIsDown.mockImplementation((key: number) => key === mockP5.COMMAND)
      mockP5.keyCode = 89 // 'Y' key
      
      keyboardShortcuts.handleKeyPressed(mockP5 as any)
      
      expect(onRedo).toHaveBeenCalledTimes(1)
      expect(onUndo).toHaveBeenCalledTimes(0)
    })

    it('should not trigger redo when Y is pressed without modifier keys', () => {
      mockP5.keyIsDown.mockReturnValue(false)
      mockP5.keyCode = 89 // 'Y' key
      
      keyboardShortcuts.handleKeyPressed(mockP5 as any)
      
      expect(onUndo).toHaveBeenCalledTimes(0)
      expect(onRedo).toHaveBeenCalledTimes(0)
    })

    it('should not trigger redo when there is nothing to redo', () => {
      // No redo available
      expect(history.canRedo()).toBe(false)
      
      mockP5.keyIsDown.mockImplementation((key: number) => key === mockP5.CONTROL)
      mockP5.keyCode = 89 // 'Y' key
      
      keyboardShortcuts.handleKeyPressed(mockP5 as any)
      
      expect(onRedo).toHaveBeenCalledTimes(0)
    })
  })

  describe('Ctrl+Shift+Z (Alternative Redo)', () => {
    it('should trigger redo callback when Ctrl+Shift+Z is pressed', () => {
      // Set up history and undo to create redo opportunity
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(10, 10)
      
      const state: HistoryState = { lines: [line], arcs: [] }
      history.pushHistory(state)
      history.undo() // Create redo opportunity
      
      expect(history.canRedo()).toBe(true)
      
      // Mock Ctrl+Shift keys being held down
      mockP5.keyIsDown.mockImplementation((key: number) => 
        key === mockP5.CONTROL || key === 16) // 16 is SHIFT
      mockP5.keyCode = 90 // 'Z' key
      
      keyboardShortcuts.handleKeyPressed(mockP5 as any)
      
      expect(onRedo).toHaveBeenCalledTimes(1)
      expect(onUndo).toHaveBeenCalledTimes(0)
    })
  })

  describe('edge cases', () => {
    it('should handle invalid key codes gracefully', () => {
      mockP5.keyIsDown.mockImplementation((key: number) => key === mockP5.CONTROL)
      mockP5.keyCode = 999 // Invalid key code
      
      expect(() => {
        keyboardShortcuts.handleKeyPressed(mockP5 as any)
      }).not.toThrow()
      
      expect(onUndo).toHaveBeenCalledTimes(0)
      expect(onRedo).toHaveBeenCalledTimes(0)
    })
  })
})