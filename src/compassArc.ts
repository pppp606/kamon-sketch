export type Point = { x: number; y: number }
export type ArcState = 'IDLE' | 'CENTER_SET' | 'RADIUS_SET' | 'DRAWING'

interface P5DrawingContext {
  push(): void;
  pop(): void;
  noFill(): void;
  stroke(color: number): void;
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

  getCenterPoint(): Point | null {
    return this.centerPoint
  }

  getRadiusPoint(): Point | null {
    return this.radiusPoint
  }

  getState(): ArcState {
    return this.state
  }

  setCenter(x: number, y: number): void {
    this.centerPoint = { x, y }
    this.radiusPoint = null
    this.currentPoint = null
    this.state = 'CENTER_SET'
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
  }

  updateDrawing(x: number, y: number): void {
    if (this.state !== 'DRAWING') {
      throw new Error('Must start drawing before updating')
    }
    this.currentPoint = { x, y }
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
    if (this.state !== 'DRAWING' || !this.centerPoint || !this.radiusPoint || !this.currentPoint) {
      return 0
    }
    
    const startAngle = this.getStartAngle()
    const endAngle = this.getEndAngle()
    
    let totalAngle = endAngle - startAngle
    
    if (totalAngle < 0) {
      totalAngle += 2 * Math.PI
    }
    
    return totalAngle
  }

  isFullCircle(): boolean {
    if (this.state !== 'DRAWING') {
      return false
    }
    
    const totalAngle = this.getTotalAngle()
    const threshold = 0.1
    
    return Math.abs(totalAngle - 2 * Math.PI) < threshold
  }

  draw(p: P5DrawingContext): void {
    if (!this.centerPoint) return

    p.push()
    p.noFill()
    p.stroke(0)
    p.strokeWeight(2)

    if (this.state === 'CENTER_SET') {
      p.point(this.centerPoint.x, this.centerPoint.y)
    } else if (this.state === 'RADIUS_SET' && this.radiusPoint) {
      p.point(this.centerPoint.x, this.centerPoint.y)
      p.line(this.centerPoint.x, this.centerPoint.y, this.radiusPoint.x, this.radiusPoint.y)
      p.circle(this.centerPoint.x, this.centerPoint.y, this.getRadius() * 2)
    } else if (this.state === 'DRAWING' && this.radiusPoint && this.currentPoint) {
      const radius = this.getRadius()
      const startAngle = this.getStartAngle()
      const endAngle = this.getEndAngle()
      
      if (this.isFullCircle()) {
        p.circle(this.centerPoint.x, this.centerPoint.y, radius * 2)
      } else {
        p.arc(this.centerPoint.x, this.centerPoint.y, radius * 2, radius * 2, startAngle, endAngle)
      }
    }

    p.pop()
  }

  reset(): void {
    this.centerPoint = null
    this.radiusPoint = null
    this.currentPoint = null
    this.state = 'IDLE'
  }
}