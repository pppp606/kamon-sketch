import { Point, Line } from '../src/line'
import { CompassArc } from '../src/compassArc'
import { 
  divideTwoPoints, 
  divideLineSegment,
  divideRadiusPoints,
  DivisionPoint,
  DivisionIntegrationHelper
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

describe('Division UI/Interaction System', () => {
  describe('DivisionMode', () => {
    let divisionMode: any

    beforeEach(() => {
      // Import and create DivisionMode instance
      const { DivisionMode } = require('../src/division')
      divisionMode = new DivisionMode()
    })

    it('should start in inactive state', () => {
      expect(divisionMode.isActive()).toBe(false)
      expect(divisionMode.getSelectedElement()).toBeNull()
      expect(divisionMode.getDivisions()).toBe(2) // Default divisions
      expect(divisionMode.getDivisionPoints()).toEqual([])
    })

    it('should activate division mode for selected line', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(4, 0)
      const element = { type: 'line' as const, element: line }

      divisionMode.activate(element, 3)

      expect(divisionMode.isActive()).toBe(true)
      expect(divisionMode.getSelectedElement()).toBe(element)
      expect(divisionMode.getDivisions()).toBe(3)
      
      const points = divisionMode.getDivisionPoints()
      expect(points).toHaveLength(2) // 3 divisions = 2 division points
      expect(points[0]).toEqual({ x: 4/3, y: 0 })
      expect(points[1]).toEqual({ x: 8/3, y: 0 })
    })

    it('should activate division mode for selected arc', () => {
      const arc = new CompassArc()
      arc.setCenter(0, 0)
      arc.setRadius(6, 0)
      const element = { type: 'arc' as const, element: arc }

      divisionMode.activate(element, 2)

      expect(divisionMode.isActive()).toBe(true)
      expect(divisionMode.getSelectedElement()).toBe(element)
      expect(divisionMode.getDivisions()).toBe(2)
      
      const points = divisionMode.getDivisionPoints()
      expect(points).toHaveLength(1) // 2 divisions = 1 division point
      expect(points[0]).toEqual({ x: 3, y: 0 }) // Midpoint of radius
    })

    it('should update divisions and recalculate points', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(8, 0)
      const element = { type: 'line' as const, element: line }

      divisionMode.activate(element, 2)
      expect(divisionMode.getDivisionPoints()).toHaveLength(1)

      divisionMode.setDivisions(4)
      expect(divisionMode.getDivisions()).toBe(4)
      
      const points = divisionMode.getDivisionPoints()
      expect(points).toHaveLength(3) // 4 divisions = 3 division points
      expect(points[0]).toEqual({ x: 2, y: 0 })
      expect(points[1]).toEqual({ x: 4, y: 0 })
      expect(points[2]).toEqual({ x: 6, y: 0 })
    })

    it('should deactivate and clear state', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(4, 0)
      const element = { type: 'line' as const, element: line }

      divisionMode.activate(element, 3)
      expect(divisionMode.isActive()).toBe(true)

      divisionMode.deactivate()

      expect(divisionMode.isActive()).toBe(false)
      expect(divisionMode.getSelectedElement()).toBeNull()
      expect(divisionMode.getDivisionPoints()).toEqual([])
    })

    it('should throw error for invalid element type', () => {
      const invalidElement = { type: 'invalid' as any, element: null }

      expect(() => divisionMode.activate(invalidElement, 2)).toThrow('Unsupported element type for division: invalid')
    })

    it('should throw error for invalid divisions count', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(4, 0)
      const element = { type: 'line' as const, element: line }

      expect(() => divisionMode.activate(element, 0)).toThrow('Division count must be greater than 0')
      expect(() => divisionMode.activate(element, -1)).toThrow('Division count must be greater than 0')
    })

    it('should find closest division point to mouse position', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(9, 0)
      const element = { type: 'line' as const, element: line }

      divisionMode.activate(element, 3)
      
      // Division points should be at (3, 0) and (6, 0)
      const mousePoint1 = { x: 2.8, y: 0.1 }
      const closest1 = divisionMode.getClosestDivisionPoint(mousePoint1, 1.0)
      expect(closest1).toEqual({ x: 3, y: 0 })

      const mousePoint2 = { x: 5.9, y: 0.2 }
      const closest2 = divisionMode.getClosestDivisionPoint(mousePoint2, 1.0)
      expect(closest2).toEqual({ x: 6, y: 0 })

      // Test with point too far away
      const mousePoint3 = { x: 10, y: 5 }
      const closest3 = divisionMode.getClosestDivisionPoint(mousePoint3, 1.0)
      expect(closest3).toBeNull()
    })
  })
})

