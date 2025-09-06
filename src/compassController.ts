import { CompassArc, Point } from './compassArc'
import { CompassRadiusState } from './compassRadiusState'
import { CompassRadiusPersistence } from './compassRadiusPersistence'

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

interface MouseEvent {
  shiftKey: boolean;
}

export type CompassControllerState = 'IDLE' | 'CENTER_SET' | 'DRAWING' | 'SETTING_RADIUS'

export class CompassController {
  private compassArc: CompassArc
  private radiusState: CompassRadiusState
  private persistence: CompassRadiusPersistence
  private currentMouseX: number = 0
  private currentMouseY: number = 0

  constructor() {
    this.compassArc = new CompassArc()
    this.persistence = new CompassRadiusPersistence()
    
    // Load radius from localStorage or use default
    const savedRadius = this.persistence.loadRadius()
    const initialRadius = savedRadius !== null ? savedRadius : 10
    this.radiusState = new CompassRadiusState(initialRadius)
  }

  getCurrentRadius(): number {
    return this.radiusState.getCurrentRadius()
  }

  getLastRadius(): number {
    return this.radiusState.getLastRadius()
  }

  setCurrentRadius(radius: number): void {
    this.radiusState.setCurrentRadius(radius)
    this.persistence.saveRadius(radius)
  }

  getCenterPoint(): Point | null {
    return this.compassArc.getCenterPoint()
  }

  getCompassCenter(): Point | null {
    return this.radiusState.getCompassCenter()
  }

  getState(): CompassControllerState {
    const radiusStateType = this.radiusState.getState()
    if (radiusStateType === 'SETTING_RADIUS') {
      return 'SETTING_RADIUS'
    }

    const arcState = this.compassArc.getState()
    switch (arcState) {
      case 'IDLE': return 'IDLE'
      case 'CENTER_SET': return 'CENTER_SET'
      case 'RADIUS_SET': return 'CENTER_SET' // Treat as center set since we use persistent radius
      case 'DRAWING': return 'DRAWING'
      default: return 'IDLE'
    }
  }

  handleClick(x: number, y: number, event: MouseEvent): void {
    this.currentMouseX = x
    this.currentMouseY = y

    if (event.shiftKey) {
      this.handleShiftClick(x, y)
    } else {
      this.handleNormalClick(x, y)
    }
  }

  handleMouseDrag(x: number, y: number): void {
    this.currentMouseX = x
    this.currentMouseY = y

    const radiusState = this.radiusState.getState()
    if (radiusState === 'SETTING_RADIUS') {
      // Update radius based on distance from compass center
      this.radiusState.updateShiftRadiusFromPoint({ x, y })
    } else {
      // Handle normal compass arc drawing
      const arcState = this.compassArc.getState()
      if (arcState === 'DRAWING') {
        this.compassArc.updateDrawing(x, y)
      }
    }
  }

  handleMouseRelease(x: number, y: number): void {
    this.currentMouseX = x
    this.currentMouseY = y

    const radiusState = this.radiusState.getState()
    if (radiusState === 'SETTING_RADIUS') {
      // Finalize radius setting
      this.radiusState.finalizeShiftOperation()
      this.persistence.saveRadius(this.radiusState.getCurrentRadius())
    }

    // Check for full circle completion in normal drawing mode
    const arcState = this.compassArc.getState()
    if (arcState === 'DRAWING' && this.compassArc.isFullCircle()) {
      this.reset()
    }
  }

  handleKeyPress(key: string): void {
    if (key === 'Escape') {
      this.cancelCurrentOperation()
    }
  }

  handleRightClick(): void {
    this.cancelCurrentOperation()
  }

  draw(p: P5DrawingContext): void {
    const radiusState = this.radiusState.getState()
    
    if (radiusState === 'SETTING_RADIUS') {
      this.drawRadiusSetting(p)
    } else {
      this.drawNormalCompass(p)
    }
  }

  reset(): void {
    this.compassArc.reset()
    // Don't reset radius state - preserve current radius
  }

  getCompassArc(): CompassArc {
    return this.compassArc
  }

  private handleShiftClick(x: number, y: number): void {
    const radiusState = this.radiusState.getState()
    
    if (radiusState === 'IDLE') {
      // Start radius setting operation
      this.radiusState.startShiftOperation({ x, y })
    } else {
      // Cancel ongoing operation
      this.cancelCurrentOperation()
    }
  }

  private handleNormalClick(x: number, y: number): void {
    const arcState = this.compassArc.getState()
    
    switch (arcState) {
      case 'IDLE':
        // Set center point
        this.compassArc.setCenter(x, y)
        break
        
      case 'CENTER_SET':
        // Use current radius to calculate radius point, then start drawing
        this.setRadiusFromCurrent(x, y)
        this.compassArc.startDrawing()
        break
        
      case 'DRAWING':
        // Complete current drawing and start new one
        this.reset()
        this.compassArc.setCenter(x, y)
        break
        
      default:
        break
    }
  }

  private setRadiusFromCurrent(clickX: number, clickY: number): void {
    const center = this.compassArc.getCenterPoint()
    if (!center) return

    const currentRadius = this.radiusState.getCurrentRadius()
    
    // Calculate direction from center to click point
    const dx = clickX - center.x
    const dy = clickY - center.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance === 0) {
      // If clicked on center, use default direction (right)
      this.compassArc.setRadius(center.x + currentRadius, center.y)
    } else {
      // Scale the direction to match current radius
      const scale = currentRadius / distance
      const radiusX = center.x + dx * scale
      const radiusY = center.y + dy * scale
      this.compassArc.setRadius(radiusX, radiusY)
    }
  }

  private drawRadiusSetting(p: P5DrawingContext): void {
    const compassCenter = this.radiusState.getCompassCenter()
    if (!compassCenter) return

    p.push()
    p.noFill()
    p.stroke(0, 150, 255) // Blue color for radius setting mode
    p.strokeWeight(2)

    // Draw center point
    p.point(compassCenter.x, compassCenter.y)
    
    // Draw radius line to current mouse position
    p.line(compassCenter.x, compassCenter.y, this.currentMouseX, this.currentMouseY)
    
    // Draw preview circle with current radius
    const currentRadius = this.radiusState.getCurrentRadius()
    p.circle(compassCenter.x, compassCenter.y, currentRadius * 2)
    
    p.pop()
  }

  private drawNormalCompass(p: P5DrawingContext): void {
    // Use the existing CompassArc drawing logic
    this.compassArc.draw(p)
  }

  private cancelCurrentOperation(): void {
    const radiusState = this.radiusState.getState()
    
    if (radiusState === 'SETTING_RADIUS') {
      this.radiusState.cancelShiftOperation()
    } else {
      // Cancel normal compass operation
      this.reset()
    }
  }
}