import { CompassRadiusState } from '../src/compassRadiusState'
import { Line } from '../src/line'
import { CompassArc } from '../src/compassArc'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    // Add a method to reset the store from outside
    __resetStore: () => {
      store = {}
    }
  }
})()

// Mock world coordinate functions
const mockWorldCoordinates = {
  pixelsToWorld: jest.fn((pixelDistance: number) => pixelDistance * 0.1), // 10 pixels = 1 world unit
  worldToPixels: jest.fn((worldDistance: number) => worldDistance * 10),
}

// Set up global mocks
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('CompassRadiusState', () => {
  let compassRadiusState: CompassRadiusState

  beforeEach(() => {
    // Clear the actual store using the reset method
    localStorageMock.__resetStore()
    // Clear the mock call history
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.clear.mockClear()
    localStorageMock.removeItem.mockClear()
    mockWorldCoordinates.pixelsToWorld.mockClear()
    mockWorldCoordinates.worldToPixels.mockClear()
    
    // Ensure mock returns null for any key initially
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    // Ensure localStorage is completely cleared after each test
    localStorageMock.__resetStore()
  })

  describe('initialization', () => {
    it('should create a CompassRadiusState instance', () => {
      compassRadiusState = new CompassRadiusState()
      expect(compassRadiusState).toBeInstanceOf(CompassRadiusState)
    })

    it('should initialize with default radius of 50px', () => {
      compassRadiusState = new CompassRadiusState()
      expect(compassRadiusState.getCurrentRadius()).toBe(50)
    })

    it('should initialize with lastRadius equal to currentRadius', () => {
      compassRadiusState = new CompassRadiusState()
      expect(compassRadiusState.getLastRadius()).toBe(50)
    })

    it('should initialize with default radius in world coordinates', () => {
      compassRadiusState = new CompassRadiusState(mockWorldCoordinates)
      expect(compassRadiusState.getCurrentRadiusWorld()).toBe(5) // 50px * 0.1
    })

    it('should allow custom default radius during initialization', () => {
      compassRadiusState = new CompassRadiusState(undefined, 100)
      expect(compassRadiusState.getCurrentRadius()).toBe(100)
      expect(compassRadiusState.getLastRadius()).toBe(100)
    })

    it('should clamp custom default radius to valid range', () => {
      // Test below minimum
      compassRadiusState = new CompassRadiusState(undefined, 0)
      expect(compassRadiusState.getCurrentRadius()).toBe(1)

      // Test above maximum
      compassRadiusState = new CompassRadiusState(undefined, 15000)
      expect(compassRadiusState.getCurrentRadius()).toBe(10000)
    })
  })

  describe('radius clamping', () => {

    it('should clamp radius to minimum 1px', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(0)
      expect(compassRadiusState.getCurrentRadius()).toBe(1)

      compassRadiusState.updateRadius(-10)
      expect(compassRadiusState.getCurrentRadius()).toBe(1)

      compassRadiusState.updateRadius(0.5)
      expect(compassRadiusState.getCurrentRadius()).toBe(1)
    })

    it('should clamp radius to maximum 10000px', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(10001)
      expect(compassRadiusState.getCurrentRadius()).toBe(10000)

      compassRadiusState.updateRadius(50000)
      expect(compassRadiusState.getCurrentRadius()).toBe(10000)
    })

    it('should allow valid radius values', () => {
      compassRadiusState = new CompassRadiusState()
      const validRadii = [1, 50, 100, 500, 1000, 5000, 10000]
      
      validRadii.forEach(radius => {
        compassRadiusState.updateRadius(radius)
        expect(compassRadiusState.getCurrentRadius()).toBe(radius)
      })
    })

    it('should handle edge cases at boundaries', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(1)
      expect(compassRadiusState.getCurrentRadius()).toBe(1)

      compassRadiusState.updateRadius(10000)
      expect(compassRadiusState.getCurrentRadius()).toBe(10000)
    })

    it('should handle non-integer radius values', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(50.7)
      expect(compassRadiusState.getCurrentRadius()).toBe(50.7)

      compassRadiusState.updateRadius(Math.PI * 10)
      expect(compassRadiusState.getCurrentRadius()).toBeCloseTo(31.416, 3)
    })
  })

  describe('updateRadius method', () => {
    it('should move currentRadius to lastRadius', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(100)
      expect(compassRadiusState.getLastRadius()).toBe(50) // Previous current
      expect(compassRadiusState.getCurrentRadius()).toBe(100) // New current
    })

    it('should handle multiple radius updates', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(75)
      expect(compassRadiusState.getLastRadius()).toBe(50)
      expect(compassRadiusState.getCurrentRadius()).toBe(75)

      compassRadiusState.updateRadius(125)
      expect(compassRadiusState.getLastRadius()).toBe(75)
      expect(compassRadiusState.getCurrentRadius()).toBe(125)

      compassRadiusState.updateRadius(200)
      expect(compassRadiusState.getLastRadius()).toBe(125)
      expect(compassRadiusState.getCurrentRadius()).toBe(200)
    })

    it('should maintain history correctly when setting same radius', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(100)
      compassRadiusState.updateRadius(100) // Same radius
      
      expect(compassRadiusState.getLastRadius()).toBe(100) // Previous current
      expect(compassRadiusState.getCurrentRadius()).toBe(100) // Same current
    })

    it('should clamp new radius and update lastRadius correctly', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(15000) // Will be clamped to 10000
      expect(compassRadiusState.getLastRadius()).toBe(50)
      expect(compassRadiusState.getCurrentRadius()).toBe(10000)

      compassRadiusState.updateRadius(-5) // Will be clamped to 1
      expect(compassRadiusState.getLastRadius()).toBe(10000)
      expect(compassRadiusState.getCurrentRadius()).toBe(1)
    })
  })

  describe('useLastRadius method', () => {
    it('should restore lastRadius to currentRadius', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(100)
      compassRadiusState.updateRadius(200)
      
      expect(compassRadiusState.getCurrentRadius()).toBe(200)
      expect(compassRadiusState.getLastRadius()).toBe(100)

      compassRadiusState.useLastRadius()
      
      expect(compassRadiusState.getCurrentRadius()).toBe(100)
      expect(compassRadiusState.getLastRadius()).toBe(200) // Swapped
    })

    it('should handle multiple useLastRadius calls (toggle behavior)', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(75)
      compassRadiusState.updateRadius(150)
      
      expect(compassRadiusState.getCurrentRadius()).toBe(150)
      expect(compassRadiusState.getLastRadius()).toBe(75)

      compassRadiusState.useLastRadius()
      expect(compassRadiusState.getCurrentRadius()).toBe(75)
      expect(compassRadiusState.getLastRadius()).toBe(150)

      compassRadiusState.useLastRadius() // Toggle back
      expect(compassRadiusState.getCurrentRadius()).toBe(150)
      expect(compassRadiusState.getLastRadius()).toBe(75)
    })

    it('should handle case when lastRadius equals currentRadius', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(100)
      compassRadiusState.updateRadius(100) // Same radius
      
      expect(compassRadiusState.getCurrentRadius()).toBe(100)
      expect(compassRadiusState.getLastRadius()).toBe(100)

      compassRadiusState.useLastRadius()
      
      expect(compassRadiusState.getCurrentRadius()).toBe(100)
      expect(compassRadiusState.getLastRadius()).toBe(100)
    })

    it('should work correctly at initialization', () => {
      compassRadiusState = new CompassRadiusState()
      // At initialization, both current and last are 50
      expect(compassRadiusState.getCurrentRadius()).toBe(50)
      expect(compassRadiusState.getLastRadius()).toBe(50)

      compassRadiusState.useLastRadius()

      expect(compassRadiusState.getCurrentRadius()).toBe(50)
      expect(compassRadiusState.getLastRadius()).toBe(50)
    })
  })

  describe('setRadiusFromShape method', () => {
    describe('with Line shapes', () => {
      it('should set radius to line length', () => {
        compassRadiusState = new CompassRadiusState()
        const line = new Line()
        line.setFirstPoint(0, 0)
        line.setSecondPoint(30, 40) // Length = 50

        compassRadiusState.setRadiusFromShape(line)
        expect(compassRadiusState.getCurrentRadius()).toBe(50)
        expect(compassRadiusState.getLastRadius()).toBe(50) // Previous default
      })

      it('should handle vertical lines', () => {
        compassRadiusState = new CompassRadiusState()
        const line = new Line()
        line.setFirstPoint(100, 0)
        line.setSecondPoint(100, 80) // Length = 80

        compassRadiusState.setRadiusFromShape(line)
        expect(compassRadiusState.getCurrentRadius()).toBe(80)
      })

      it('should handle horizontal lines', () => {
        compassRadiusState = new CompassRadiusState()
        const line = new Line()
        line.setFirstPoint(0, 50)
        line.setSecondPoint(120, 50) // Length = 120

        compassRadiusState.setRadiusFromShape(line)
        expect(compassRadiusState.getCurrentRadius()).toBe(120)
      })

      it('should handle diagonal lines', () => {
        compassRadiusState = new CompassRadiusState()
        const line = new Line()
        line.setFirstPoint(0, 0)
        line.setSecondPoint(60, 80) // Length = 100

        compassRadiusState.setRadiusFromShape(line)
        expect(compassRadiusState.getCurrentRadius()).toBe(100)
      })

      it('should clamp line length to valid radius range', () => {
        compassRadiusState = new CompassRadiusState()
        // Very long line
        const longLine = new Line()
        longLine.setFirstPoint(0, 0)
        longLine.setSecondPoint(15000, 0) // Length = 15000, should clamp to 10000

        compassRadiusState.setRadiusFromShape(longLine)
        expect(compassRadiusState.getCurrentRadius()).toBe(10000)

        // Very short line
        const shortLine = new Line()
        shortLine.setFirstPoint(0, 0)
        shortLine.setSecondPoint(0.5, 0) // Length = 0.5, should clamp to 1

        compassRadiusState.setRadiusFromShape(shortLine)
        expect(compassRadiusState.getCurrentRadius()).toBe(1)
      })

      it('should handle incomplete lines', () => {
        compassRadiusState = new CompassRadiusState()
        const incompleteLine = new Line()
        incompleteLine.setFirstPoint(0, 0)
        // No second point set - length should be 0, clamped to 1

        compassRadiusState.setRadiusFromShape(incompleteLine)
        expect(compassRadiusState.getCurrentRadius()).toBe(1)
      })

      it('should handle zero-length lines', () => {
        compassRadiusState = new CompassRadiusState()
        const zeroLine = new Line()
        zeroLine.setFirstPoint(100, 100)
        zeroLine.setSecondPoint(100, 100) // Same point - length = 0, should clamp to 1

        compassRadiusState.setRadiusFromShape(zeroLine)
        expect(compassRadiusState.getCurrentRadius()).toBe(1)
      })
    })

    describe('with CompassArc shapes', () => {
      it('should set radius to arc radius', () => {
        compassRadiusState = new CompassRadiusState()
        const arc = new CompassArc()
        arc.setCenter(100, 100)
        arc.setRadius(200, 100) // Radius = 100

        compassRadiusState.setRadiusFromShape(arc)
        expect(compassRadiusState.getCurrentRadius()).toBe(100)
        expect(compassRadiusState.getLastRadius()).toBe(50) // Previous default
      })

      it('should handle various arc radii', () => {
        compassRadiusState = new CompassRadiusState()
        const testCases = [
          { center: { x: 0, y: 0 }, radiusPoint: { x: 25, y: 0 }, expectedRadius: 25 },
          { center: { x: 100, y: 100 }, radiusPoint: { x: 100, y: 200 }, expectedRadius: 100 },
          { center: { x: 0, y: 0 }, radiusPoint: { x: 30, y: 40 }, expectedRadius: 50 },
          { center: { x: 50, y: 50 }, radiusPoint: { x: 53, y: 54 }, expectedRadius: 5 }
        ]

        testCases.forEach(({ center, radiusPoint, expectedRadius }) => {
          const arc = new CompassArc()
          arc.setCenter(center.x, center.y)
          arc.setRadius(radiusPoint.x, radiusPoint.y)

          compassRadiusState.setRadiusFromShape(arc)
          expect(compassRadiusState.getCurrentRadius()).toBe(expectedRadius)
        })
      })

      it('should clamp arc radius to valid range', () => {
        compassRadiusState = new CompassRadiusState()
        // Very large arc
        const largeArc = new CompassArc()
        largeArc.setCenter(0, 0)
        largeArc.setRadius(15000, 0) // Radius = 15000, should clamp to 10000

        compassRadiusState.setRadiusFromShape(largeArc)
        expect(compassRadiusState.getCurrentRadius()).toBe(10000)

        // Very small arc
        const smallArc = new CompassArc()
        smallArc.setCenter(100, 100)
        smallArc.setRadius(100.5, 100) // Radius = 0.5, should clamp to 1

        compassRadiusState.setRadiusFromShape(smallArc)
        expect(compassRadiusState.getCurrentRadius()).toBe(1)
      })

      it('should handle incomplete arcs', () => {
        compassRadiusState = new CompassRadiusState()
        const incompleteArc = new CompassArc()
        incompleteArc.setCenter(100, 100)
        // No radius point set - radius should be 0, clamped to 1

        compassRadiusState.setRadiusFromShape(incompleteArc)
        expect(compassRadiusState.getCurrentRadius()).toBe(1)
      })

      it('should handle zero-radius arcs', () => {
        compassRadiusState = new CompassRadiusState()
        const zeroArc = new CompassArc()
        zeroArc.setCenter(100, 100)
        zeroArc.setRadius(100, 100) // Same point - radius = 0, should clamp to 1

        compassRadiusState.setRadiusFromShape(zeroArc)
        expect(compassRadiusState.getCurrentRadius()).toBe(1)
      })
    })

    it('should update lastRadius when setting from shape', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(75) // Set current to 75

      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(60, 80) // Length = 100

      compassRadiusState.setRadiusFromShape(line)
      
      expect(compassRadiusState.getCurrentRadius()).toBe(100)
      expect(compassRadiusState.getLastRadius()).toBe(75) // Previous current
    })
  })

  describe('world coordinate integration', () => {
    it('should provide world coordinate radius', () => {
      compassRadiusState = new CompassRadiusState(mockWorldCoordinates)
      mockWorldCoordinates.pixelsToWorld.mockReturnValue(5) // 50px -> 5 world units

      const worldRadius = compassRadiusState.getCurrentRadiusWorld()
      
      expect(worldRadius).toBe(5)
      expect(mockWorldCoordinates.pixelsToWorld).toHaveBeenCalledWith(50)
    })

    it('should update world radius when pixel radius changes', () => {
      compassRadiusState = new CompassRadiusState(mockWorldCoordinates)
      mockWorldCoordinates.pixelsToWorld.mockReturnValueOnce(10) // 100px -> 10 world units

      compassRadiusState.updateRadius(100)
      const worldRadius = compassRadiusState.getCurrentRadiusWorld()

      expect(worldRadius).toBe(10)
      expect(mockWorldCoordinates.pixelsToWorld).toHaveBeenCalledWith(100)
    })

    it('should provide last world radius', () => {
      compassRadiusState = new CompassRadiusState(mockWorldCoordinates, 50, 'test_world_last')
      // Set up mock to return specific values based on input
      mockWorldCoordinates.pixelsToWorld.mockImplementation((pixels: number) => {
        if (pixels === 50) return 5  // lastRadius: 50px -> 5 world units
        if (pixels === 100) return 10 // currentRadius: 100px -> 10 world units
        return pixels * 0.1 // default conversion
      })

      compassRadiusState.updateRadius(100)
      
      const currentWorldRadius = compassRadiusState.getCurrentRadiusWorld()
      const lastWorldRadius = compassRadiusState.getLastRadiusWorld()

      expect(currentWorldRadius).toBe(10)
      expect(lastWorldRadius).toBe(5)
    })

    it('should calculate world distance correctly for shape setting', () => {
      compassRadiusState = new CompassRadiusState(mockWorldCoordinates)
      mockWorldCoordinates.pixelsToWorld.mockReturnValue(10) // 100px line -> 10 world units

      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(60, 80) // Length = 100

      compassRadiusState.setRadiusFromShape(line)
      const worldRadius = compassRadiusState.getCurrentRadiusWorld()

      expect(worldRadius).toBe(10)
      expect(mockWorldCoordinates.pixelsToWorld).toHaveBeenCalledWith(100)
    })

    it('should handle world coordinate conversion errors gracefully', () => {
      compassRadiusState = new CompassRadiusState(mockWorldCoordinates)
      mockWorldCoordinates.pixelsToWorld.mockImplementation(() => {
        throw new Error('Conversion error')
      })

      expect(() => compassRadiusState.getCurrentRadiusWorld()).not.toThrow()
      
      // Should return pixel radius as fallback
      const fallbackRadius = compassRadiusState.getCurrentRadiusWorld()
      expect(fallbackRadius).toBe(50) // Pixel radius as fallback
    })
  })

  describe('localStorage integration', () => {
    it('should save radius state to localStorage on update', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(125)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'compassRadiusState',
        JSON.stringify({ currentRadius: 125, lastRadius: 50 })
      )
    })

    it('should save radius state on useLastRadius', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(75)
      compassRadiusState.useLastRadius()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'compassRadiusState',
        JSON.stringify({ currentRadius: 75, lastRadius: 50 })
      )
    })

    it('should save radius state on setRadiusFromShape', () => {
      compassRadiusState = new CompassRadiusState()
      
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(60, 80) // Length = 100
      
      compassRadiusState.setRadiusFromShape(line)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'compassRadiusState',
        JSON.stringify({ currentRadius: 100, lastRadius: 50 })
      )
    })

    it('should restore radius state from localStorage on initialization', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ currentRadius: 200, lastRadius: 150 })
      )

      compassRadiusState = new CompassRadiusState()

      expect(compassRadiusState.getCurrentRadius()).toBe(200)
      expect(compassRadiusState.getLastRadius()).toBe(150)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('compassRadiusState')
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json data')

      compassRadiusState = new CompassRadiusState()

      // Should fall back to default values
      expect(compassRadiusState.getCurrentRadius()).toBe(50)
      expect(compassRadiusState.getLastRadius()).toBe(50)
    })

    it('should handle missing localStorage data', () => {
      localStorageMock.getItem.mockReturnValue(null)

      compassRadiusState = new CompassRadiusState()

      // Should use default values
      expect(compassRadiusState.getCurrentRadius()).toBe(50)
      expect(compassRadiusState.getLastRadius()).toBe(50)
    })

    it('should validate and clamp restored radius values', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ currentRadius: 15000, lastRadius: -10 })
      )

      compassRadiusState = new CompassRadiusState()

      // Should clamp to valid ranges
      expect(compassRadiusState.getCurrentRadius()).toBe(10000)
      expect(compassRadiusState.getLastRadius()).toBe(1)
    })

    it('should handle partial localStorage data', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({ currentRadius: 75 }) // Missing lastRadius
      )

      compassRadiusState = new CompassRadiusState()

      expect(compassRadiusState.getCurrentRadius()).toBe(75)
      expect(compassRadiusState.getLastRadius()).toBe(50) // Default value
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded')
      })

      compassRadiusState = new CompassRadiusState()

      // Should not throw when saving fails
      expect(() => compassRadiusState.updateRadius(100)).not.toThrow()
      expect(compassRadiusState.getCurrentRadius()).toBe(100) // State should still update
    })

    it('should use custom storage key if provided', () => {
      // Ensure clean state with unique key
      localStorageMock.__resetStore()
      localStorageMock.setItem.mockClear()
      
      compassRadiusState = new CompassRadiusState(undefined, 50, 'unique_custom_key')
      expect(compassRadiusState.getCurrentRadius()).toBe(50)
      expect(compassRadiusState.getLastRadius()).toBe(50)
      
      compassRadiusState.updateRadius(80)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'unique_custom_key',
        JSON.stringify({ currentRadius: 80, lastRadius: 50 })
      )
    })
  })

  describe('state transitions', () => {
    it('should maintain state consistency through multiple operations', () => {
      compassRadiusState = new CompassRadiusState(undefined, 50, 'test_state_ops')
      const operations = [
        { op: 'update', value: 75, expectedCurrent: 75, expectedLast: 50 },
        { op: 'update', value: 125, expectedCurrent: 125, expectedLast: 75 },
        { op: 'useLast', expectedCurrent: 75, expectedLast: 125 },
        { op: 'update', value: 200, expectedCurrent: 200, expectedLast: 75 },
        { op: 'useLast', expectedCurrent: 75, expectedLast: 200 }
      ]

      operations.forEach(({ op, value, expectedCurrent, expectedLast }) => {
        if (op === 'update') {
          compassRadiusState.updateRadius(value!)
        } else if (op === 'useLast') {
          compassRadiusState.useLastRadius()
        }

        expect(compassRadiusState.getCurrentRadius()).toBe(expectedCurrent)
        expect(compassRadiusState.getLastRadius()).toBe(expectedLast)
      })
    })

    it('should handle rapid consecutive updates', () => {
      compassRadiusState = new CompassRadiusState(undefined, 50, 'test_rapid_updates')
      const radii = [100, 150, 75, 200, 50, 300]
      
      radii.forEach((radius, index) => {
        compassRadiusState.updateRadius(radius)
        
        expect(compassRadiusState.getCurrentRadius()).toBe(radius)
        if (index === 0) {
          expect(compassRadiusState.getLastRadius()).toBe(50) // Initial default
        } else {
          expect(compassRadiusState.getLastRadius()).toBe(radii[index - 1])
        }
      })
    })

    it('should maintain proper state when mixing different operations', () => {
      compassRadiusState = new CompassRadiusState(undefined, 50, 'test_mixed_ops')
      // Start: current=50, last=50
      expect(compassRadiusState.getCurrentRadius()).toBe(50)
      expect(compassRadiusState.getLastRadius()).toBe(50)

      // Update to 100: current=100, last=50
      compassRadiusState.updateRadius(100)
      expect(compassRadiusState.getCurrentRadius()).toBe(100)
      expect(compassRadiusState.getLastRadius()).toBe(50)

      // Set from line: current=60, last=100
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(36, 48) // Length = 60
      compassRadiusState.setRadiusFromShape(line)
      expect(compassRadiusState.getCurrentRadius()).toBe(60)
      expect(compassRadiusState.getLastRadius()).toBe(100)

      // Use last radius: current=100, last=60
      compassRadiusState.useLastRadius()
      expect(compassRadiusState.getCurrentRadius()).toBe(100)
      expect(compassRadiusState.getLastRadius()).toBe(60)

      // Set from arc: current=80, last=100
      const arc = new CompassArc()
      arc.setCenter(0, 0)
      arc.setRadius(48, 64) // Radius = 80
      compassRadiusState.setRadiusFromShape(arc)
      expect(compassRadiusState.getCurrentRadius()).toBe(80)
      expect(compassRadiusState.getLastRadius()).toBe(100)
    })

    it('should handle edge cases in state transitions', () => {
      compassRadiusState = new CompassRadiusState()
      // Setting same radius multiple times
      compassRadiusState.updateRadius(100)
      compassRadiusState.updateRadius(100)
      compassRadiusState.updateRadius(100)
      
      expect(compassRadiusState.getCurrentRadius()).toBe(100)
      expect(compassRadiusState.getLastRadius()).toBe(100) // Previous same value

      // Toggle with same values
      compassRadiusState.useLastRadius()
      expect(compassRadiusState.getCurrentRadius()).toBe(100)
      expect(compassRadiusState.getLastRadius()).toBe(100)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle NaN radius values', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(NaN)
      expect(compassRadiusState.getCurrentRadius()).toBe(1) // Should clamp to minimum
    })

    it('should handle Infinity radius values', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(Infinity)
      expect(compassRadiusState.getCurrentRadius()).toBe(10000) // Should clamp to maximum

      compassRadiusState.updateRadius(-Infinity)
      expect(compassRadiusState.getCurrentRadius()).toBe(1) // Should clamp to minimum
    })

    it('should handle very small floating point numbers', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(Number.MIN_VALUE)
      expect(compassRadiusState.getCurrentRadius()).toBe(1) // Should clamp to minimum

      compassRadiusState.updateRadius(0.999999)
      expect(compassRadiusState.getCurrentRadius()).toBe(1) // Should clamp to minimum
    })

    it('should handle very large floating point numbers', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(Number.MAX_VALUE)
      expect(compassRadiusState.getCurrentRadius()).toBe(10000) // Should clamp to maximum
    })

    it('should handle null/undefined shape input gracefully', () => {
      compassRadiusState = new CompassRadiusState(undefined, 50, 'test_null_shape')
      expect(() => compassRadiusState.setRadiusFromShape(null as any)).not.toThrow()
      expect(() => compassRadiusState.setRadiusFromShape(undefined as any)).not.toThrow()
      
      // Should maintain current state
      expect(compassRadiusState.getCurrentRadius()).toBe(50)
      expect(compassRadiusState.getLastRadius()).toBe(50)
    })

    it('should handle invalid shape objects', () => {
      compassRadiusState = new CompassRadiusState(undefined, 50, 'test_invalid_shape')
      const invalidShape = {} as any
      
      expect(() => compassRadiusState.setRadiusFromShape(invalidShape)).not.toThrow()
      
      // Should maintain current state when shape doesn't have expected methods
      expect(compassRadiusState.getCurrentRadius()).toBe(50)
      expect(compassRadiusState.getLastRadius()).toBe(50)
    })

    it('should handle concurrent operations safely', () => {
      compassRadiusState = new CompassRadiusState()
      // Simulate rapid operations that might occur in UI interactions
      const operations = Array(100).fill(0).map((_, i) => () => {
        if (i % 3 === 0) {
          compassRadiusState.updateRadius(50 + i)
        } else if (i % 3 === 1) {
          compassRadiusState.useLastRadius()
        } else {
          const line = new Line()
          line.setFirstPoint(0, 0)
          line.setSecondPoint(i, 0)
          compassRadiusState.setRadiusFromShape(line)
        }
      })

      // All operations should complete without throwing
      expect(() => {
        operations.forEach(op => op())
      }).not.toThrow()

      // State should be consistent
      const currentRadius = compassRadiusState.getCurrentRadius()
      const lastRadius = compassRadiusState.getLastRadius()
      
      expect(typeof currentRadius).toBe('number')
      expect(typeof lastRadius).toBe('number')
      expect(currentRadius).toBeGreaterThanOrEqual(1)
      expect(currentRadius).toBeLessThanOrEqual(10000)
      expect(lastRadius).toBeGreaterThanOrEqual(1)
      expect(lastRadius).toBeLessThanOrEqual(10000)
    })
  })

  describe('performance and memory', () => {
    it('should not leak memory with repeated operations', () => {
      compassRadiusState = new CompassRadiusState()
      const initialMemory = process.memoryUsage().heapUsed

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        compassRadiusState.updateRadius(50 + (i % 100))
        if (i % 10 === 0) {
          compassRadiusState.useLastRadius()
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 10MB for this test)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('should handle localStorage operations efficiently', () => {
      compassRadiusState = new CompassRadiusState()
      const startTime = Date.now()

      // Perform many operations that trigger localStorage saves
      for (let i = 0; i < 100; i++) {
        compassRadiusState.updateRadius(50 + i)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Operations should complete quickly (less than 100ms)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('integration with other systems', () => {
    it('should work correctly with compass arc creation', () => {
      compassRadiusState = new CompassRadiusState()
      compassRadiusState.updateRadius(75)

      // Simulate creating a compass arc with the current radius
      const arc = new CompassArc()
      arc.setCenter(100, 100)
      
      // Use current radius to set the arc radius point
      const currentRadius = compassRadiusState.getCurrentRadius()
      arc.setRadius(100 + currentRadius, 100) // Horizontal offset by radius

      expect(arc.getRadius()).toBe(75)
    })

    it('should support undo/redo-like functionality with radius history', () => {
      compassRadiusState = new CompassRadiusState(undefined, 50, 'test_undo_redo')
      
      // Simulate user workflow
      compassRadiusState.updateRadius(100) // User sets radius
      const checkpoint1 = {
        current: compassRadiusState.getCurrentRadius(),
        last: compassRadiusState.getLastRadius()
      }

      compassRadiusState.updateRadius(150) // User changes radius
      const checkpoint2 = {
        current: compassRadiusState.getCurrentRadius(),
        last: compassRadiusState.getLastRadius()
      }

      compassRadiusState.useLastRadius() // User undoes
      expect(compassRadiusState.getCurrentRadius()).toBe(100)

      compassRadiusState.useLastRadius() // User redoes
      expect(compassRadiusState.getCurrentRadius()).toBe(150)

      // Verify checkpoints are valid
      expect(checkpoint1.current).toBe(100)
      expect(checkpoint1.last).toBe(50)
      expect(checkpoint2.current).toBe(150)
      expect(checkpoint2.last).toBe(100)
    })
  })
})