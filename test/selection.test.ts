import { Selection, SelectableElement } from '../src/selection'
import { Line } from '../src/line'
import { CompassArc } from '../src/compassArc'

describe('Selection', () => {
  let selection: Selection
  
  describe('initialization', () => {
    it('should create a Selection instance', () => {
      selection = new Selection()
      expect(selection).toBeInstanceOf(Selection)
    })

    it('should initialize with no selected element', () => {
      selection = new Selection()
      expect(selection.getSelectedElement()).toBeNull()
    })
  })

  describe('distance calculation', () => {
    beforeEach(() => {
      selection = new Selection()
    })

    describe('point to line distance', () => {
      it('should calculate distance from point to horizontal line', () => {
        const line = new Line()
        line.setFirstPoint(0, 100)
        line.setSecondPoint(200, 100)
        
        const distance = selection.calculateDistanceToLine({ x: 100, y: 50 }, line)
        expect(distance).toBe(50)
      })

      it('should calculate distance from point to vertical line', () => {
        const line = new Line()
        line.setFirstPoint(100, 0)
        line.setSecondPoint(100, 200)
        
        const distance = selection.calculateDistanceToLine({ x: 150, y: 100 }, line)
        expect(distance).toBe(50)
      })

      it('should calculate distance from point to diagonal line', () => {
        const line = new Line()
        line.setFirstPoint(0, 0)
        line.setSecondPoint(100, 100)
        
        const distance = selection.calculateDistanceToLine({ x: 0, y: 100 }, line)
        expect(distance).toBeCloseTo(70.71, 2) // sqrt(2) * 50
      })

      it('should handle point on the line', () => {
        const line = new Line()
        line.setFirstPoint(0, 0)
        line.setSecondPoint(100, 0)
        
        const distance = selection.calculateDistanceToLine({ x: 50, y: 0 }, line)
        expect(distance).toBe(0)
      })

      it('should calculate distance to line segment endpoints', () => {
        const line = new Line()
        line.setFirstPoint(50, 50)
        line.setSecondPoint(150, 50)
        
        // Point beyond left end
        const distanceLeft = selection.calculateDistanceToLine({ x: 0, y: 50 }, line)
        expect(distanceLeft).toBe(50)
        
        // Point beyond right end
        const distanceRight = selection.calculateDistanceToLine({ x: 200, y: 50 }, line)
        expect(distanceRight).toBe(50)
      })
    })

    describe('point to arc distance', () => {
      it('should calculate distance from point to arc center', () => {
        const arc = new CompassArc()
        arc.setCenter(100, 100)
        arc.setRadius(150, 100) // radius = 50, start angle = 0
        arc.startDrawing()
        arc.updateDrawing(100, 150) // end angle = π/2
        
        // Point at top of circle (270 degrees) should be distance to nearest arc endpoint
        const distance = selection.calculateDistanceToArc({ x: 100, y: 50 }, arc)
        expect(distance).toBeCloseTo(70.71, 1) // Distance to closest arc endpoint
      })

      it('should calculate distance from point inside arc to arc boundary', () => {
        const arc = new CompassArc()
        arc.setCenter(100, 100)
        arc.setRadius(150, 100) // radius = 50, start angle = 0
        arc.startDrawing()
        arc.updateDrawing(100, 150) // end angle = π/2
        
        // Point at center - distance from center to any point on arc boundary is the radius
        const distance = selection.calculateDistanceToArc({ x: 100, y: 100 }, arc)
        expect(distance).toBe(50) // Distance from center to arc boundary (radius)
      })

      it('should calculate distance from point outside arc to arc boundary', () => {
        const arc = new CompassArc()
        arc.setCenter(100, 100)
        arc.setRadius(150, 100) // radius = 50, start angle = 0
        arc.startDrawing()
        arc.updateDrawing(100, 150) // end angle = π/2
        
        // Point at bottom of circle (270 degrees) should be distance to nearest arc endpoint
        const distance = selection.calculateDistanceToArc({ x: 100, y: 0 }, arc)
        expect(distance).toBeCloseTo(111.80, 1) // Distance to closest arc endpoint
      })

      it('should calculate distance correctly for point within arc angle range', () => {
        const arc = new CompassArc()
        arc.setCenter(100, 100)
        arc.setRadius(150, 100) // radius = 50, start angle = 0
        arc.startDrawing()
        arc.updateDrawing(100, 150) // end angle = π/2
        
        // Point within arc range (45 degrees) should return distance to circle
        // Using a point exactly on the circle at 45 degrees
        const angle45 = Math.PI / 4
        const x = 100 + 50 * Math.cos(angle45)
        const y = 100 + 50 * Math.sin(angle45)
        const distance = selection.calculateDistanceToArc({ x, y }, arc)
        expect(distance).toBeCloseTo(0, 2) // Point is exactly on the circle within arc range
      })
    })
  })

  describe('snap detection', () => {
    beforeEach(() => {
      selection = new Selection()
    })

    it('should find closest element among lines and arcs', () => {
      const line1 = new Line()
      line1.setFirstPoint(0, 0)
      line1.setSecondPoint(100, 0)
      
      const line2 = new Line()
      line2.setFirstPoint(0, 100)
      line2.setSecondPoint(100, 100)
      
      const elements: SelectableElement[] = [
        { type: 'line', element: line1 },
        { type: 'line', element: line2 }
      ]
      
      const closest = selection.findClosestElement({ x: 50, y: 10 }, elements)
      expect(closest).toEqual({ type: 'line', element: line1 })
    })

    it('should return null when no elements are provided', () => {
      const closest = selection.findClosestElement({ x: 50, y: 50 }, [])
      expect(closest).toBeNull()
    })

    it('should handle mixed line and arc elements', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(100, 0)
      
      const arc = new CompassArc()
      arc.setCenter(50, 100)
      arc.setRadius(100, 100) // radius = 50
      arc.startDrawing()
      arc.updateDrawing(100, 150)
      
      const elements: SelectableElement[] = [
        { type: 'line', element: line },
        { type: 'arc', element: arc }
      ]
      
      // Point closer to arc
      const closest = selection.findClosestElement({ x: 50, y: 75 }, elements)
      expect(closest).toEqual({ type: 'arc', element: arc })
    })
  })

  describe('selection state management', () => {
    beforeEach(() => {
      selection = new Selection()
    })

    it('should allow selecting a line element', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(100, 100)
      
      const element = { type: 'line' as const, element: line }
      selection.setSelectedElement(element)
      
      expect(selection.getSelectedElement()).toEqual(element)
    })

    it('should allow selecting an arc element', () => {
      const arc = new CompassArc()
      arc.setCenter(50, 50)
      arc.setRadius(100, 50)
      arc.startDrawing()
      arc.updateDrawing(100, 100)
      
      const element = { type: 'arc' as const, element: arc }
      selection.setSelectedElement(element)
      
      expect(selection.getSelectedElement()).toEqual(element)
    })

    it('should allow deselecting by setting null', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(100, 100)
      
      const element = { type: 'line' as const, element: line }
      selection.setSelectedElement(element)
      expect(selection.getSelectedElement()).not.toBeNull()
      
      selection.setSelectedElement(null)
      expect(selection.getSelectedElement()).toBeNull()
    })

    it('should replace previous selection when selecting new element', () => {
      const line1 = new Line()
      line1.setFirstPoint(0, 0)
      line1.setSecondPoint(100, 0)
      
      const line2 = new Line()
      line2.setFirstPoint(0, 100)
      line2.setSecondPoint(100, 100)
      
      const element1 = { type: 'line' as const, element: line1 }
      const element2 = { type: 'line' as const, element: line2 }
      
      selection.setSelectedElement(element1)
      expect(selection.getSelectedElement()).toEqual(element1)
      
      selection.setSelectedElement(element2)
      expect(selection.getSelectedElement()).toEqual(element2)
    })

    it('should provide a method to check if an element is selected', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(100, 100)
      
      const element = { type: 'line' as const, element: line }
      
      expect(selection.isSelected(element)).toBe(false)
      
      selection.setSelectedElement(element)
      expect(selection.isSelected(element)).toBe(true)
      
      selection.setSelectedElement(null)
      expect(selection.isSelected(element)).toBe(false)
    })

    it('should distinguish between different elements of same type', () => {
      const line1 = new Line()
      line1.setFirstPoint(0, 0)
      line1.setSecondPoint(100, 0)
      
      const line2 = new Line()
      line2.setFirstPoint(0, 100)
      line2.setSecondPoint(100, 100)
      
      const element1 = { type: 'line' as const, element: line1 }
      const element2 = { type: 'line' as const, element: line2 }
      
      selection.setSelectedElement(element1)
      
      expect(selection.isSelected(element1)).toBe(true)
      expect(selection.isSelected(element2)).toBe(false)
    })
  })

  describe('visual highlight rendering', () => {
    let mockP5: any

    beforeEach(() => {
      selection = new Selection()
      mockP5 = {
        push: jest.fn(),
        pop: jest.fn(),
        noFill: jest.fn(),
        stroke: jest.fn(),
        strokeWeight: jest.fn(),
        line: jest.fn(),
        circle: jest.fn(),
        arc: jest.fn(),
        point: jest.fn()
      }
    })

    it('should render highlight for selected line', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(100, 100)
      
      const element = { type: 'line' as const, element: line }
      selection.setSelectedElement(element)
      
      selection.drawHighlight(mockP5)
      
      expect(mockP5.push).toHaveBeenCalled()
      expect(mockP5.stroke).toHaveBeenCalledWith(255, 0, 0) // Red highlight
      expect(mockP5.strokeWeight).toHaveBeenCalledWith(4) // Thicker stroke for highlight
      expect(mockP5.line).toHaveBeenCalledWith(0, 0, 100, 100)
      expect(mockP5.pop).toHaveBeenCalled()
    })

    it('should render highlight for selected arc', () => {
      const arc = new CompassArc()
      arc.setCenter(50, 50)
      arc.setRadius(100, 50) // radius = 50
      arc.startDrawing()
      arc.updateDrawing(100, 100)
      
      const element = { type: 'arc' as const, element: arc }
      selection.setSelectedElement(element)
      
      selection.drawHighlight(mockP5)
      
      expect(mockP5.push).toHaveBeenCalled()
      expect(mockP5.stroke).toHaveBeenCalledWith(255, 0, 0) // Red highlight
      expect(mockP5.strokeWeight).toHaveBeenCalledWith(4) // Thicker stroke for highlight
      expect(mockP5.arc).toHaveBeenCalled()
      expect(mockP5.pop).toHaveBeenCalled()
    })

    it('should not render highlight when no element is selected', () => {
      selection.setSelectedElement(null)
      
      selection.drawHighlight(mockP5)
      
      expect(mockP5.push).not.toHaveBeenCalled()
      expect(mockP5.pop).not.toHaveBeenCalled()
      expect(mockP5.line).not.toHaveBeenCalled()
      expect(mockP5.arc).not.toHaveBeenCalled()
    })

    it('should allow customizing highlight color', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(100, 100)
      
      const element = { type: 'line' as const, element: line }
      selection.setSelectedElement(element)
      
      selection.drawHighlight(mockP5, { r: 0, g: 255, b: 0 }) // Green highlight
      
      expect(mockP5.stroke).toHaveBeenCalledWith(0, 255, 0)
    })

    it('should allow customizing highlight stroke weight', () => {
      const line = new Line()
      line.setFirstPoint(0, 0)
      line.setSecondPoint(100, 100)
      
      const element = { type: 'line' as const, element: line }
      selection.setSelectedElement(element)
      
      selection.drawHighlight(mockP5, undefined, 6) // Custom stroke weight
      
      expect(mockP5.strokeWeight).toHaveBeenCalledWith(6)
    })
  })

  describe('closest point calculation', () => {
    beforeEach(() => {
      selection = new Selection()
    })

    describe('line closest point', () => {
      it('should find closest point on horizontal line', () => {
        const line = new Line()
        line.setFirstPoint(0, 100)
        line.setSecondPoint(200, 100)
        
        const element = { type: 'line' as const, element: line }
        const closestPoint = selection.getClosestPointOnElement({ x: 150, y: 50 }, element)
        
        expect(closestPoint).toEqual({ x: 150, y: 100 })
      })

      it('should return line endpoint when point is beyond segment', () => {
        const line = new Line()
        line.setFirstPoint(50, 50)
        line.setSecondPoint(150, 50)
        
        const element = { type: 'line' as const, element: line }
        const closestPoint = selection.getClosestPointOnElement({ x: 0, y: 50 }, element)
        
        expect(closestPoint).toEqual({ x: 50, y: 50 })
      })
    })

    describe('arc closest point', () => {
      it('should find closest point on full circle', () => {
        const arc = new CompassArc()
        arc.setCenter(100, 100)
        arc.setRadius(150, 100) // radius = 50
        
        const element = { type: 'arc' as const, element: arc }
        const closestPoint = selection.getClosestPointOnElement({ x: 200, y: 100 }, element)
        
        expect(closestPoint).toEqual({ x: 150, y: 100 })
      })

      it('should find closest point on partial arc within angle range', () => {
        const arc = new CompassArc()
        arc.setCenter(100, 100)
        arc.setRadius(150, 100) // radius = 50
        arc.startDrawing()
        arc.updateDrawing(100, 150) // 90 degrees
        
        const element = { type: 'arc' as const, element: arc }
        // Point at 45 degrees should project onto circle
        const closestPoint = selection.getClosestPointOnElement({ x: 135, y: 135 }, element)
        
        expect(closestPoint?.x).toBeCloseTo(135.36, 1)
        expect(closestPoint?.y).toBeCloseTo(135.36, 1)
      })

      it('should return arc endpoint when point is outside angle range', () => {
        const arc = new CompassArc()
        arc.setCenter(100, 100)
        arc.setRadius(150, 100) // radius = 50, start angle = 0
        arc.startDrawing()
        arc.updateDrawing(100, 150) // end angle = π/2
        
        const element = { type: 'arc' as const, element: arc }
        // Point at 180 degrees should return closest arc endpoint
        const closestPoint = selection.getClosestPointOnElement({ x: 50, y: 100 }, element)
        
        // Should return either start point (150, 100) or end point (100, 150)
        const distToStart = Math.sqrt((closestPoint!.x - 150) ** 2 + (closestPoint!.y - 100) ** 2)
        const distToEnd = Math.sqrt((closestPoint!.x - 100) ** 2 + (closestPoint!.y - 150) ** 2)
        
        expect(Math.min(distToStart, distToEnd)).toBe(0) // One of them should be exactly 0
      })
    })
  })

  describe('arc angle range selection', () => {
    beforeEach(() => {
      selection = new Selection()
    })

    it('should select partial arc only when clicking within angle range', () => {
      const arc = new CompassArc()
      arc.setCenter(100, 100)
      arc.setRadius(150, 100) // radius = 50, start at 0 degrees
      arc.startDrawing()
      arc.updateDrawing(100, 150) // end at 90 degrees
      
      // Point within angle range (45 degrees) should be selectable
      const distanceWithin = selection.calculateDistanceToArc({ x: 135, y: 135 }, arc)
      expect(distanceWithin).toBeLessThan(10) // Should be close to circle
      
      // Point outside angle range (180 degrees) should be farther
      const distanceOutside = selection.calculateDistanceToArc({ x: 50, y: 100 }, arc)
      expect(distanceOutside).toBeGreaterThan(30) // Should be distance to arc endpoint
    })

    it('should handle arc crossing angle boundary', () => {
      const arc = new CompassArc()
      arc.setCenter(100, 100)
      arc.setRadius(50, 100) // radius = 50, start at 180 degrees (-π)
      arc.startDrawing()
      arc.updateDrawing(150, 100) // end at 0 degrees, crossing boundary
      
      // Point at -90 degrees should be within range
      const distanceWithin = selection.calculateDistanceToArc({ x: 100, y: 50 }, arc)
      expect(distanceWithin).toBeLessThan(10)
      
      // Point at 90 degrees should be outside range
      const distanceOutside = selection.calculateDistanceToArc({ x: 100, y: 150 }, arc)
      expect(distanceOutside).toBeGreaterThan(30)
    })
  })
})