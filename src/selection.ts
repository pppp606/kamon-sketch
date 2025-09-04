import { Line } from './line'
import { CompassArc } from './compassArc'

export type Point = { x: number; y: number }

export type SelectableElement = 
  | { type: 'line'; element: Line }
  | { type: 'arc'; element: CompassArc }

export type HighlightColor = { r: number; g: number; b: number }

interface P5DrawingContext {
  push(): void;
  pop(): void;
  noFill(): void;
  stroke(r: number, g?: number, b?: number): void;
  strokeWeight(weight: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  arc(x: number, y: number, w: number, h: number, start: number, stop: number): void;
  circle(x: number, y: number, d: number): void;
}

export class Selection {
  private selectedElement: SelectableElement | null = null

  getSelectedElement(): SelectableElement | null {
    return this.selectedElement
  }

  setSelectedElement(element: SelectableElement | null): void {
    this.selectedElement = element
  }

  isSelected(element: SelectableElement): boolean {
    if (!this.selectedElement) {
      return false
    }
    
    return this.selectedElement.type === element.type && 
           this.selectedElement.element === element.element
  }

  calculateDistanceToLine(point: Point, line: Line): number {
    const firstPoint = line.getFirstPoint()
    const secondPoint = line.getSecondPoint()
    
    if (!firstPoint || !secondPoint) {
      return Infinity
    }

    // Vector from first to second point (line segment vector)
    const segmentVector = {
      x: secondPoint.x - firstPoint.x,
      y: secondPoint.y - firstPoint.y
    }

    // Vector from first point to test point
    const pointVector = {
      x: point.x - firstPoint.x,
      y: point.y - firstPoint.y
    }

    const segmentLengthSquared = segmentVector.x * segmentVector.x + segmentVector.y * segmentVector.y
    
    if (segmentLengthSquared === 0) {
      // Line segment is actually a point
      return this.calculateDistance(point, firstPoint)
    }

    // Project point vector onto segment vector
    const projectionParameter = (pointVector.x * segmentVector.x + pointVector.y * segmentVector.y) / segmentLengthSquared
    
    // Clamp projection parameter to [0, 1] to stay within line segment
    const clampedParameter = Math.max(0, Math.min(1, projectionParameter))
    
    // Find closest point on line segment
    const closestPoint = {
      x: firstPoint.x + clampedParameter * segmentVector.x,
      y: firstPoint.y + clampedParameter * segmentVector.y
    }
    
    return this.calculateDistance(point, closestPoint)
  }

  private calculateDistance(point1: Point, point2: Point): number {
    const dx = point1.x - point2.x
    const dy = point1.y - point2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  calculateDistanceToArc(point: Point, arc: CompassArc): number {
    const centerPoint = arc.getCenterPoint()
    
    if (!centerPoint || (arc.getState() !== 'DRAWING' && arc.getState() !== 'RADIUS_SET')) {
      return Infinity
    }

    const radius = arc.getRadius()
    const distanceFromCenter = this.calculateDistance(point, centerPoint)

    // Distance from point to the arc circle boundary
    return Math.abs(distanceFromCenter - radius)
  }

  findClosestElement(point: Point, elements: SelectableElement[]): SelectableElement | null {
    if (elements.length === 0) {
      return null
    }

    let closestElement: SelectableElement | null = null
    let closestDistance = Infinity

    for (const element of elements) {
      let distance: number

      if (element.type === 'line') {
        distance = this.calculateDistanceToLine(point, element.element)
      } else if (element.type === 'arc') {
        distance = this.calculateDistanceToArc(point, element.element)
      } else {
        continue
      }

      if (distance < closestDistance) {
        closestDistance = distance
        closestElement = element
      }
    }

    return closestElement
  }

  drawHighlight(
    p: P5DrawingContext, 
    color: HighlightColor = { r: 255, g: 0, b: 0 }, 
    strokeWeight = 4
  ): void {
    if (!this.selectedElement) {
      return
    }

    p.push()
    p.noFill()
    p.stroke(color.r, color.g, color.b)
    p.strokeWeight(strokeWeight)

    if (this.selectedElement.type === 'line') {
      this.drawLineHighlight(p, this.selectedElement.element)
    } else if (this.selectedElement.type === 'arc') {
      this.drawArcHighlight(p, this.selectedElement.element)
    }

    p.pop()
  }

  private drawLineHighlight(p: P5DrawingContext, line: Line): void {
    const firstPoint = line.getFirstPoint()
    const secondPoint = line.getSecondPoint()
    
    if (firstPoint && secondPoint) {
      p.line(firstPoint.x, firstPoint.y, secondPoint.x, secondPoint.y)
    }
  }

  private drawArcHighlight(p: P5DrawingContext, arc: CompassArc): void {
    const centerPoint = arc.getCenterPoint()
    
    if (!centerPoint || (arc.getState() !== 'DRAWING' && arc.getState() !== 'RADIUS_SET')) {
      return
    }

    const radius = arc.getRadius()
    
    if (arc.getState() === 'RADIUS_SET') {
      // Just highlight the circle for radius set state
      p.circle(centerPoint.x, centerPoint.y, radius * 2)
    } else if (arc.getState() === 'DRAWING') {
      const startAngle = arc.getStartAngle()
      const endAngle = arc.getEndAngle()
      
      if (arc.isFullCircle()) {
        p.circle(centerPoint.x, centerPoint.y, radius * 2)
      } else {
        p.arc(centerPoint.x, centerPoint.y, radius * 2, radius * 2, startAngle, endAngle)
      }
    }
  }
}