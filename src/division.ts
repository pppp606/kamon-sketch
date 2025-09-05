import { Line } from './line'
import { CompassArc } from './compassArc'
import { SelectableElement } from './selection'

export type Point = { x: number; y: number }

export interface DivisionPoint {
  x: number
  y: number
}

/**
 * Divides a line segment between two points into equal parts
 * @param pointA - Starting point of the line segment
 * @param pointB - Ending point of the line segment  
 * @param divisions - Number of divisions to create (must be > 0)
 * @returns Array of division points (divisions-1 points for equal segments)
 */
export function divideTwoPoints(pointA: Point, pointB: Point, divisions: number): DivisionPoint[] {
  if (divisions <= 0) {
    throw new Error('Division count must be greater than 0')
  }
  
  // For n divisions, we need n-1 division points
  const numDivisionPoints = divisions - 1
  
  if (numDivisionPoints === 0) {
    return [] // No division needed
  }
  
  const divisionPoints: DivisionPoint[] = []
  
  // Calculate the step size for each division
  const dx = (pointB.x - pointA.x) / divisions
  const dy = (pointB.y - pointA.y) / divisions
  
  // Generate division points
  for (let i = 1; i <= numDivisionPoints; i++) {
    const x = pointA.x + (dx * i)
    const y = pointA.y + (dy * i)
    divisionPoints.push({ x, y })
  }
  
  return divisionPoints
}

/**
 * Divides a line segment into equal parts
 * @param line - Line object with first and second points set
 * @param divisions - Number of divisions to create (must be > 0)
 * @returns Array of division points (divisions-1 points for equal segments)
 */
export function divideLineSegment(line: Line, divisions: number): DivisionPoint[] {
  if (divisions <= 0) {
    throw new Error('Division count must be greater than 0')
  }
  
  const firstPoint = line.getFirstPoint()
  const secondPoint = line.getSecondPoint()
  
  if (!firstPoint || !secondPoint) {
    throw new Error('Line must be completed (have both points) before division')
  }
  
  // Use our existing divideTwoPoints function
  return divideTwoPoints(firstPoint, secondPoint, divisions)
}

/**
 * Divides a compass arc radius into equal parts
 * @param arc - CompassArc object with center and radius set
 * @param divisions - Number of divisions to create (must be > 0)
 * @returns Array of division points along the radius line (divisions-1 points)
 */
export function divideRadiusPoints(arc: CompassArc, divisions: number): DivisionPoint[] {
  if (divisions <= 0) {
    throw new Error('Division count must be greater than 0')
  }
  
  const centerPoint = arc.getCenterPoint()
  const radiusPoint = arc.getRadiusPoint()
  
  if (!centerPoint || !radiusPoint) {
    throw new Error('Arc must have both center and radius set before division')
  }
  
  // Use our existing divideTwoPoints function to divide the radius line
  return divideTwoPoints(centerPoint, radiusPoint, divisions)
}

/**
 * Manages division mode state and interactions
 */
export class DivisionMode {
  private active = false
  private selectedElement: SelectableElement | null = null
  private divisions = 2 // Default to dividing into 2 parts
  private divisionPoints: DivisionPoint[] = []

  /**
   * Check if division mode is currently active
   */
  isActive(): boolean {
    return this.active
  }

  /**
   * Get the currently selected element for division
   */
  getSelectedElement(): SelectableElement | null {
    return this.selectedElement
  }

  /**
   * Get the current number of divisions
   */
  getDivisions(): number {
    return this.divisions
  }

  /**
   * Get the calculated division points
   */
  getDivisionPoints(): DivisionPoint[] {
    return [...this.divisionPoints] // Return copy to prevent mutation
  }

  /**
   * Activate division mode for the selected element
   * @param element - Line or Arc element to divide
   * @param divisions - Number of divisions (must be > 0)
   */
  activate(element: SelectableElement, divisions: number): void {
    if (divisions <= 0) {
      throw new Error('Division count must be greater than 0')
    }

    this.selectedElement = element
    this.divisions = divisions
    this.active = true
    this.calculateDivisionPoints()
  }

  /**
   * Update the number of divisions and recalculate points
   * @param divisions - New number of divisions (must be > 0)
   */
  setDivisions(divisions: number): void {
    if (divisions <= 0) {
      throw new Error('Division count must be greater than 0')
    }

    if (!this.active || !this.selectedElement) {
      return // No-op if not active
    }

    this.divisions = divisions
    this.calculateDivisionPoints()
  }

  /**
   * Deactivate division mode and clear state
   */
  deactivate(): void {
    this.active = false
    this.selectedElement = null
    this.divisionPoints = []
  }

  /**
   * Find the closest division point to a given mouse position
   * @param mousePoint - Mouse position
   * @param threshold - Maximum distance threshold for selection
   * @returns Closest division point within threshold, or null if none found
   */
  getClosestDivisionPoint(mousePoint: Point, threshold: number): DivisionPoint | null {
    if (!this.active || this.divisionPoints.length === 0) {
      return null
    }

    let closestPoint: DivisionPoint | null = null
    let closestDistance = Infinity

    for (const divisionPoint of this.divisionPoints) {
      const dx = mousePoint.x - divisionPoint.x
      const dy = mousePoint.y - divisionPoint.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= threshold && distance < closestDistance) {
        closestDistance = distance
        closestPoint = divisionPoint
      }
    }

    return closestPoint
  }

  /**
   * Calculate division points based on current element and divisions
   */
  private calculateDivisionPoints(): void {
    if (!this.selectedElement) {
      this.divisionPoints = []
      return
    }

    try {
      if (this.selectedElement.type === 'line') {
        this.divisionPoints = divideLineSegment(this.selectedElement.element, this.divisions)
      } else if (this.selectedElement.type === 'arc') {
        this.divisionPoints = divideRadiusPoints(this.selectedElement.element, this.divisions)
      } else {
        throw new Error(`Unsupported element type for division: ${this.selectedElement.type}`)
      }
    } catch (error) {
      // Re-throw with more context
      throw error
    }
  }
}