import { CompassRadiusState } from '../src/compassRadiusState'

describe('CompassRadiusState', () => {
  let radiusState: CompassRadiusState

  describe('initialization', () => {
    it('should initialize with default radius of 10px', () => {
      radiusState = new CompassRadiusState()
      expect(radiusState.getCurrentRadius()).toBe(10)
    })

    it('should initialize with lastRadius same as currentRadius', () => {
      radiusState = new CompassRadiusState()
      expect(radiusState.getLastRadius()).toBe(10)
    })

    it('should initialize with no compass center', () => {
      radiusState = new CompassRadiusState()
      expect(radiusState.getCompassCenter()).toBeNull()
    })

    it('should initialize with IDLE state', () => {
      radiusState = new CompassRadiusState()
      expect(radiusState.getState()).toBe('IDLE')
    })
  })

  describe('radius clamping', () => {
    beforeEach(() => {
      radiusState = new CompassRadiusState()
    })

    it('should clamp radius to minimum 1px', () => {
      radiusState.setCurrentRadius(0.5)
      expect(radiusState.getCurrentRadius()).toBe(1)
    })

    it('should clamp radius to maximum 10000px', () => {
      radiusState.setCurrentRadius(15000)
      expect(radiusState.getCurrentRadius()).toBe(10000)
    })

    it('should accept valid radius within range', () => {
      radiusState.setCurrentRadius(50.5)
      expect(radiusState.getCurrentRadius()).toBe(50.5)
    })

    it('should clamp negative radius to minimum', () => {
      radiusState.setCurrentRadius(-10)
      expect(radiusState.getCurrentRadius()).toBe(1)
    })
  })

  describe('radius state management', () => {
    beforeEach(() => {
      radiusState = new CompassRadiusState()
    })

    it('should update currentRadius without affecting lastRadius in normal operation', () => {
      radiusState.setCurrentRadius(25)
      expect(radiusState.getCurrentRadius()).toBe(25)
      expect(radiusState.getLastRadius()).toBe(10) // unchanged
    })

    it('should backup and restore radius during shift operation', () => {
      radiusState.setCurrentRadius(30)
      radiusState.startShiftOperation({ x: 100, y: 100 })
      radiusState.updateShiftRadius(50)
      
      expect(radiusState.getCurrentRadius()).toBe(50)
      expect(radiusState.getLastRadius()).toBe(30) // backed up original value
    })

    it('should finalize shift operation by keeping new radius', () => {
      radiusState.setCurrentRadius(30)
      radiusState.startShiftOperation({ x: 100, y: 100 })
      radiusState.updateShiftRadius(60)
      radiusState.finalizeShiftOperation()
      
      expect(radiusState.getCurrentRadius()).toBe(60)
      expect(radiusState.getLastRadius()).toBe(30) // preserved for potential rollback
    })

    it('should cancel shift operation by restoring lastRadius', () => {
      radiusState.setCurrentRadius(30)
      radiusState.startShiftOperation({ x: 100, y: 100 })
      radiusState.updateShiftRadius(70)
      radiusState.cancelShiftOperation()
      
      expect(radiusState.getCurrentRadius()).toBe(30) // restored
      expect(radiusState.getLastRadius()).toBe(30)
    })
  })

  describe('compass center management', () => {
    beforeEach(() => {
      radiusState = new CompassRadiusState()
    })

    it('should set compass center during shift operation', () => {
      const center = { x: 150, y: 200 }
      radiusState.startShiftOperation(center)
      expect(radiusState.getCompassCenter()).toEqual(center)
    })

    it('should clear compass center when operation finishes', () => {
      radiusState.startShiftOperation({ x: 100, y: 100 })
      radiusState.finalizeShiftOperation()
      expect(radiusState.getCompassCenter()).toBeNull()
    })

    it('should clear compass center when operation is cancelled', () => {
      radiusState.startShiftOperation({ x: 100, y: 100 })
      radiusState.cancelShiftOperation()
      expect(radiusState.getCompassCenter()).toBeNull()
    })
  })

  describe('state transitions', () => {
    beforeEach(() => {
      radiusState = new CompassRadiusState()
    })

    it('should transition from IDLE to SETTING_RADIUS on shift operation start', () => {
      expect(radiusState.getState()).toBe('IDLE')
      radiusState.startShiftOperation({ x: 100, y: 100 })
      expect(radiusState.getState()).toBe('SETTING_RADIUS')
    })

    it('should stay in SETTING_RADIUS during radius updates', () => {
      radiusState.startShiftOperation({ x: 100, y: 100 })
      radiusState.updateShiftRadius(40)
      expect(radiusState.getState()).toBe('SETTING_RADIUS')
    })

    it('should return to IDLE after finalizing operation', () => {
      radiusState.startShiftOperation({ x: 100, y: 100 })
      radiusState.updateShiftRadius(40)
      radiusState.finalizeShiftOperation()
      expect(radiusState.getState()).toBe('IDLE')
    })

    it('should return to IDLE after cancelling operation', () => {
      radiusState.startShiftOperation({ x: 100, y: 100 })
      radiusState.updateShiftRadius(40)
      radiusState.cancelShiftOperation()
      expect(radiusState.getState()).toBe('IDLE')
    })
  })

  describe('distance-based radius calculation', () => {
    beforeEach(() => {
      radiusState = new CompassRadiusState()
    })

    it('should calculate radius from center to cursor position', () => {
      const center = { x: 100, y: 100 }
      const cursor = { x: 100, y: 200 }
      radiusState.startShiftOperation(center)
      radiusState.updateShiftRadiusFromPoint(cursor)
      expect(radiusState.getCurrentRadius()).toBe(100)
    })

    it('should calculate radius using Pythagorean theorem', () => {
      const center = { x: 0, y: 0 }
      const cursor = { x: 3, y: 4 }
      radiusState.startShiftOperation(center)
      radiusState.updateShiftRadiusFromPoint(cursor)
      expect(radiusState.getCurrentRadius()).toBe(5)
    })

    it('should clamp calculated radius to valid range', () => {
      const center = { x: 100, y: 100 }
      const cursor = { x: 100.5, y: 100 } // 0.5px distance
      radiusState.startShiftOperation(center)
      radiusState.updateShiftRadiusFromPoint(cursor)
      expect(radiusState.getCurrentRadius()).toBe(1) // clamped to minimum
    })

    it('should handle negative coordinates in distance calculation', () => {
      const center = { x: -100, y: -100 }
      const cursor = { x: -103, y: -104 }
      radiusState.startShiftOperation(center)
      radiusState.updateShiftRadiusFromPoint(cursor)
      expect(radiusState.getCurrentRadius()).toBe(5)
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      radiusState = new CompassRadiusState()
    })

    it('should throw error when updating shift radius without starting operation', () => {
      expect(() => radiusState.updateShiftRadius(50)).toThrow('Shift operation not started')
    })

    it('should throw error when updating shift radius from point without starting operation', () => {
      expect(() => radiusState.updateShiftRadiusFromPoint({ x: 100, y: 100 })).toThrow('Shift operation not started')
    })

    it('should throw error when finalizing without starting operation', () => {
      expect(() => radiusState.finalizeShiftOperation()).toThrow('Shift operation not started')
    })

    it('should throw error when cancelling without starting operation', () => {
      expect(() => radiusState.cancelShiftOperation()).toThrow('Shift operation not started')
    })
  })

  describe('edge cases', () => {
    beforeEach(() => {
      radiusState = new CompassRadiusState()
    })

    it('should handle zero distance in radius calculation', () => {
      const center = { x: 100, y: 100 }
      radiusState.startShiftOperation(center)
      radiusState.updateShiftRadiusFromPoint(center)
      expect(radiusState.getCurrentRadius()).toBe(1) // clamped to minimum
    })

    it('should handle very large distance in radius calculation', () => {
      const center = { x: 0, y: 0 }
      const cursor = { x: 20000, y: 0 }
      radiusState.startShiftOperation(center)
      radiusState.updateShiftRadiusFromPoint(cursor)
      expect(radiusState.getCurrentRadius()).toBe(10000) // clamped to maximum
    })

    it('should handle floating point precision', () => {
      radiusState.setCurrentRadius(123.456789)
      expect(radiusState.getCurrentRadius()).toBe(123.456789)
    })
  })

  describe('initialization with custom radius', () => {
    it('should initialize with custom radius when provided', () => {
      radiusState = new CompassRadiusState(25)
      expect(radiusState.getCurrentRadius()).toBe(25)
      expect(radiusState.getLastRadius()).toBe(25)
    })

    it('should clamp custom initial radius', () => {
      radiusState = new CompassRadiusState(15000)
      expect(radiusState.getCurrentRadius()).toBe(10000)
    })
  })
})