import { Line } from './line'
import { CompassArc } from './compassArc'

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