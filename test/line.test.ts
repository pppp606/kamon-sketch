import { Line } from '../src/line'

interface P5Instance {
  push: jest.Mock;
  pop: jest.Mock;
  noFill: jest.Mock;
  stroke: jest.Mock;
  strokeWeight: jest.Mock;
  point: jest.Mock;
  line: jest.Mock;
}

describe('Line', () => {
  let line: Line

  describe('initialization', () => {
    it('should create a Line instance', () => {
      line = new Line()
      expect(line).toBeInstanceOf(Line)
    })

    it('should initialize with no first point', () => {
      line = new Line()
      expect(line.getFirstPoint()).toBeNull()
    })

    it('should initialize with no second point', () => {
      line = new Line()
      expect(line.getSecondPoint()).toBeNull()
    })

    it('should initialize in IDLE state', () => {
      line = new Line()
      expect(line.getState()).toBe('IDLE')
    })
  })

  describe('setFirstPoint', () => {
    beforeEach(() => {
      line = new Line()
    })

    it('should set the first point', () => {
      const firstPoint = { x: 100, y: 200 }
      line.setFirstPoint(firstPoint.x, firstPoint.y)
      expect(line.getFirstPoint()).toEqual(firstPoint)
    })

    it('should transition to FIRST_POINT state after setting first point', () => {
      line.setFirstPoint(100, 200)
      expect(line.getState()).toBe('FIRST_POINT')
    })

    it('should reset second point when setting a new first point', () => {
      line.setFirstPoint(100, 200)
      line.setSecondPoint(150, 250)
      line.setFirstPoint(300, 400)
      expect(line.getSecondPoint()).toBeNull()
    })

    it('should reset to FIRST_POINT state when setting new first point after second', () => {
      line.setFirstPoint(100, 200)
      line.setSecondPoint(150, 250)
      expect(line.getState()).toBe('DRAWING')
      line.setFirstPoint(300, 400)
      expect(line.getState()).toBe('FIRST_POINT')
    })
  })

  describe('setSecondPoint', () => {
    beforeEach(() => {
      line = new Line()
    })

    it('should set the second point', () => {
      line.setFirstPoint(100, 200)
      const secondPoint = { x: 150, y: 250 }
      line.setSecondPoint(secondPoint.x, secondPoint.y)
      expect(line.getSecondPoint()).toEqual(secondPoint)
    })

    it('should transition to DRAWING state after setting second point', () => {
      line.setFirstPoint(100, 200)
      line.setSecondPoint(150, 250)
      expect(line.getState()).toBe('DRAWING')
    })

    it('should throw error when setting second point before first', () => {
      expect(() => line.setSecondPoint(150, 250)).toThrow('First point must be set before setting second point')
    })
  })

  describe('length calculation', () => {
    beforeEach(() => {
      line = new Line()
    })

    it('should calculate length from first to second point', () => {
      line.setFirstPoint(100, 100)
      line.setSecondPoint(100, 200)
      expect(line.getLength()).toBe(100)
    })

    it('should calculate length with Pythagorean theorem', () => {
      line.setFirstPoint(0, 0)
      line.setSecondPoint(3, 4)
      expect(line.getLength()).toBe(5)
    })

    it('should return 0 if second point is not set', () => {
      line.setFirstPoint(100, 100)
      expect(line.getLength()).toBe(0)
    })

    it('should return 0 if first point is not set', () => {
      line = new Line()
      expect(line.getLength()).toBe(0)
    })

    it('should handle diagonal distances correctly', () => {
      line.setFirstPoint(100, 100)
      line.setSecondPoint(200, 200)
      const expectedLength = Math.sqrt(100 * 100 + 100 * 100)
      expect(line.getLength()).toBeCloseTo(expectedLength, 2)
    })

    it('should handle zero length (same points)', () => {
      line.setFirstPoint(100, 100)
      line.setSecondPoint(100, 100)
      expect(line.getLength()).toBe(0)
    })

    it('should handle negative coordinates', () => {
      line.setFirstPoint(-100, -100)
      line.setSecondPoint(-103, -104)
      expect(line.getLength()).toBe(5)
    })
  })

  describe('angle calculation', () => {
    beforeEach(() => {
      line = new Line()
    })

    it('should calculate angle for horizontal line to the right', () => {
      line.setFirstPoint(100, 100)
      line.setSecondPoint(200, 100)
      expect(line.getAngle()).toBe(0)
    })

    it('should calculate angle for vertical line downward', () => {
      line.setFirstPoint(100, 100)
      line.setSecondPoint(100, 200)
      expect(line.getAngle()).toBeCloseTo(Math.PI / 2, 5)
    })

    it('should calculate angle for horizontal line to the left', () => {
      line.setFirstPoint(100, 100)
      line.setSecondPoint(0, 100)
      expect(line.getAngle()).toBeCloseTo(Math.PI, 5)
    })

    it('should calculate angle for vertical line upward', () => {
      line.setFirstPoint(100, 100)
      line.setSecondPoint(100, 0)
      expect(line.getAngle()).toBeCloseTo(-Math.PI / 2, 5)
    })

    it('should calculate angle for diagonal line', () => {
      line.setFirstPoint(0, 0)
      line.setSecondPoint(100, 100)
      expect(line.getAngle()).toBeCloseTo(Math.PI / 4, 5)
    })

    it('should return 0 if points are not set', () => {
      line = new Line()
      expect(line.getAngle()).toBe(0)
    })

    it('should return 0 if only first point is set', () => {
      line.setFirstPoint(100, 100)
      expect(line.getAngle()).toBe(0)
    })
  })

  describe('p5.js line drawing', () => {
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
      }
      line = new Line()
    })

    it('should draw first point when only first point is set', () => {
      line.setFirstPoint(100, 100)
      line.draw(p as any)
      
      expect(p.push).toHaveBeenCalled()
      expect(p.noFill).toHaveBeenCalled()
      expect(p.stroke).toHaveBeenCalledWith(0, 0, 0)
      expect(p.strokeWeight).toHaveBeenCalledWith(2)
      expect(p.point).toHaveBeenCalledWith(100, 100)
      expect(p.pop).toHaveBeenCalled()
    })

    it('should draw line when both points are set', () => {
      line.setFirstPoint(100, 100)
      line.setSecondPoint(200, 200)
      line.draw(p as any)
      
      expect(p.push).toHaveBeenCalled()
      expect(p.noFill).toHaveBeenCalled()
      expect(p.stroke).toHaveBeenCalledWith(0, 0, 0)
      expect(p.strokeWeight).toHaveBeenCalledWith(2)
      expect(p.line).toHaveBeenCalledWith(100, 100, 200, 200)
      expect(p.pop).toHaveBeenCalled()
    })

    it('should not draw anything when no first point is set', () => {
      line.draw(p as any)
      
      expect(p.point).not.toHaveBeenCalled()
      expect(p.line).not.toHaveBeenCalled()
    })

    it('should maintain push/pop consistency', () => {
      line.setFirstPoint(100, 100)
      line.draw(p as any)
      
      expect(p.push).toHaveBeenCalledTimes(1)
      expect(p.pop).toHaveBeenCalledTimes(1)
    })

    it('should maintain push/pop consistency for all states with first point', () => {
      const states = [
        () => line.setFirstPoint(100, 100),
        () => { 
          line.setFirstPoint(100, 100)
          line.setSecondPoint(200, 200)
        }
      ]

      states.forEach((setupState) => {
        jest.clearAllMocks()
        line = new Line()
        setupState()
        line.draw(p as any)
        
        expect(p.push).toHaveBeenCalledTimes(1)
        expect(p.pop).toHaveBeenCalledTimes(1)
      })
    })

    it('should not call push/pop when no first point is set', () => {
      line.draw(p as any)
      
      expect(p.push).not.toHaveBeenCalled()
      expect(p.pop).not.toHaveBeenCalled()
    })
  })
})