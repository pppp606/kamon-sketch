import { CompassController } from '../src/compassController'

interface P5Instance {
  push: jest.Mock;
  pop: jest.Mock;
  noFill: jest.Mock;
  stroke: jest.Mock;
  strokeWeight: jest.Mock;
  point: jest.Mock;
  line: jest.Mock;
  circle: jest.Mock;
  arc: jest.Mock;
}

interface MockMouseEvent {
  shiftKey: boolean;
}

describe('CompassController', () => {
  let compassController: CompassController
  let mockP5: P5Instance
  let mockLocalStorage: Record<string, string>

  beforeEach(() => {
    // Mock p5.js drawing context
    mockP5 = {
      push: jest.fn(),
      pop: jest.fn(),
      noFill: jest.fn(),
      stroke: jest.fn(),
      strokeWeight: jest.fn(),
      point: jest.fn(),
      line: jest.fn(),
      circle: jest.fn(),
      arc: jest.fn(),
    }

    // Mock localStorage
    mockLocalStorage = {}
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => mockLocalStorage[key] || null,
        setItem: (key: string, value: string) => { mockLocalStorage[key] = value },
        removeItem: (key: string) => { delete mockLocalStorage[key] },
        clear: () => { mockLocalStorage = {} },
        key: (index: number) => Object.keys(mockLocalStorage)[index] || null,
        length: Object.keys(mockLocalStorage).length
      },
      writable: true,
      configurable: true
    })

    compassController = new CompassController()
  })

  describe('initialization', () => {
    it('should initialize with default radius of 10px', () => {
      expect(compassController.getCurrentRadius()).toBe(10)
    })

    it('should load radius from localStorage if available', () => {
      mockLocalStorage['compass.radius'] = '25.5'
      compassController = new CompassController()
      expect(compassController.getCurrentRadius()).toBe(25.5)
    })

    it('should use default radius if localStorage value is invalid', () => {
      mockLocalStorage['compass.radius'] = 'invalid'
      compassController = new CompassController()
      expect(compassController.getCurrentRadius()).toBe(10)
    })

    it('should initialize in IDLE state', () => {
      expect(compassController.getState()).toBe('IDLE')
    })
  })

  describe('normal click behavior (no Shift)', () => {
    beforeEach(() => {
      compassController.setCurrentRadius(50) // Set a specific radius for testing
    })

    it('should set center on first click and preserve radius', () => {
      const originalRadius = compassController.getCurrentRadius()
      const mockEvent = { shiftKey: false } as MockMouseEvent
      
      compassController.handleClick(100, 200, mockEvent)
      
      expect(compassController.getState()).toBe('CENTER_SET')
      expect(compassController.getCurrentRadius()).toBe(originalRadius)
      expect(compassController.getCenterPoint()).toEqual({ x: 100, y: 200 })
    })

    it('should complete drawing on second click and preserve radius', () => {
      const originalRadius = compassController.getCurrentRadius()
      const mockEvent = { shiftKey: false } as MockMouseEvent
      
      // First click: set center
      compassController.handleClick(100, 200, mockEvent)
      // Second click: start drawing
      compassController.handleClick(150, 200, mockEvent)
      
      expect(compassController.getState()).toBe('DRAWING')
      expect(compassController.getCurrentRadius()).toBe(originalRadius)
    })

    it('should preserve radius across multiple drawings', () => {
      const mockEvent = { shiftKey: false } as MockMouseEvent
      
      // First drawing
      compassController.handleClick(100, 100, mockEvent) // center
      compassController.handleClick(150, 100, mockEvent) // radius
      compassController.handleClick(150, 150, mockEvent) // drawing
      
      const radiusAfterFirstDrawing = compassController.getCurrentRadius()
      
      // Reset and start new drawing
      compassController.reset()
      compassController.handleClick(200, 200, mockEvent) // new center
      
      expect(compassController.getCurrentRadius()).toBe(radiusAfterFirstDrawing)
    })

    it('should save radius to localStorage when changed', () => {
      compassController.setCurrentRadius(75.5)
      expect(mockLocalStorage['compass.radius']).toBe('75.5')
    })
  })

  describe('Shift+click radius change behavior', () => {
    beforeEach(() => {
      compassController.setCurrentRadius(30)
    })

    it('should start radius setting mode on Shift+click', () => {
      const mockEvent = { shiftKey: true } as MockMouseEvent
      
      compassController.handleClick(100, 200, mockEvent)
      
      expect(compassController.getState()).toBe('SETTING_RADIUS')
      expect(compassController.getCompassCenter()).toEqual({ x: 100, y: 200 })
      expect(compassController.getLastRadius()).toBe(30) // backup original
    })

    it('should update radius during Shift+drag', () => {
      const mockEvent = { shiftKey: true } as MockMouseEvent
      
      // Start Shift operation
      compassController.handleClick(100, 100, mockEvent)
      
      // Drag to set new radius
      compassController.handleMouseDrag(100, 150) // 50px away
      
      expect(compassController.getCurrentRadius()).toBe(50)
      expect(compassController.getState()).toBe('SETTING_RADIUS')
    })

    it('should finalize radius on mouse release', () => {
      const mockEvent = { shiftKey: true } as MockMouseEvent
      
      // Start Shift operation and drag
      compassController.handleClick(100, 100, mockEvent)
      compassController.handleMouseDrag(100, 160) // 60px away
      compassController.handleMouseRelease(100, 160)
      
      expect(compassController.getCurrentRadius()).toBe(60)
      expect(compassController.getState()).toBe('IDLE')
      expect(compassController.getCompassCenter()).toBeNull()
      expect(mockLocalStorage['compass.radius']).toBe('60')
    })

    it('should clamp radius to valid range during Shift operation', () => {
      const mockEvent = { shiftKey: true } as MockMouseEvent
      
      compassController.handleClick(100, 100, mockEvent)
      // Drag very close (should clamp to minimum)
      compassController.handleMouseDrag(100.2, 100) // 0.2px away
      
      expect(compassController.getCurrentRadius()).toBe(1) // clamped to minimum
      
      // Drag very far (should clamp to maximum)  
      compassController.handleMouseDrag(100 + 15000, 100) // 15000px away
      expect(compassController.getCurrentRadius()).toBe(10000) // clamped to maximum
    })

    it('should handle geometry correctly with different center positions', () => {
      const mockEvent = { shiftKey: true } as MockMouseEvent
      
      // Test with center at negative coordinates
      compassController.handleClick(-50, -50, mockEvent)
      compassController.handleMouseDrag(-53, -54) // distance = 5
      
      expect(compassController.getCurrentRadius()).toBe(5)
    })
  })

  describe('cancel operations', () => {
    it('should cancel Shift operation on Esc key', () => {
      const originalRadius = 40
      compassController.setCurrentRadius(originalRadius)
      
      const mockEvent = { shiftKey: true } as MockMouseEvent
      compassController.handleClick(100, 100, mockEvent)
      compassController.handleMouseDrag(100, 180) // set to 80
      
      compassController.handleKeyPress('Escape')
      
      expect(compassController.getCurrentRadius()).toBe(originalRadius) // restored
      expect(compassController.getState()).toBe('IDLE')
      expect(compassController.getCompassCenter()).toBeNull()
    })

    it('should cancel Shift operation on right click', () => {
      const originalRadius = 40
      compassController.setCurrentRadius(originalRadius)
      
      const mockEvent = { shiftKey: true } as MockMouseEvent
      compassController.handleClick(100, 100, mockEvent)
      compassController.handleMouseDrag(100, 180) // set to 80
      
      compassController.handleRightClick()
      
      expect(compassController.getCurrentRadius()).toBe(originalRadius) // restored
      expect(compassController.getState()).toBe('IDLE')
    })

    it('should cancel normal drawing operation on Esc key', () => {
      const mockEvent = { shiftKey: false } as MockMouseEvent
      
      compassController.handleClick(100, 100, mockEvent) // center
      compassController.handleClick(150, 100, mockEvent) // radius  
      
      expect(compassController.getState()).toBe('DRAWING')
      
      compassController.handleKeyPress('Escape')
      
      expect(compassController.getState()).toBe('IDLE')
      expect(compassController.getCenterPoint()).toBeNull()
    })
  })

  describe('drawing preview and rendering', () => {
    it('should draw radius preview during Shift operation', () => {
      const mockEvent = { shiftKey: true } as MockMouseEvent
      
      compassController.handleClick(100, 100, mockEvent)
      compassController.handleMouseDrag(100, 150) // 50px radius
      compassController.draw(mockP5 as any)
      
      // Should draw center point, radius line, and preview circle
      expect(mockP5.point).toHaveBeenCalledWith(100, 100)
      expect(mockP5.line).toHaveBeenCalledWith(100, 100, 100, 150)
      expect(mockP5.circle).toHaveBeenCalledWith(100, 100, 100) // diameter = 2 * radius
    })

    it('should use current radius for normal drawing operations', () => {
      compassController.setCurrentRadius(75)
      const mockEvent = { shiftKey: false } as MockMouseEvent
      
      // Set up normal drawing
      compassController.handleClick(100, 100, mockEvent) // center
      compassController.handleClick(175, 100, mockEvent) // radius point (75px away)
      compassController.handleMouseDrag(100, 175) // drawing position
      compassController.draw(mockP5 as any)
      
      // Should draw arc with the current radius
      expect(mockP5.arc).toHaveBeenCalled()
    })

    it('should maintain consistent drawing style', () => {
      compassController.setCurrentRadius(25)
      const mockEvent = { shiftKey: false } as MockMouseEvent
      
      compassController.handleClick(50, 50, mockEvent)
      compassController.draw(mockP5 as any)
      
      // Should maintain proper drawing setup
      expect(mockP5.push).toHaveBeenCalled()
      expect(mockP5.noFill).toHaveBeenCalled()
      expect(mockP5.stroke).toHaveBeenCalledWith(0, 0, 0)
      expect(mockP5.strokeWeight).toHaveBeenCalledWith(2)
      expect(mockP5.pop).toHaveBeenCalled()
    })
  })

  describe('state management integration', () => {
    it('should maintain proper state transitions', () => {
      const mockEvent = { shiftKey: false } as MockMouseEvent
      
      // Normal flow: IDLE -> CENTER_SET -> DRAWING -> IDLE
      expect(compassController.getState()).toBe('IDLE')
      
      compassController.handleClick(100, 100, mockEvent)
      expect(compassController.getState()).toBe('CENTER_SET')
      
      compassController.handleClick(150, 100, mockEvent)
      expect(compassController.getState()).toBe('DRAWING')
      
      compassController.reset()
      expect(compassController.getState()).toBe('IDLE')
    })

    it('should handle Shift state transitions', () => {
      const mockEvent = { shiftKey: true } as MockMouseEvent
      
      // Shift flow: IDLE -> SETTING_RADIUS -> IDLE
      expect(compassController.getState()).toBe('IDLE')
      
      compassController.handleClick(100, 100, mockEvent)
      expect(compassController.getState()).toBe('SETTING_RADIUS')
      
      compassController.handleMouseRelease(100, 150)
      expect(compassController.getState()).toBe('IDLE')
    })
  })
})