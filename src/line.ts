export type Point = { x: number; y: number }
export type LineState = 'IDLE' | 'FIRST_POINT' | 'DRAWING'

interface P5DrawingContext {
  push(): void;
  pop(): void;
  noFill(): void;
  stroke(r: number, g?: number, b?: number): void;
  strokeWeight(weight: number): void;
  point(x: number, y: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
}

export class Line {
  private firstPoint: Point | null = null
  private secondPoint: Point | null = null
  private state: LineState = 'IDLE'

  getFirstPoint(): Point | null {
    return this.firstPoint
  }

  getSecondPoint(): Point | null {
    return this.secondPoint
  }

  getState(): LineState {
    return this.state
  }

  setFirstPoint(x: number, y: number): void {
    this.firstPoint = { x, y }
    this.secondPoint = null
    this.state = 'FIRST_POINT'
  }

  setSecondPoint(x: number, y: number): void {
    if (!this.firstPoint) {
      throw new Error('First point must be set before setting second point')
    }
    this.secondPoint = { x, y }
    this.state = 'DRAWING'
  }

  getLength(): number {
    if (!this.firstPoint || !this.secondPoint) {
      return 0
    }
    const dx = this.secondPoint.x - this.firstPoint.x
    const dy = this.secondPoint.y - this.firstPoint.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  getAngle(): number {
    if (!this.firstPoint || !this.secondPoint) {
      return 0
    }
    const dx = this.secondPoint.x - this.firstPoint.x
    const dy = this.secondPoint.y - this.firstPoint.y
    return Math.atan2(dy, dx)
  }

  draw(p: P5DrawingContext): void {
    if (!this.firstPoint) {
      return
    }

    p.push()
    p.noFill()
    p.stroke(0, 0, 0)
    p.strokeWeight(2)

    if (this.secondPoint) {
      p.line(this.firstPoint.x, this.firstPoint.y, this.secondPoint.x, this.secondPoint.y)
    } else {
      p.point(this.firstPoint.x, this.firstPoint.y)
    }

    p.pop()
  }

  // Serialization methods for localStorage persistence
  toJSON(): {
    firstPoint: Point | null
    secondPoint: Point | null
    state: LineState
  } {
    return {
      firstPoint: this.firstPoint,
      secondPoint: this.secondPoint,
      state: this.state
    }
  }

  static fromJSON(data: {
    firstPoint?: Point | null
    secondPoint?: Point | null
    state?: LineState
  }): Line {
    const line = new Line()
    // Use any cast for deserialization as it's a controlled internal operation
    const linePrivate = line as unknown as {
      firstPoint: Point | null
      secondPoint: Point | null
      state: LineState
    }
    linePrivate.firstPoint = data.firstPoint || null
    linePrivate.secondPoint = data.secondPoint || null
    linePrivate.state = data.state || 'IDLE'
    return line
  }
}