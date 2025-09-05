export interface Color {
  r: number
  g: number  
  b: number
}

export interface Point {
  x: number
  y: number
}

export interface P5Instance {
  width: number
  height: number
  pixels: Uint8ClampedArray
  loadPixels(): void
  updatePixels(): void
  get(x: number, y: number): number[]
  set(x: number, y: number, color: number[]): void
}

export class Fill {
  private fillColor: Color = { r: 0, g: 0, b: 0 }
  private lastFillLocation: Point | null = null

  constructor() {}

  getFillColor(): Color {
    return { ...this.fillColor }
  }

  setFillColor(color: Color): void {
    this.fillColor = {
      r: Math.max(0, Math.min(255, color.r)),
      g: Math.max(0, Math.min(255, color.g)),
      b: Math.max(0, Math.min(255, color.b))
    }
  }

  isPointInRegion(p: P5Instance, x: number, y: number): boolean {
    if (x < 0 || x >= p.width || y < 0 || y >= p.height) {
      return false
    }
    
    // For now, consider any white background pixel as a valid region
    const pixelColor = p.get(x, y)
    return pixelColor[0] === 255 && pixelColor[1] === 255 && pixelColor[2] === 255
  }

  canFillPixel(p: P5Instance, x: number, y: number): boolean {
    if (x < 0 || x >= p.width || y < 0 || y >= p.height) {
      return false
    }
    
    const pixelColor = p.get(x, y)
    // Can fill if it's white background (not already filled or boundary)
    return pixelColor[0] === 255 && pixelColor[1] === 255 && pixelColor[2] === 255
  }

  floodFill(p: P5Instance, startX: number, startY: number): void {
    if (startX < 0 || startX >= p.width || startY < 0 || startY >= p.height) {
      return
    }

    const startColor = p.get(startX, startY)
    const targetColor = [this.fillColor.r, this.fillColor.g, this.fillColor.b, 255]
    
    // Don't fill if already target color
    if (startColor[0] === targetColor[0] && 
        startColor[1] === targetColor[1] && 
        startColor[2] === targetColor[2]) {
      return
    }

    p.loadPixels()
    
    // Simple flood fill implementation using queue
    const queue: Point[] = [{ x: startX, y: startY }]
    const visited = new Set<string>()
    
    while (queue.length > 0) {
      const current = queue.shift()!
      const key = `${current.x},${current.y}`
      
      if (visited.has(key)) continue
      if (current.x < 0 || current.x >= p.width || current.y < 0 || current.y >= p.height) continue
      
      const currentColor = p.get(current.x, current.y)
      
      // Check if this pixel matches the original color and can be filled
      if (currentColor[0] !== startColor[0] || 
          currentColor[1] !== startColor[1] || 
          currentColor[2] !== startColor[2]) {
        continue
      }
      
      visited.add(key)
      p.set(current.x, current.y, targetColor)
      
      // Add neighboring pixels to queue
      queue.push({ x: current.x + 1, y: current.y })
      queue.push({ x: current.x - 1, y: current.y })
      queue.push({ x: current.x, y: current.y + 1 })
      queue.push({ x: current.x, y: current.y - 1 })
    }
    
    p.updatePixels()
  }

  handleClick(p: P5Instance, mouseX: number, mouseY: number): void {
    if (mouseX < 0 || mouseX >= p.width || mouseY < 0 || mouseY >= p.height) {
      return
    }
    
    this.lastFillLocation = { x: mouseX, y: mouseY }
    this.floodFill(p, mouseX, mouseY)
  }

  getLastFillLocation(): Point | null {
    return this.lastFillLocation ? { ...this.lastFillLocation } : null
  }
}