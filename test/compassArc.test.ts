import { CompassArc } from '../src/compassArc'

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

describe('CompassArc', () => {
  let compassArc: CompassArc

  describe('initialization', () => {
    it('should create a CompassArc instance', () => {
      compassArc = new CompassArc()
      expect(compassArc).toBeInstanceOf(CompassArc)
    })

    it('should initialize with no center point', () => {
      compassArc = new CompassArc()
      expect(compassArc.getCenterPoint()).toBeNull()
    })

    it('should initialize with no radius point', () => {
      compassArc = new CompassArc()
      expect(compassArc.getRadiusPoint()).toBeNull()
    })

    it('should initialize in IDLE state', () => {
      compassArc = new CompassArc()
      expect(compassArc.getState()).toBe('IDLE')
    })
  })

  describe('setCenter', () => {
    beforeEach(() => {
      compassArc = new CompassArc()
    })

    it('should set the center point', () => {
      const center = { x: 100, y: 200 }
      compassArc.setCenter(center.x, center.y)
      expect(compassArc.getCenterPoint()).toEqual(center)
    })

    it('should transition to CENTER_SET state after setting center', () => {
      compassArc.setCenter(100, 200)
      expect(compassArc.getState()).toBe('CENTER_SET')
    })

    it('should reset radius point when setting a new center', () => {
      compassArc.setCenter(100, 200)
      compassArc.setRadius(150, 250)
      compassArc.setCenter(300, 400)
      expect(compassArc.getRadiusPoint()).toBeNull()
    })

    it('should reset to CENTER_SET state when setting new center after radius', () => {
      compassArc.setCenter(100, 200)
      compassArc.setRadius(150, 250)
      expect(compassArc.getState()).toBe('RADIUS_SET')
      compassArc.setCenter(300, 400)
      expect(compassArc.getState()).toBe('CENTER_SET')
    })
  })

  describe('radius calculation', () => {
    beforeEach(() => {
      compassArc = new CompassArc()
    })

    it('should calculate radius from center to radius point', () => {
      compassArc.setCenter(100, 100)
      compassArc.setRadius(100, 200)
      expect(compassArc.getRadius()).toBe(100)
    })

    it('should calculate radius with Pythagorean theorem', () => {
      compassArc.setCenter(0, 0)
      compassArc.setRadius(3, 4)
      expect(compassArc.getRadius()).toBe(5)
    })

    it('should return 0 if radius point is not set', () => {
      compassArc.setCenter(100, 100)
      expect(compassArc.getRadius()).toBe(0)
    })

    it('should return 0 if center point is not set', () => {
      compassArc = new CompassArc()
      expect(compassArc.getRadius()).toBe(0)
    })

    it('should handle diagonal distances correctly', () => {
      compassArc.setCenter(100, 100)
      compassArc.setRadius(200, 200)
      const expectedRadius = Math.sqrt(100 * 100 + 100 * 100)
      expect(compassArc.getRadius()).toBeCloseTo(expectedRadius, 2)
    })
  })

  describe('angle calculation', () => {
    beforeEach(() => {
      compassArc = new CompassArc()
      compassArc.setCenter(100, 100)
      compassArc.setRadius(200, 100)
    })

    it('should calculate start angle from center to radius point', () => {
      const angle = compassArc.getStartAngle()
      expect(angle).toBe(0)
    })

    it('should calculate angle for point directly below center', () => {
      compassArc.setRadius(100, 200)
      const angle = compassArc.getStartAngle()
      expect(angle).toBeCloseTo(Math.PI / 2, 5)
    })

    it('should calculate angle for point directly left of center', () => {
      compassArc.setRadius(0, 100)
      const angle = compassArc.getStartAngle()
      expect(angle).toBeCloseTo(Math.PI, 5)
    })

    it('should calculate angle for point directly above center', () => {
      compassArc.setRadius(100, 0)
      const angle = compassArc.getStartAngle()
      expect(angle).toBeCloseTo(-Math.PI / 2, 5)
    })

    it('should calculate end angle during drawing', () => {
      compassArc.startDrawing()
      compassArc.updateDrawing(100, 200)
      const endAngle = compassArc.getEndAngle()
      expect(endAngle).toBeCloseTo(Math.PI / 2, 5)
    })

    it('should return 0 angles if points are not set', () => {
      compassArc = new CompassArc()
      expect(compassArc.getStartAngle()).toBe(0)
      expect(compassArc.getEndAngle()).toBe(0)
    })
  })

  describe('full circle detection', () => {
    beforeEach(() => {
      compassArc = new CompassArc()
      compassArc.setCenter(100, 100)
      compassArc.setRadius(200, 100)
      compassArc.startDrawing()
    })

    it('should detect when a full circle is completed', () => {
      compassArc.updateDrawing(200, 100)
      expect(compassArc.isFullCircle()).toBe(false)
      
      compassArc.updateDrawing(100, 200)
      expect(compassArc.isFullCircle()).toBe(false)
      
      compassArc.updateDrawing(0, 100)
      expect(compassArc.isFullCircle()).toBe(false)
      
      compassArc.updateDrawing(100, 0)
      expect(compassArc.isFullCircle()).toBe(false)
      
      compassArc.updateDrawing(199, 98)
      expect(compassArc.isFullCircle()).toBe(true)
    })

    it('should not detect full circle for partial arc', () => {
      compassArc.updateDrawing(100, 200)
      expect(compassArc.isFullCircle()).toBe(false)
      
      compassArc.updateDrawing(0, 100)
      expect(compassArc.isFullCircle()).toBe(false)
    })

    it('should return false if not in drawing state', () => {
      compassArc = new CompassArc()
      expect(compassArc.isFullCircle()).toBe(false)
      
      compassArc.setCenter(100, 100)
      expect(compassArc.isFullCircle()).toBe(false)
      
      compassArc.setRadius(200, 100)
      expect(compassArc.isFullCircle()).toBe(false)
    })

    it('should calculate total angle swept', () => {
      compassArc.updateDrawing(100, 200)
      let angle = compassArc.getTotalAngle()
      expect(angle).toBeCloseTo(Math.PI / 2, 5)
      
      compassArc.updateDrawing(0, 100)
      angle = compassArc.getTotalAngle()
      expect(angle).toBeCloseTo(Math.PI, 5)
      
      compassArc.updateDrawing(100, 0)
      angle = compassArc.getTotalAngle()
      expect(angle).toBeCloseTo(3 * Math.PI / 2, 5)
      
      compassArc.updateDrawing(200, 99)
      angle = compassArc.getTotalAngle()
      expect(angle).toBeCloseTo(2 * Math.PI, 1)
    })
  })

  describe('p5.js arc drawing', () => {
    let p: P5Instance

    beforeEach(() => {
      p = {
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
      compassArc = new CompassArc()
    })

    it('should draw center point when only center is set', () => {
      compassArc.setCenter(100, 100)
      compassArc.draw(p as any)
      
      expect(p.push).toHaveBeenCalled()
      expect(p.noFill).toHaveBeenCalled()
      expect(p.stroke).toHaveBeenCalledWith(0, 0, 0)
      expect(p.strokeWeight).toHaveBeenCalledWith(2)
      expect(p.point).toHaveBeenCalledWith(100, 100)
      expect(p.pop).toHaveBeenCalled()
    })

    it('should draw center, radius line, and guide circle when radius is set', () => {
      compassArc.setCenter(100, 100)
      compassArc.setRadius(150, 100)
      compassArc.draw(p as any)
      
      expect(p.point).toHaveBeenCalledWith(100, 100)
      expect(p.line).toHaveBeenCalledWith(100, 100, 150, 100)
      expect(p.circle).toHaveBeenCalledWith(100, 100, 100)
    })

    it('should draw arc during drawing state', () => {
      compassArc.setCenter(100, 100)
      compassArc.setRadius(150, 100)
      compassArc.startDrawing()
      compassArc.updateDrawing(150, 150)
      compassArc.draw(p as any)
      
      expect(p.arc).toHaveBeenCalledWith(100, 100, 100, 100, 0, Math.PI / 4)
    })

    it('should draw complete circle when full rotation detected', () => {
      compassArc.setCenter(100, 100)
      compassArc.setRadius(150, 100)
      compassArc.startDrawing()
      
      compassArc.updateDrawing(100, 150)
      compassArc.updateDrawing(50, 100)
      compassArc.updateDrawing(100, 50)
      compassArc.updateDrawing(149, 99)
      
      compassArc.draw(p as any)
      
      expect(p.circle).toHaveBeenCalledWith(100, 100, 100)
    })

    it('should not draw anything when no center is set', () => {
      compassArc.draw(p as any)
      
      expect(p.point).not.toHaveBeenCalled()
      expect(p.line).not.toHaveBeenCalled()
      expect(p.circle).not.toHaveBeenCalled()
      expect(p.arc).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      compassArc = new CompassArc()
    })

    it('should throw error when setting radius before center', () => {
      expect(() => compassArc.setRadius(100, 200)).toThrow('Center point must be set before setting radius')
    })

    it('should throw error when starting drawing before radius is set', () => {
      expect(() => compassArc.startDrawing()).toThrow('Radius must be set before drawing')
      
      compassArc.setCenter(100, 100)
      expect(() => compassArc.startDrawing()).toThrow('Radius must be set before drawing')
    })

    it('should throw error when updating drawing before starting', () => {
      expect(() => compassArc.updateDrawing(100, 200)).toThrow('Must start drawing before updating')
      
      compassArc.setCenter(100, 100)
      expect(() => compassArc.updateDrawing(100, 200)).toThrow('Must start drawing before updating')
      
      compassArc.setRadius(150, 100)
      expect(() => compassArc.updateDrawing(100, 200)).toThrow('Must start drawing before updating')
    })
  })

  describe('edge cases', () => {
    beforeEach(() => {
      compassArc = new CompassArc()
    })

    it('should handle zero radius (center equals radius point)', () => {
      compassArc.setCenter(100, 100)
      compassArc.setRadius(100, 100)
      expect(compassArc.getRadius()).toBe(0)
    })

    it('should handle very small radius', () => {
      compassArc.setCenter(100, 100)
      compassArc.setRadius(100.001, 100)
      expect(compassArc.getRadius()).toBeCloseTo(0.001, 5)
    })

    it('should handle negative coordinates', () => {
      compassArc.setCenter(-100, -100)
      compassArc.setRadius(-103, -104)
      expect(compassArc.getRadius()).toBe(5)
    })
  })

  describe('angle boundary crossing', () => {
    beforeEach(() => {
      compassArc = new CompassArc()
      compassArc.setCenter(0, 0)
    })

    it('should handle clockwise crossing from -π to π', () => {
      compassArc.setRadius(-50, 0)
      compassArc.startDrawing()
      
      compassArc.updateDrawing(-35.36, -35.36)
      let angle = compassArc.getTotalAngle()
      expect(angle).toBeCloseTo(Math.PI / 4, 5)
      
      compassArc.updateDrawing(0, -50)
      angle = compassArc.getTotalAngle()
      expect(angle).toBeCloseTo(Math.PI / 2, 5)
      
      compassArc.updateDrawing(35.36, -35.36)
      angle = compassArc.getTotalAngle()
      expect(angle).toBeCloseTo(3 * Math.PI / 4, 5)
      
      compassArc.updateDrawing(50, 0)
      angle = compassArc.getTotalAngle()
      expect(angle).toBeCloseTo(Math.PI, 5)
    })

    it('should handle counter-clockwise crossing from π to -π', () => {
      compassArc.setRadius(50, 0)
      compassArc.startDrawing()
      
      compassArc.updateDrawing(35.36, 35.36)
      let angle = compassArc.getTotalAngle()
      expect(angle).toBeCloseTo(Math.PI / 4, 5)
      
      compassArc.updateDrawing(0, 50)
      angle = compassArc.getTotalAngle()
      expect(angle).toBeCloseTo(Math.PI / 2, 5)
      
      compassArc.updateDrawing(-35.36, 35.36)
      angle = compassArc.getTotalAngle()
      expect(angle).toBeCloseTo(3 * Math.PI / 4, 5)
      
      compassArc.updateDrawing(-50, 0)
      angle = compassArc.getTotalAngle()
      expect(angle).toBeCloseTo(Math.PI, 5)
    })
  })

  describe('multi-rotation', () => {
    beforeEach(() => {
      compassArc = new CompassArc()
      compassArc.setCenter(0, 0)
      compassArc.setRadius(50, 0)
      compassArc.startDrawing()
    })

    it('should accumulate angles beyond 2π', () => {
      compassArc.updateDrawing(0, 50)
      expect(compassArc.getTotalAngle()).toBeCloseTo(Math.PI / 2, 5)
      
      compassArc.updateDrawing(-50, 0)
      expect(compassArc.getTotalAngle()).toBeCloseTo(Math.PI, 5)
      
      compassArc.updateDrawing(0, -50)
      expect(compassArc.getTotalAngle()).toBeCloseTo(3 * Math.PI / 2, 5)
      
      compassArc.updateDrawing(49, -1)
      expect(compassArc.getTotalAngle()).toBeCloseTo(2 * Math.PI, 1)
      
      compassArc.updateDrawing(0, 50)
      expect(compassArc.getTotalAngle()).toBeCloseTo(2 * Math.PI + Math.PI / 2, 2)
    })
  })

  describe('full circle threshold', () => {
    const FULL_CIRCLE_EPS = 0.1

    beforeEach(() => {
      compassArc = new CompassArc()
      compassArc.setCenter(0, 0)
      compassArc.setRadius(50, 0)
      compassArc.startDrawing()
    })

    it('should not detect full circle just below threshold', () => {
      const angleJustBelow = 2 * Math.PI - FULL_CIRCLE_EPS - 0.01
      const x = 50 * Math.cos(angleJustBelow)
      const y = 50 * Math.sin(angleJustBelow)
      compassArc.updateDrawing(x, y)
      expect(compassArc.isFullCircle()).toBe(false)
    })

    it('should detect full circle just above threshold', () => {
      compassArc.updateDrawing(0, 50)
      compassArc.updateDrawing(-50, 0)
      compassArc.updateDrawing(0, -50)
      compassArc.updateDrawing(49, 1)
      expect(compassArc.isFullCircle()).toBe(true)
    })
  })

  describe('p5.js drawing consistency', () => {
    let p: P5Instance

    beforeEach(() => {
      p = {
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
      compassArc = new CompassArc()
    })

    it('should maintain push/pop consistency', () => {
      compassArc.setCenter(100, 100)
      compassArc.draw(p as any)

      expect(p.push).toHaveBeenCalledTimes(1)
      expect(p.pop).toHaveBeenCalledTimes(1)
    })

    it('should maintain push/pop consistency for states with center point', () => {
      const states = [
        () => compassArc.setCenter(100, 100),
        () => { compassArc.setCenter(100, 100); compassArc.setRadius(150, 100) },
        () => {
          compassArc.setCenter(100, 100)
          compassArc.setRadius(150, 100)
          compassArc.startDrawing()
          compassArc.updateDrawing(150, 150)
        }
      ]

      states.forEach((setupState) => {
        jest.clearAllMocks()
        compassArc = new CompassArc()
        setupState()
        compassArc.draw(p as any)

        expect(p.push).toHaveBeenCalledTimes(1)
        expect(p.pop).toHaveBeenCalledTimes(1)
      })
    })

    it('should not call push/pop when no center is set', () => {
      compassArc.draw(p as any)

      expect(p.push).not.toHaveBeenCalled()
      expect(p.pop).not.toHaveBeenCalled()
    })
  })

  describe('arc start angle based on click position (TDD - Red Phase)', () => {
    let p: P5Instance

    beforeEach(() => {
      p = {
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
      compassArc = new CompassArc()
    })

    describe('normal mode (second click sets radius and start angle)', () => {
      it('should start arc at 0° when second click is directly right of center', () => {
        compassArc.setCenter(100, 100)
        compassArc.setRadius(150, 100) // Right of center = 0 degrees

        const expectedStartAngle = 0
        const actualStartAngle = compassArc.getStartAngle()

        expect(actualStartAngle).toBeCloseTo(expectedStartAngle, 5)
      })

      it('should start arc at 90° when second click is directly below center', () => {
        compassArc.setCenter(100, 100)
        compassArc.setRadius(100, 150) // Below center = 90 degrees (PI/2)

        const expectedStartAngle = Math.PI / 2
        const actualStartAngle = compassArc.getStartAngle()

        expect(actualStartAngle).toBeCloseTo(expectedStartAngle, 5)
      })

      it('should start arc at 180° when second click is directly left of center', () => {
        compassArc.setCenter(100, 100)
        compassArc.setRadius(50, 100) // Left of center = 180 degrees (PI)

        const expectedStartAngle = Math.PI
        const actualStartAngle = compassArc.getStartAngle()

        expect(actualStartAngle).toBeCloseTo(expectedStartAngle, 5)
      })

      it('should start arc at 270° when second click is directly above center', () => {
        compassArc.setCenter(100, 100)
        compassArc.setRadius(100, 50) // Above center = 270 degrees (-PI/2)

        const expectedStartAngle = -Math.PI / 2
        const actualStartAngle = compassArc.getStartAngle()

        expect(actualStartAngle).toBeCloseTo(expectedStartAngle, 5)
      })

      it('should start arc at 45° when second click is at bottom-right diagonal', () => {
        compassArc.setCenter(100, 100)
        const radius = 50
        const clickX = 100 + radius * Math.cos(Math.PI / 4) // 45 degrees
        const clickY = 100 + radius * Math.sin(Math.PI / 4)
        compassArc.setRadius(clickX, clickY)

        const expectedStartAngle = Math.PI / 4
        const actualStartAngle = compassArc.getStartAngle()

        expect(actualStartAngle).toBeCloseTo(expectedStartAngle, 5)
      })

      it('should start arc at 135° when second click is at bottom-left diagonal', () => {
        compassArc.setCenter(100, 100)
        const radius = 50
        const clickX = 100 + radius * Math.cos(3 * Math.PI / 4) // 135 degrees
        const clickY = 100 + radius * Math.sin(3 * Math.PI / 4)
        compassArc.setRadius(clickX, clickY)

        const expectedStartAngle = 3 * Math.PI / 4
        const actualStartAngle = compassArc.getStartAngle()

        expect(actualStartAngle).toBeCloseTo(expectedStartAngle, 5)
      })

      it('should start arc at -45° when second click is at top-right diagonal', () => {
        compassArc.setCenter(100, 100)
        const radius = 50
        const clickX = 100 + radius * Math.cos(-Math.PI / 4) // -45 degrees
        const clickY = 100 + radius * Math.sin(-Math.PI / 4)
        compassArc.setRadius(clickX, clickY)

        const expectedStartAngle = -Math.PI / 4
        const actualStartAngle = compassArc.getStartAngle()

        expect(actualStartAngle).toBeCloseTo(expectedStartAngle, 5)
      })

      it('should start arc at -135° when second click is at top-left diagonal', () => {
        compassArc.setCenter(100, 100)
        const radius = 50
        const clickX = 100 + radius * Math.cos(-3 * Math.PI / 4) // -135 degrees
        const clickY = 100 + radius * Math.sin(-3 * Math.PI / 4)
        compassArc.setRadius(clickX, clickY)

        const expectedStartAngle = -3 * Math.PI / 4
        const actualStartAngle = compassArc.getStartAngle()

        expect(actualStartAngle).toBeCloseTo(expectedStartAngle, 5)
      })
    })

    describe('fixed radius mode (angle from center through click position)', () => {
      it('should calculate start angle for fixed radius when click is at 0°', () => {
        compassArc.setCenter(100, 100)
        compassArc.setRadiusDistance(50) // Set fixed radius

        // Simulate click at 0 degrees from center
        const clickX = 150 // 50 pixels right of center
        const clickY = 100 // Same y as center

        // The start angle should be calculated from center through click position
        const expectedAngle = 0 // 0 degrees for point directly right of center

        const actualAngle = compassArc.calculateStartAngleFromClick(clickX, clickY)
        expect(actualAngle).toBeCloseTo(expectedAngle, 5)
      })

      it('should calculate start angle for fixed radius when click is at 90°', () => {
        compassArc.setCenter(100, 100)
        compassArc.setRadiusDistance(50)

        const clickX = 100 // Same x as center
        const clickY = 150 // 50 pixels below center

        const expectedAngle = Math.PI / 2

        const actualAngle = compassArc.calculateStartAngleFromClick(clickX, clickY)
        expect(actualAngle).toBeCloseTo(expectedAngle, 5)
      })

      it('should calculate start angle for fixed radius when click is at 180°', () => {
        compassArc.setCenter(100, 100)
        compassArc.setRadiusDistance(50)

        const clickX = 50 // 50 pixels left of center
        const clickY = 100 // Same y as center

        const expectedAngle = Math.PI

        const actualAngle = compassArc.calculateStartAngleFromClick(clickX, clickY)
        expect(actualAngle).toBeCloseTo(expectedAngle, 5)
      })

      it('should calculate start angle for fixed radius when click is at 270°', () => {
        compassArc.setCenter(100, 100)
        compassArc.setRadiusDistance(50)

        const clickX = 100 // Same x as center
        const clickY = 50 // 50 pixels above center

        const expectedAngle = -Math.PI / 2

        const actualAngle = compassArc.calculateStartAngleFromClick(clickX, clickY)
        expect(actualAngle).toBeCloseTo(expectedAngle, 5)
      })
    })

    describe('edge cases for vertical and horizontal lines', () => {
      it('should handle vertical line down (90°) correctly', () => {
        compassArc.setCenter(0, 0)
        compassArc.setRadius(0, 100) // Straight down

        const expectedAngle = Math.PI / 2
        const actualAngle = compassArc.getStartAngle()

        expect(actualAngle).toBeCloseTo(expectedAngle, 5)
      })

      it('should handle vertical line up (270°) correctly', () => {
        compassArc.setCenter(0, 0)
        compassArc.setRadius(0, -100) // Straight up

        const expectedAngle = -Math.PI / 2
        const actualAngle = compassArc.getStartAngle()

        expect(actualAngle).toBeCloseTo(expectedAngle, 5)
      })

      it('should handle horizontal line right (0°) correctly', () => {
        compassArc.setCenter(0, 0)
        compassArc.setRadius(100, 0) // Straight right

        const expectedAngle = 0
        const actualAngle = compassArc.getStartAngle()

        expect(actualAngle).toBeCloseTo(expectedAngle, 5)
      })

      it('should handle horizontal line left (180°) correctly', () => {
        compassArc.setCenter(0, 0)
        compassArc.setRadius(-100, 0) // Straight left

        const expectedAngle = Math.PI
        const actualAngle = compassArc.getStartAngle()

        expect(actualAngle).toBeCloseTo(expectedAngle, 5)
      })

      it('should handle click exactly at center (undefined angle)', () => {
        compassArc.setCenter(100, 100)
        compassArc.setRadiusDistance(50)

        // Click exactly at center should return 0 angle
        const actualAngle = compassArc.calculateStartAngleFromClick(100, 100)
        expect(actualAngle).toBe(0)
      })
    })

    describe('arc path generation with correct start angles', () => {
      it('should generate arc path with start angle from second click position', () => {
        compassArc.setCenter(100, 100)
        compassArc.setRadius(150, 100) // Start at 0 degrees
        compassArc.startDrawing()
        compassArc.updateDrawing(100, 150) // End at 90 degrees

        compassArc.draw(p as any)

        // The arc should be drawn with start angle = 0, end angle = PI/2
        expect(p.arc).toHaveBeenCalledWith(100, 100, 100, 100, 0, Math.PI / 2)
      })

      it('should generate arc path starting from diagonal click position', () => {
        compassArc.setCenter(0, 0)
        const radius = 50
        const startAngle = Math.PI / 4 // 45 degrees
        const clickX = radius * Math.cos(startAngle)
        const clickY = radius * Math.sin(startAngle)

        compassArc.setRadius(clickX, clickY)
        compassArc.startDrawing()
        compassArc.updateDrawing(0, radius) // End at 90 degrees

        compassArc.draw(p as any)

        // The arc should start from 45 degrees and end at 90 degrees
        // Check that p.arc was called with correct parameters, allowing for floating point precision
        expect(p.arc).toHaveBeenCalledTimes(1)
        const [centerX, centerY, width, height, startAngleArg, endAngleArg] = p.arc.mock.calls[0]
        expect(centerX).toBe(0)
        expect(centerY).toBe(0)
        expect(width).toBeCloseTo(radius * 2, 5)
        expect(height).toBeCloseTo(radius * 2, 5)
        expect(startAngleArg).toBeCloseTo(Math.PI / 4, 5)
        expect(endAngleArg).toBeCloseTo(Math.PI / 2, 5)
      })
    })

    describe('integration with mouse event simulation', () => {
      it('should correctly calculate start angle from simulated mouse clicks', () => {
        // Simulate mouse event data structure
        const mockMouseEvent = {
          x: 150,
          y: 100
        }

        compassArc.setCenter(100, 100)

        // Simulate second click that should set radius and start angle
        compassArc.setRadius(mockMouseEvent.x, mockMouseEvent.y)

        const expectedStartAngle = 0 // Click is directly right of center
        const actualStartAngle = compassArc.getStartAngle()

        expect(actualStartAngle).toBeCloseTo(expectedStartAngle, 5)
      })

      it('should work with negative coordinates', () => {
        compassArc.setCenter(-50, -50)
        compassArc.setRadius(-100, -50) // Left of center

        const expectedStartAngle = Math.PI // 180 degrees
        const actualStartAngle = compassArc.getStartAngle()

        expect(actualStartAngle).toBeCloseTo(expectedStartAngle, 5)
      })

      it('should work with large coordinate values', () => {
        compassArc.setCenter(1000, 1000)
        compassArc.setRadius(1000, 1500) // Below center

        const expectedStartAngle = Math.PI / 2 // 90 degrees
        const actualStartAngle = compassArc.getStartAngle()

        expect(actualStartAngle).toBeCloseTo(expectedStartAngle, 5)
      })
    })
  })
})