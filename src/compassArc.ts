export type Point = { x: number; y: number }
export type ArcState = 'IDLE' | 'CENTER_SET' | 'RADIUS_SET' | 'DRAWING'

const FULL_CIRCLE_EPS = 0.1
const MIN_RADIUS = 0.001

interface P5DrawingContext {
  push(): void;
  pop(): void;
  noFill(): void;
  stroke(r: number, g?: number, b?: number): void;
  strokeWeight(weight: number): void;
  point(x: number, y: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  circle(x: number, y: number, d: number): void;
  arc(x: number, y: number, w: number, h: number, start: number, stop: number): void;
}

export class CompassArc {
  private centerPoint: Point | null = null
  private radiusPoint: Point | null = null
  private currentPoint: Point | null = null
  private state: ArcState = 'IDLE'
  private lastAngle: number | null = null
  private accumulatedAngle = 0

  getCenterPoint(): Point | null {
    return this.centerPoint
  }

  getRadiusPoint(): Point | null {
    return this.radiusPoint
  }

  getCurrentPoint(): Point | null {
    return this.currentPoint
  }

  getState(): ArcState {
    return this.state
  }

  setCenter(x: number, y: number): void {
    this.centerPoint = { x, y }
    this.radiusPoint = null
    this.currentPoint = null
    this.state = 'CENTER_SET'
    this.resetAngleTracking()
  }

  setRadius(x: number, y: number): void {
    if (!this.centerPoint) {
      throw new Error('Center point must be set before setting radius')
    }
    this.radiusPoint = { x, y }
    this.state = 'RADIUS_SET'
  }

  startDrawing(): void {
    if (this.state !== 'RADIUS_SET') {
      throw new Error('Radius must be set before drawing')
    }
    this.state = 'DRAWING'
    this.resetAngleTracking()
  }

  updateDrawing(x: number, y: number): void {
    if (this.state !== 'DRAWING') {
      throw new Error('Must start drawing before updating')
    }
    this.currentPoint = { x, y }
    this.accumulateAngle()
  }

