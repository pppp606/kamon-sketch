import { Line } from './line'
import { CompassArc } from './compassArc'

export interface WorldCoordinateConverter {
  pixelsToWorld: (pixels: number) => number
  worldToPixels: (worlds: number) => number
}

export interface RadiusState {
  currentRadius: number
  lastRadius: number
}

export class CompassRadiusState {
  private static readonly MIN_RADIUS_PX = 1
  private static readonly MAX_RADIUS_PX = 10000
  
  private currentRadius: number
  private lastRadius: number
  private worldConverter?: WorldCoordinateConverter
  private storageKey: string
  private readonly defaultRadius: number

  constructor(
    worldConverter?: WorldCoordinateConverter,
    defaultRadius: number = 50,
    storageKey: string = 'compassRadiusState'
  ) {
    this.worldConverter = worldConverter
    this.storageKey = storageKey
    this.defaultRadius = defaultRadius
    
    // Load from localStorage or use defaults
    const savedState = this.loadFromStorage()
    if (savedState) {
      this.currentRadius = this.clampRadius(savedState.currentRadius)
      this.lastRadius = this.clampRadius(savedState.lastRadius)
    } else {
      this.currentRadius = this.clampRadius(this.defaultRadius)
      this.lastRadius = this.currentRadius
    }
  }

  getCurrentRadius(): number {
    return this.currentRadius
  }

  getLastRadius(): number {
    return this.lastRadius
  }

  getCurrentRadiusWorld(): number {
    if (!this.worldConverter) {
      return this.currentRadius
    }
    
    try {
      return this.worldConverter.pixelsToWorld(this.currentRadius)
    } catch (error) {
      // Fallback to pixel radius if conversion fails
      return this.currentRadius
    }
  }

  getLastRadiusWorld(): number {
    if (!this.worldConverter) {
      return this.lastRadius
    }
    
    try {
      return this.worldConverter.pixelsToWorld(this.lastRadius)
    } catch (error) {
      // Fallback to pixel radius if conversion fails
      return this.lastRadius
    }
  }

  updateRadius(newRadius: number): void {
    const clampedRadius = this.clampRadius(newRadius)
    
    // Move current to last
    this.lastRadius = this.currentRadius
    this.currentRadius = clampedRadius
    
    this.saveToStorage()
  }

  useLastRadius(): void {
    // Swap current and last radius
    const temp = this.currentRadius
    this.currentRadius = this.lastRadius
    this.lastRadius = temp
    
    this.saveToStorage()
  }

  setRadiusFromShape(shape: Line | CompassArc | null | undefined): void {
    if (!shape) {
      return
    }
    
    let radius = 0
    
    try {
      if (shape instanceof Line) {
        radius = this.calculateLineLength(shape)
      } else if (shape instanceof CompassArc) {
        radius = this.calculateArcRadius(shape)
      } else {
        // Unknown shape type, ignore
        return
      }
      
      const clampedRadius = this.clampRadius(radius)
      
      // Move current to last
      this.lastRadius = this.currentRadius
      this.currentRadius = clampedRadius
      
      this.saveToStorage()
    } catch (error) {
      // If shape calculation fails, maintain current state
    }
  }

  private clampRadius(radius: number): number {
    // Handle NaN
    if (isNaN(radius)) {
      return CompassRadiusState.MIN_RADIUS_PX
    }
    
    // Handle Infinity
    if (radius === Infinity) {
      return CompassRadiusState.MAX_RADIUS_PX
    }
    
    if (radius === -Infinity || radius < CompassRadiusState.MIN_RADIUS_PX) {
      return CompassRadiusState.MIN_RADIUS_PX
    }
    
    if (radius > CompassRadiusState.MAX_RADIUS_PX) {
      return CompassRadiusState.MAX_RADIUS_PX
    }
    
    return radius
  }

  private calculateLineLength(line: Line): number {
    try {
      const firstPoint = line.getFirstPoint()
      const secondPoint = line.getSecondPoint()
      
      if (!firstPoint || !secondPoint) {
        return 0
      }
      
      const dx = secondPoint.x - firstPoint.x
      const dy = secondPoint.y - firstPoint.y
      
      return Math.sqrt(dx * dx + dy * dy)
    } catch (error) {
      return 0
    }
  }

  private calculateArcRadius(arc: CompassArc): number {
    try {
      return arc.getRadius()
    } catch (error) {
      return 0
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return
      
      const state: RadiusState = {
        currentRadius: this.currentRadius,
        lastRadius: this.lastRadius
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(state))
    } catch (error) {
      // localStorage operations can fail (quota, etc.), but shouldn't break functionality
    }
  }

  private loadFromStorage(): RadiusState | null {
    try {
      if (typeof localStorage === 'undefined') return null
      
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) {
        return null
      }
      
      const parsed = JSON.parse(stored)
      
      // Validate the loaded data
      if (typeof parsed.currentRadius === 'number') {
        return {
          currentRadius: parsed.currentRadius,
          lastRadius: typeof parsed.lastRadius === 'number' ? parsed.lastRadius : this.defaultRadius
        }
      }
      
      return null
    } catch (error) {
      // If parsing fails, return null to use defaults
      return null
    }
  }
}