describe('Division Integration Helper', () => {
  let helper: DivisionIntegrationHelper

  beforeEach(() => {
    helper = new DivisionIntegrationHelper()
  })

  it('should initialize with inactive division mode', () => {
    const status = helper.getDivisionStatus()
    expect(status.isActive).toBe(false)
    expect(status.selectedElementType).toBeUndefined()
    expect(status.divisions).toBeUndefined()
    expect(status.pointCount).toBe(0) // Empty array has length 0, not undefined
  })

  it('should activate quick division for line element', () => {
    const line = new Line()
    line.setFirstPoint(0, 0)
    line.setSecondPoint(10, 0)
    const element = { type: 'line' as const, element: line }

    const result = helper.activateQuickDivision(element, 3)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()

    const status = helper.getDivisionStatus()
    expect(status.isActive).toBe(true)
    expect(status.selectedElementType).toBe('line')
    expect(status.divisions).toBe(3)
    expect(status.pointCount).toBe(2)
  })

  it('should handle activation error for null element', () => {
    const result = helper.activateQuickDivision(null, 2)

    expect(result.success).toBe(false)
    expect(result.error).toBe('No element selected')
  })

  it('should handle mouse interaction for division point selection', () => {
    const line = new Line()
    line.setFirstPoint(0, 0)
    line.setSecondPoint(20, 0)
    const element = { type: 'line' as const, element: line }

    helper.activateQuickDivision(element, 4) // Points at 5, 10, 15

    let selectedPoint: DivisionPoint | null = null
    const handleSelection = (point: DivisionPoint) => {
      selectedPoint = point
    }

    // Test close mouse position
    const mousePoint = { x: 9.8, y: 0.3 }
    const handled = helper.handleMouseInteraction(mousePoint, handleSelection)

    expect(handled).toBe(true)
    expect(selectedPoint).toEqual({ x: 10, y: 0 })
  })

  it('should not handle mouse interaction when inactive', () => {
    const mousePoint = { x: 5, y: 0 }
    const handleSelection = jest.fn()

    const handled = helper.handleMouseInteraction(mousePoint, handleSelection)

    expect(handled).toBe(false)
    expect(handleSelection).not.toHaveBeenCalled()
  })

  it('should cycle through common divisions', () => {
    const line = new Line()
    line.setFirstPoint(0, 0)
    line.setSecondPoint(12, 0)
    const element = { type: 'line' as const, element: line }

    helper.activateQuickDivision(element, 2)
    
    expect(helper.getDivisionStatus().divisions).toBe(2)
    
    helper.cycleDivisions()
    expect(helper.getDivisionStatus().divisions).toBe(3)
    
    helper.cycleDivisions()
    expect(helper.getDivisionStatus().divisions).toBe(4)
    
    helper.cycleDivisions()
    expect(helper.getDivisionStatus().divisions).toBe(5)
    
    helper.cycleDivisions() // Should cycle back to 2
    expect(helper.getDivisionStatus().divisions).toBe(2)
  })

  it('should not cycle divisions when inactive', () => {
    expect(helper.getDivisionStatus().isActive).toBe(false)
    
    helper.cycleDivisions() // Should be no-op
    
    expect(helper.getDivisionStatus().isActive).toBe(false)
  })

  it('should deactivate properly', () => {
    const line = new Line()
    line.setFirstPoint(0, 0)
    line.setSecondPoint(6, 0)
    const element = { type: 'line' as const, element: line }

    helper.activateQuickDivision(element, 3)
    expect(helper.getDivisionStatus().isActive).toBe(true)

    helper.deactivate()
    expect(helper.getDivisionStatus().isActive).toBe(false)
  })
})