  getRadius(): number {
    if (!this.centerPoint || !this.radiusPoint) {
      return 0
    }
    const dx = this.radiusPoint.x - this.centerPoint.x
    const dy = this.radiusPoint.y - this.centerPoint.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private calculateAngle(point: Point): number {
    if (!this.centerPoint) {
      return 0
    }
    return Math.atan2(point.y - this.centerPoint.y, point.x - this.centerPoint.x)
  }

  getStartAngle(): number {
    if (!this.centerPoint || !this.radiusPoint) {
      return 0
    }
    return this.calculateAngle(this.radiusPoint)
  }

  getEndAngle(): number {
    if (!this.centerPoint || !this.currentPoint) {
      return 0
    }
    return this.calculateAngle(this.currentPoint)
  }

  getTotalAngle(): number {
    return this.accumulatedAngle
  }

  // Copy the state from another CompassArc instance
  copyFrom(other: CompassArc): void {
    this.centerPoint = other.centerPoint ? { ...other.centerPoint } : null
    this.radiusPoint = other.radiusPoint ? { ...other.radiusPoint } : null
    this.currentPoint = other.currentPoint ? { ...other.currentPoint } : null
    this.state = other.state
    this.lastAngle = other.lastAngle
    this.accumulatedAngle = other.accumulatedAngle
  }

  isFullCircle(): boolean {
    if (this.state !== 'DRAWING') {
      return false
    }
    
    const totalAngle = Math.abs(this.getTotalAngle())
    
    return totalAngle >= (2 * Math.PI - FULL_CIRCLE_EPS)
  }

  draw(p: P5DrawingContext): void {
    if (!this.centerPoint) return

    p.push()
    p.noFill()
    p.stroke(0, 0, 0)
    p.strokeWeight(2)

    if (this.state === 'CENTER_SET') {
      p.point(this.centerPoint.x, this.centerPoint.y)
    } else if (this.state === 'RADIUS_SET' && this.radiusPoint) {
      p.point(this.centerPoint.x, this.centerPoint.y)
    } else if (this.state === 'DRAWING' && this.radiusPoint && this.currentPoint) {
      const radius = this.getRadius()
      const startAngle = this.getStartAngle()
      const totalAngle = this.getTotalAngle()
      
      console.log('🎯 Arc Drawing Debug:')
      console.log('  startAngle:', startAngle * 180 / Math.PI, '度')
      console.log('  totalAngle:', totalAngle * 180 / Math.PI, '度')
      console.log('  totalAngle >= 0:', totalAngle >= 0)
      
      if (this.isFullCircle()) {
        console.log('  → Full circle detected')
        p.circle(this.centerPoint.x, this.centerPoint.y, radius * 2)
      } else {
        // Draw arc based on actual accumulated angle (preserving direction and magnitude)
        const drawStartAngle = startAngle
        const drawEndAngle = startAngle + totalAngle
        
        console.log('  totalAngle:', totalAngle * 180 / Math.PI, '度')
        console.log('  drawStartAngle:', drawStartAngle * 180 / Math.PI, '度')
        console.log('  drawEndAngle:', drawEndAngle * 180 / Math.PI, '度')
        console.log('  → Drawing arc from', drawStartAngle * 180 / Math.PI, 'to', drawEndAngle * 180 / Math.PI)
        
        // For p5.js, draw arc following the actual mouse movement direction
        // For arcs > 180°, split into multiple smaller arcs
        const absTotalAngle = Math.abs(totalAngle)
        
        if (absTotalAngle <= Math.PI) {
          // For arcs <= 180°, use normal arc drawing
          if (totalAngle >= 0) {
            p.arc(this.centerPoint.x, this.centerPoint.y, radius * 2, radius * 2, drawStartAngle, drawEndAngle)
          } else {
            p.arc(this.centerPoint.x, this.centerPoint.y, radius * 2, radius * 2, drawEndAngle, drawStartAngle)
          }
        } else {
          // For arcs > 180°, split into multiple arcs of ~π radians each
          const maxSegmentAngle = Math.PI * 0.99 // Slightly less than π to ensure short arcs
          const direction = totalAngle >= 0 ? 1 : -1
          let remainingAngle = absTotalAngle
          let currentStartAngle = drawStartAngle
          
          while (remainingAngle > 0) {
            const segmentAngle = Math.min(remainingAngle, maxSegmentAngle)
            const currentEndAngle = currentStartAngle + (segmentAngle * direction)
            
            console.log('  Drawing segment:', currentStartAngle * 180 / Math.PI, 'to', currentEndAngle * 180 / Math.PI, '(', segmentAngle * 180 / Math.PI, '度)')
            
            if (direction >= 0) {
              p.arc(this.centerPoint.x, this.centerPoint.y, radius * 2, radius * 2, currentStartAngle, currentEndAngle)
            } else {
              p.arc(this.centerPoint.x, this.centerPoint.y, radius * 2, radius * 2, currentEndAngle, currentStartAngle)
            }
            
            remainingAngle -= segmentAngle
            currentStartAngle = currentEndAngle
          }
        }
      }
    }

    p.pop()
  }

  reset(): void {
    this.centerPoint = null
    this.radiusPoint = null
    this.currentPoint = null
    this.state = 'IDLE'
    this.resetAngleTracking()
  }

  private resetAngleTracking(): void {
    this.lastAngle = null
    this.accumulatedAngle = 0
  }

  private accumulateAngle(): void {
    if (!this.centerPoint || !this.currentPoint || !this.radiusPoint) {
      return
    }

    const currentAngle = this.calculateAngle(this.currentPoint)
    const startAngle = this.calculateAngle(this.radiusPoint)
    
    if (this.lastAngle === null) {
      this.lastAngle = startAngle
      this.accumulatedAngle = 0
      console.log('📐 Angle accumulation reset, startAngle:', startAngle * 180 / Math.PI, '度')
    }

    let delta = currentAngle - this.lastAngle

    console.log('📐 Angle calculation:')
    console.log('  currentAngle:', currentAngle * 180 / Math.PI, '度')
    console.log('  lastAngle:', this.lastAngle * 180 / Math.PI, '度')
    console.log('  raw delta:', delta * 180 / Math.PI, '度')

    while (delta <= -Math.PI) {
      delta += 2 * Math.PI
    }
    while (delta > Math.PI) {
      delta -= 2 * Math.PI
    }

    console.log('  normalized delta:', delta * 180 / Math.PI, '度')
    this.accumulatedAngle += delta
    console.log('  accumulatedAngle:', this.accumulatedAngle * 180 / Math.PI, '度')
    this.lastAngle = currentAngle
  }

  static getFullCircleThreshold(): number {
    return FULL_CIRCLE_EPS
  }

  static getMinRadius(): number {
    return MIN_RADIUS
  }
}