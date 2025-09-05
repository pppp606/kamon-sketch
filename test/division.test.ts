import { Point, Line } from '../src/line'
import { CompassArc } from '../src/compassArc'
import { 
  divideTwoPoints, 
  divideLineSegment,
  divideRadiusPoints,
  DivisionPoint 
} from '../src/division'

describe('Point Division Calculations', () => {
  describe('divideTwoPoints', () => {
    it('should divide two points into 2 equal parts', () => {
      const pointA: Point = { x: 0, y: 0 }
      const pointB: Point = { x: 4, y: 4 }
      const divisions = 2

      const result = divideTwoPoints(pointA, pointB, divisions)

      expect(result).toHaveLength(1) // 2 divisions = 1 division point
      expect(result[0]).toEqual({ x: 2, y: 2 })
    })

    it('should divide two points into 3 equal parts', () => {
      const pointA: Point = { x: 0, y: 0 }
      const pointB: Point = { x: 6, y: 3 }
      const divisions = 3

      const result = divideTwoPoints(pointA, pointB, divisions)

      expect(result).toHaveLength(2) // 3 divisions = 2 division points
      expect(result[0]).toEqual({ x: 2, y: 1 })
      expect(result[1]).toEqual({ x: 4, y: 2 })
    })

    it('should divide two points into 4 equal parts', () => {
      const pointA: Point = { x: 0, y: 0 }
      const pointB: Point = { x: 8, y: 4 }
      const divisions = 4

      const result = divideTwoPoints(pointA, pointB, divisions)

      expect(result).toHaveLength(3) // 4 divisions = 3 division points
      expect(result[0]).toEqual({ x: 2, y: 1 })
      expect(result[1]).toEqual({ x: 4, y: 2 })
      expect(result[2]).toEqual({ x: 6, y: 3 })
    })

    it('should handle horizontal line division', () => {
      const pointA: Point = { x: 0, y: 5 }
      const pointB: Point = { x: 10, y: 5 }
      const divisions = 5

      const result = divideTwoPoints(pointA, pointB, divisions)

      expect(result).toHaveLength(4) // 5 divisions = 4 division points
      expect(result[0]).toEqual({ x: 2, y: 5 })
      expect(result[1]).toEqual({ x: 4, y: 5 })
      expect(result[2]).toEqual({ x: 6, y: 5 })
      expect(result[3]).toEqual({ x: 8, y: 5 })
    })

    it('should handle vertical line division', () => {
      const pointA: Point = { x: 3, y: 0 }
      const pointB: Point = { x: 3, y: 12 }
      const divisions = 3

      const result = divideTwoPoints(pointA, pointB, divisions)

      expect(result).toHaveLength(2) // 3 divisions = 2 division points
      expect(result[0]).toEqual({ x: 3, y: 4 })
      expect(result[1]).toEqual({ x: 3, y: 8 })
    })

    it('should handle single division correctly', () => {
      const pointA: Point = { x: 0, y: 0 }
      const pointB: Point = { x: 2, y: 2 }
      const divisions = 1

      const result = divideTwoPoints(pointA, pointB, divisions)

      expect(result).toHaveLength(0) // 1 division = 0 division points (no division needed)
    })

    it('should throw error for invalid division count', () => {
      const pointA: Point = { x: 0, y: 0 }
      const pointB: Point = { x: 2, y: 2 }

      expect(() => divideTwoPoints(pointA, pointB, 0)).toThrow('Division count must be greater than 0')
      expect(() => divideTwoPoints(pointA, pointB, -1)).toThrow('Division count must be greater than 0')
    })

    it('should handle same points (zero distance)', () => {
      const pointA: Point = { x: 5, y: 5 }
      const pointB: Point = { x: 5, y: 5 }
      const divisions = 3

      const result = divideTwoPoints(pointA, pointB, divisions)

      expect(result).toHaveLength(2) // 3 divisions = 2 division points
      expect(result[0]).toEqual({ x: 5, y: 5 }) // All points should be at the same location
      expect(result[1]).toEqual({ x: 5, y: 5 })
    })
  })
})

describe('Line Division Functionality', () => {
  describe('divideLineSegment', () => {
    it('should divide a completed line into 2 equal parts', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(4, 4)
      const divisions = 2

      const result = divideLineSegment(line, divisions)

      expect(result).toHaveLength(1) // 2 divisions = 1 division point
      expect(result[0]).toEqual({ x: 2, y: 2 })
    })

    it('should divide a completed line into 3 equal parts', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(6, 3)
      const divisions = 3

      const result = divideLineSegment(line, divisions)

      expect(result).toHaveLength(2) // 3 divisions = 2 division points
      expect(result[0]).toEqual({ x: 2, y: 1 })
      expect(result[1]).toEqual({ x: 4, y: 2 })
    })

    it('should handle horizontal line division', () => {
      const line = new Line()
      line.setFirstPoint(0, 5)
      line.setSecondPoint(10, 5)
      const divisions = 5

      const result = divideLineSegment(line, divisions)

      expect(result).toHaveLength(4) // 5 divisions = 4 division points
      expect(result[0]).toEqual({ x: 2, y: 5 })
      expect(result[1]).toEqual({ x: 4, y: 5 })
      expect(result[2]).toEqual({ x: 6, y: 5 })
      expect(result[3]).toEqual({ x: 8, y: 5 })
    })

    it('should handle vertical line division', () => {
      const line = new Line()
      line.setFirstPoint(3, 0)
      line.setSecondPoint(3, 12)
      const divisions = 4

      const result = divideLineSegment(line, divisions)

      expect(result).toHaveLength(3) // 4 divisions = 3 division points
      expect(result[0]).toEqual({ x: 3, y: 3 })
      expect(result[1]).toEqual({ x: 3, y: 6 })
      expect(result[2]).toEqual({ x: 3, y: 9 })
    })

    it('should throw error for incomplete line (no second point)', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      // No second point set
      const divisions = 2

      expect(() => divideLineSegment(line, divisions)).toThrow('Line must be completed (have both points) before division')
    })

    it('should throw error for incomplete line (no first point)', () => {
      const line = new Line()
      // No points set
      const divisions = 2

      expect(() => divideLineSegment(line, divisions)).toThrow('Line must be completed (have both points) before division')
    })

    it('should throw error for invalid division count', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(2, 2)

      expect(() => divideLineSegment(line, 0)).toThrow('Division count must be greater than 0')
      expect(() => divideLineSegment(line, -1)).toThrow('Division count must be greater than 0')
    })

    it('should handle zero-length line', () => {
      const line = new Line()
      line.setFirstPoint(5, 5)
      line.setSecondPoint(5, 5)
      const divisions = 3

      const result = divideLineSegment(line, divisions)

      expect(result).toHaveLength(2) // 3 divisions = 2 division points
      expect(result[0]).toEqual({ x: 5, y: 5 }) // All points at same location
      expect(result[1]).toEqual({ x: 5, y: 5 })
    })
  })
})

