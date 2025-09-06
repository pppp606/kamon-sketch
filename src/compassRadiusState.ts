export type Point = { x: number; y: number }
export type CompassRadiusStateType = 'IDLE' | 'SETTING_RADIUS'

const MIN_RADIUS = 1
const MAX_RADIUS = 10000
const DEFAULT_RADIUS = 10

export class CompassRadiusState {
  private currentRadius: number
  private lastRadius: number
  private compassCenter: Point | null = null
  private state: CompassRadiusStateType = 'IDLE'

  constructor(initialRadius: number = DEFAULT_RADIUS) {
    this.currentRadius = this.clampRadius(initialRadius)
    this.lastRadius = this.currentRadius
  }

  getCurrentRadius(): number {
    return this.currentRadius
  }

  getLastRadius(): number {
    return this.lastRadius
  }

  getCompassCenter(): Point | null {
    return this.compassCenter
  }

  getState(): CompassRadiusStateType {
    return this.state
  }

  setCurrentRadius(radius: number): void {
    this.currentRadius = this.clampRadius(radius)
  }

  startShiftOperation(center: Point): void {
    this.compassCenter = { ...center }
    this.lastRadius = this.currentRadius
    this.state = 'SETTING_RADIUS'
  }

  updateShiftRadius(radius: number): void {
    this.validateShiftOperation()
    this.currentRadius = this.clampRadius(radius)
  }

  updateShiftRadiusFromPoint(point: Point): void {
    this.validateShiftOperation()
    if (!this.compassCenter) {
      throw new Error('Compass center not set')
    }
    
    const distance = this.calculateDistance(this.compassCenter, point)
    this.currentRadius = this.clampRadius(distance)
  }

  finalizeShiftOperation(): void {
    this.validateShiftOperation()
    this.compassCenter = null
    this.state = 'IDLE'
  }

  cancelShiftOperation(): void {
    this.validateShiftOperation()
    this.currentRadius = this.lastRadius
    this.compassCenter = null
    this.state = 'IDLE'
  }

  private clampRadius(radius: number): number {
    return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, radius))
  }

  private calculateDistance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private validateShiftOperation(): void {
    if (this.state !== 'SETTING_RADIUS') {
      throw new Error('Shift operation not started')
    }
  }

  static getMinRadius(): number {
    return MIN_RADIUS
  }

  static getMaxRadius(): number {
    return MAX_RADIUS
  }

  static getDefaultRadius(): number {
    return DEFAULT_RADIUS
  }
}