import { Line } from './line.js'
import { CompassArc } from './compassArc.js'

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
    
    if (!centerPoint) {
      return Infinity
    }
    
    // Allow selection of completed arcs (state IDLE) and current arcs
    if (arc.getState() !== 'DRAWING' && arc.getState() !== 'RADIUS_SET' && arc.getState() !== 'IDLE') {
      return Infinity
    }

    const radius = arc.getRadius()
    const distanceFromCenter = this.calculateDistance(point, centerPoint)
    
    // For full circles or RADIUS_SET state, just use circle distance
    if (arc.getState() === 'RADIUS_SET' || arc.isFullCircle()) {
      return Math.abs(distanceFromCenter - radius)
    }

    // For partial arcs, check if point is within the arc's angle range using accumulated angle
    const pointAngle = Math.atan2(point.y - centerPoint.y, point.x - centerPoint.x)
    const startAngle = arc.getStartAngle()
    const totalAngle = arc.getTotalAngle()
    
    if (this.isPointInAccumulatedArcRange(pointAngle, startAngle, totalAngle)) {
      // Point is within arc range, return distance to circle
      return Math.abs(distanceFromCenter - radius)
    } else {
      // Point is outside arc range, return distance to nearest arc endpoint
      const endAngle = startAngle + totalAngle
      const startPointX = centerPoint.x + radius * Math.cos(startAngle)
      const startPointY = centerPoint.y + radius * Math.sin(startAngle)
      const endPointX = centerPoint.x + radius * Math.cos(endAngle)
      const endPointY = centerPoint.y + radius * Math.sin(endAngle)
      
      const distToStart = this.calculateDistance(point, { x: startPointX, y: startPointY })
      const distToEnd = this.calculateDistance(point, { x: endPointX, y: endPointY })
      
      return Math.min(distToStart, distToEnd)
    }
  }

  private normalizeAngle(angle: number): number {
    // Normalize angle to (-π, π]
    while (angle <= -Math.PI) {
      angle += 2 * Math.PI
    }
    while (angle > Math.PI) {
      angle -= 2 * Math.PI
    }
    return angle
  }

  private isAngleInRange(angle: number, startAngle: number, endAngle: number): boolean {
    // Handle case where arc crosses the -π/π boundary
    if (startAngle <= endAngle) {
      // Normal case: arc doesn't cross boundary
      return angle >= startAngle && angle <= endAngle
    } else {
      // Arc crosses boundary: angle is in range if it's >= start OR <= end
      return angle >= startAngle || angle <= endAngle
    }
  }

  private isPointInAccumulatedArcRange(pointAngle: number, startAngle: number, totalAngle: number): boolean {
    if (Math.abs(totalAngle) >= 2 * Math.PI - 0.1) {
      // Nearly full circle or more
      return true
    }

    // Calculate the angular difference from start to point
    let angleDiff = pointAngle - startAngle
    
    // Normalize the difference to handle boundary crossings
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
    while (angleDiff <= -Math.PI) angleDiff += 2 * Math.PI
    
    // Check if the point is within the arc range considering direction
    if (totalAngle >= 0) {
      // Counter-clockwise arc
      return angleDiff >= 0 && angleDiff <= totalAngle
    } else {
      // Clockwise arc
      return angleDiff <= 0 && angleDiff >= totalAngle
    }
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

  getClosestPointOnElement(point: Point, element: SelectableElement): Point | null {
    if (element.type === 'line') {
      return this.getClosestPointOnLine(point, element.element)
    } else if (element.type === 'arc') {
      return this.getClosestPointOnArc(point, element.element)
    }
    return null
  }

  private getClosestPointOnLine(point: Point, line: Line): Point | null {
    const firstPoint = line.getFirstPoint()
    const secondPoint = line.getSecondPoint()
    
    if (!firstPoint || !secondPoint) {
      return null
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
      return firstPoint
    }

    // Project point vector onto segment vector
    const projectionParameter = (pointVector.x * segmentVector.x + pointVector.y * segmentVector.y) / segmentLengthSquared
    
    // Clamp projection parameter to [0, 1] to stay within line segment
    const clampedParameter = Math.max(0, Math.min(1, projectionParameter))
    
    // Find closest point on line segment
    return {
      x: firstPoint.x + clampedParameter * segmentVector.x,
      y: firstPoint.y + clampedParameter * segmentVector.y
    }
  }

  private getClosestPointOnArc(point: Point, arc: CompassArc): Point | null {
    const centerPoint = arc.getCenterPoint()
    
    if (!centerPoint) {
      return null
    }
    
    // Allow selection of completed arcs (state IDLE) and current arcs
    if (arc.getState() !== 'DRAWING' && arc.getState() !== 'RADIUS_SET' && arc.getState() !== 'IDLE') {
      return null
    }

    const radius = arc.getRadius()
    const dx = point.x - centerPoint.x
    const dy = point.y - centerPoint.y
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)

    if (distanceFromCenter === 0) {
      // Point is at center, return any point on the circle
      return { x: centerPoint.x + radius, y: centerPoint.y }
    }

    const pointAngle = Math.atan2(dy, dx)

    // For full circles or RADIUS_SET state, just project onto circle
    if (arc.getState() === 'RADIUS_SET' || arc.isFullCircle()) {
      const normalizedX = dx / distanceFromCenter
      const normalizedY = dy / distanceFromCenter
      
      return {
        x: centerPoint.x + normalizedX * radius,
        y: centerPoint.y + normalizedY * radius
      }
    }

    // For partial arcs, find closest point considering accumulated angle range
    const startAngle = arc.getStartAngle()
    const totalAngle = arc.getTotalAngle()
    
    if (this.isPointInAccumulatedArcRange(pointAngle, startAngle, totalAngle)) {
      // Point angle is within arc range, project onto circle
      const normalizedX = dx / distanceFromCenter
      const normalizedY = dy / distanceFromCenter
      
      return {
        x: centerPoint.x + normalizedX * radius,
        y: centerPoint.y + normalizedY * radius
      }
    } else {
      // Point angle is outside arc range, return closest arc endpoint
      const endAngle = startAngle + totalAngle
      const startPointX = centerPoint.x + radius * Math.cos(startAngle)
      const startPointY = centerPoint.y + radius * Math.sin(startAngle)
      const endPointX = centerPoint.x + radius * Math.cos(endAngle)
      const endPointY = centerPoint.y + radius * Math.sin(endAngle)
      
      const distToStart = this.calculateDistance(point, { x: startPointX, y: startPointY })
      const distToEnd = this.calculateDistance(point, { x: endPointX, y: endPointY })
      
      if (distToStart <= distToEnd) {
        return { x: startPointX, y: startPointY }
      } else {
        return { x: endPointX, y: endPointY }
      }
    }
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
    
    if (!centerPoint) {
      return
    }
    
    // Allow highlighting completed arcs (state IDLE) and current arcs
    if (arc.getState() !== 'DRAWING' && arc.getState() !== 'RADIUS_SET' && arc.getState() !== 'IDLE') {
      return
    }

    const radius = arc.getRadius()
    
    if (arc.getState() === 'RADIUS_SET') {
      // Just highlight the circle for radius set state
      p.circle(centerPoint.x, centerPoint.y, radius * 2)
    } else if (arc.getState() === 'DRAWING' || arc.getState() === 'IDLE') {
      const startAngle = arc.getStartAngle()
      const totalAngle = arc.getTotalAngle()
      
      if (arc.isFullCircle()) {
        p.circle(centerPoint.x, centerPoint.y, radius * 2)
      } else {
        // Use the same segmentation logic as in the drawing for >180° arcs
        const endAngle = startAngle + totalAngle
        if (Math.abs(totalAngle) > Math.PI) {
          // Split into segments for p5.js arc() limitations
          const segments = Math.ceil(Math.abs(totalAngle) / Math.PI)
          const segmentAngle = totalAngle / segments
          
          for (let i = 0; i < segments; i++) {
            const segStart = startAngle + i * segmentAngle
            const segEnd = startAngle + (i + 1) * segmentAngle
            p.arc(centerPoint.x, centerPoint.y, radius * 2, radius * 2, segStart, segEnd)
          }
        } else {
          p.arc(centerPoint.x, centerPoint.y, radius * 2, radius * 2, startAngle, endAngle)
        }
      }
    }
  }
}