describe('CompassArc Radius Division Functionality', () => {
  describe('divideRadiusPoints', () => {
    it('should divide arc radius into 2 equal parts', () => {
      const arc = new CompassArc()
      arc.setCenter(0, 0)
      arc.setRadius(4, 0) // radius point at (4, 0) - radius length = 4
      const divisions = 2

      const result = divideRadiusPoints(arc, divisions)

      expect(result).toHaveLength(1) // 2 divisions = 1 division point
      expect(result[0]).toEqual({ x: 2, y: 0 }) // Midpoint along radius line
    })

    it('should divide arc radius into 3 equal parts', () => {
      const arc = new CompassArc()
      arc.setCenter(0, 0)
      arc.setRadius(6, 0) // radius point at (6, 0) - radius length = 6
      const divisions = 3

      const result = divideRadiusPoints(arc, divisions)

      expect(result).toHaveLength(2) // 3 divisions = 2 division points
      expect(result[0]).toEqual({ x: 2, y: 0 }) // 1/3 along radius
      expect(result[1]).toEqual({ x: 4, y: 0 }) // 2/3 along radius
    })

    it('should handle diagonal radius division', () => {
      const arc = new CompassArc()
      arc.setCenter(0, 0)
      arc.setRadius(4, 4) // radius point at (4, 4) - 45 degree angle
      const divisions = 2

      const result = divideRadiusPoints(arc, divisions)

      expect(result).toHaveLength(1) // 2 divisions = 1 division point
      expect(result[0]).toEqual({ x: 2, y: 2 }) // Midpoint along diagonal
    })

    it('should handle radius in negative quadrant', () => {
      const arc = new CompassArc()
      arc.setCenter(0, 0)
      arc.setRadius(-6, -3) // radius point at (-6, -3)
      const divisions = 3

      const result = divideRadiusPoints(arc, divisions)

      expect(result).toHaveLength(2) // 3 divisions = 2 division points
      expect(result[0]).toEqual({ x: -2, y: -1 }) // 1/3 along radius
      expect(result[1]).toEqual({ x: -4, y: -2 }) // 2/3 along radius
    })

    it('should handle arc with non-origin center', () => {
      const arc = new CompassArc()
      arc.setCenter(3, 2)
      arc.setRadius(7, 2) // radius point at (7, 2) - horizontal line from (3,2) to (7,2)
      const divisions = 4

      const result = divideRadiusPoints(arc, divisions)

      expect(result).toHaveLength(3) // 4 divisions = 3 division points
      expect(result[0]).toEqual({ x: 4, y: 2 }) // 1/4 along radius
      expect(result[1]).toEqual({ x: 5, y: 2 }) // 2/4 along radius
      expect(result[2]).toEqual({ x: 6, y: 2 }) // 3/4 along radius
    })

    it('should throw error for arc without radius set', () => {
      const arc = new CompassArc()
      arc.setCenter(0, 0)
      // No radius point set
      const divisions = 2

      expect(() => divideRadiusPoints(arc, divisions)).toThrow('Arc must have both center and radius set before division')
    })

    it('should throw error for arc without center set', () => {
      const arc = new CompassArc()
      // No center or radius set
      const divisions = 2

      expect(() => divideRadiusPoints(arc, divisions)).toThrow('Arc must have both center and radius set before division')
    })

    it('should throw error for invalid division count', () => {
      const arc = new CompassArc()
      arc.setCenter(0, 0)
      arc.setRadius(4, 0)

      expect(() => divideRadiusPoints(arc, 0)).toThrow('Division count must be greater than 0')
      expect(() => divideRadiusPoints(arc, -1)).toThrow('Division count must be greater than 0')
    })

    it('should handle zero-radius arc', () => {
      const arc = new CompassArc()
      arc.setCenter(5, 5)
      arc.setRadius(5, 5) // radius point same as center - zero radius
      const divisions = 3

      const result = divideRadiusPoints(arc, divisions)

      expect(result).toHaveLength(2) // 3 divisions = 2 division points
      expect(result[0]).toEqual({ x: 5, y: 5 }) // All points at center location
      expect(result[1]).toEqual({ x: 5, y: 5 })
    })
  })
})