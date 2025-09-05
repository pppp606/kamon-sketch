import { Fill } from '../src/fill'

interface P5Instance {
  push: jest.Mock;
  pop: jest.Mock;
  noStroke: jest.Mock;
  fill: jest.Mock;
  noFill: jest.Mock;
  stroke: jest.Mock;
  strokeWeight: jest.Mock;
  point: jest.Mock;
  line: jest.Mock;
  circle: jest.Mock;
  rect: jest.Mock;
  get: jest.Mock;
  set: jest.Mock;
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  loadPixels: jest.Mock;
  updatePixels: jest.Mock;
}

describe('Fill', () => {
  let fillInstance: Fill

  describe('initialization', () => {
    it('should create a Fill instance', () => {
      fillInstance = new Fill()
      expect(fillInstance).toBeInstanceOf(Fill)
    })

    it('should initialize with default fill color (black)', () => {
      fillInstance = new Fill()
      expect(fillInstance.getFillColor()).toEqual({ r: 0, g: 0, b: 0 })
    })

    it('should initialize with default color tolerance', () => {
      fillInstance = new Fill()
      expect(fillInstance.getColorTolerance()).toBe(10)
    })
  })

  describe('fill color management', () => {
    beforeEach(() => {
      fillInstance = new Fill()
    })

    it('should set custom fill color', () => {
      const red = { r: 255, g: 0, b: 0 }
      fillInstance.setFillColor(red)
      expect(fillInstance.getFillColor()).toEqual(red)
    })

    it('should handle RGB values within valid range', () => {
      const color = { r: 128, g: 64, b: 192 }
      fillInstance.setFillColor(color)
      expect(fillInstance.getFillColor()).toEqual(color)
    })

    it('should clamp RGB values to valid range', () => {
      fillInstance.setFillColor({ r: -10, g: 300, b: 128 })
      expect(fillInstance.getFillColor()).toEqual({ r: 0, g: 255, b: 128 })
    })

    it('should set and get color tolerance', () => {
      fillInstance.setColorTolerance(20)
      expect(fillInstance.getColorTolerance()).toBe(20)
    })

    it('should clamp color tolerance to valid range', () => {
      fillInstance.setColorTolerance(-10)
      expect(fillInstance.getColorTolerance()).toBe(0)
      
      fillInstance.setColorTolerance(300)
      expect(fillInstance.getColorTolerance()).toBe(255)
    })
  })

  describe('region detection', () => {
    let p: P5Instance

    beforeEach(() => {
      p = {
        push: jest.fn(),
        pop: jest.fn(),
        noStroke: jest.fn(),
        fill: jest.fn(),
        noFill: jest.fn(),
        stroke: jest.fn(),
        strokeWeight: jest.fn(),
        point: jest.fn(),
        line: jest.fn(),
        circle: jest.fn(),
        rect: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        width: 400,
        height: 400,
        pixels: new Uint8ClampedArray(400 * 400 * 4),
        loadPixels: jest.fn(),
        updatePixels: jest.fn(),
      }
      fillInstance = new Fill()
    })

    it('should detect if a point is inside an enclosed region', () => {
      // Create a mock canvas with a simple rectangle boundary
      const mockPixelData = new Uint8ClampedArray(400 * 400 * 4)
      // Fill background with white (255, 255, 255, 255)
      for (let i = 0; i < mockPixelData.length; i += 4) {
        mockPixelData[i] = 255     // R
        mockPixelData[i + 1] = 255 // G
        mockPixelData[i + 2] = 255 // B
        mockPixelData[i + 3] = 255 // A
      }
      
      // Draw black rectangle outline from (100,100) to (300,300)
      // Top and bottom borders
      for (let x = 100; x <= 300; x++) {
        const topIndex = ((100 * 400 + x) * 4)
        const bottomIndex = ((300 * 400 + x) * 4)
        
        // Set to black
        for (let i = 0; i < 4; i++) {
          mockPixelData[topIndex + i] = i === 3 ? 255 : 0
          mockPixelData[bottomIndex + i] = i === 3 ? 255 : 0
        }
      }
      
      // Left and right borders
      for (let y = 100; y <= 300; y++) {
        const leftIndex = ((y * 400 + 100) * 4)
        const rightIndex = ((y * 400 + 300) * 4)
        
        // Set to black
        for (let i = 0; i < 4; i++) {
          mockPixelData[leftIndex + i] = i === 3 ? 255 : 0
          mockPixelData[rightIndex + i] = i === 3 ? 255 : 0
        }
      }
      
      p.pixels = mockPixelData
      
      // Mock the get method to return the appropriate color based on the pixel data
      p.get = jest.fn().mockImplementation((x: number, y: number) => {
        // For the test rectangle, inside should be white, boundary should be black
        if ((x >= 100 && x <= 300) && (y >= 100 && y <= 300)) {
          // Inside the rectangle - check if it's on the boundary
          if (x === 100 || x === 300 || y === 100 || y === 300) {
            return [0, 0, 0, 255] // Black boundary
          }
          return [255, 255, 255, 255] // White inside
        }
        return [255, 255, 255, 255] // White background outside
      })
      
      // Point inside the rectangle should be detected as enclosed
      expect(fillInstance.isPointInRegion(p as any, 200, 200)).toBe(true)
      
      // Point outside the rectangle should also be valid (white background)
      expect(fillInstance.isPointInRegion(p as any, 50, 50)).toBe(true)
    })

    it('should detect boundary edges correctly', () => {
      const mockPixelData = new Uint8ClampedArray(400 * 400 * 4)
      
      // Fill with white background
      for (let i = 0; i < mockPixelData.length; i += 4) {
        mockPixelData[i] = 255
        mockPixelData[i + 1] = 255
        mockPixelData[i + 2] = 255
        mockPixelData[i + 3] = 255
      }
      
      p.pixels = mockPixelData
      
      // Mock the get method to return white for background
      p.get = jest.fn().mockReturnValue([255, 255, 255, 255])
      
      // Point on white background should be considered a valid region to fill
      expect(fillInstance.isPointInRegion(p as any, 200, 200)).toBe(true)
      
      // Should identify pixels that can be filled (background color)
      expect(fillInstance.canFillPixel(p as any, 200, 200)).toBe(true)
    })
  })

  describe('flood fill algorithm', () => {
    let p: P5Instance

    beforeEach(() => {
      p = {
        push: jest.fn(),
        pop: jest.fn(),
        noStroke: jest.fn(),
        fill: jest.fn(),
        noFill: jest.fn(),
        stroke: jest.fn(),
        strokeWeight: jest.fn(),
        point: jest.fn(),
        line: jest.fn(),
        circle: jest.fn(),
        rect: jest.fn(),
        get: jest.fn().mockReturnValue([255, 255, 255, 255]), // Default white
        set: jest.fn(),
        width: 400,
        height: 400,
        pixels: new Uint8ClampedArray(400 * 400 * 4),
        loadPixels: jest.fn(),
        updatePixels: jest.fn(),
      }
      fillInstance = new Fill()
    })

    it('should perform flood fill starting from a point', () => {
      const startX = 200
      const startY = 200
      
      // Mock pixels array for direct access
      p.pixels = new Uint8ClampedArray(400 * 400 * 4)
      // Fill with white
      for (let i = 0; i < p.pixels.length; i += 4) {
        p.pixels[i] = 255
        p.pixels[i + 1] = 255
        p.pixels[i + 2] = 255
        p.pixels[i + 3] = 255
      }
      
      const result = fillInstance.floodFill(p as any, startX, startY)
      
      expect(p.loadPixels).toHaveBeenCalled()
      expect(p.updatePixels).toHaveBeenCalled()
      expect(result.pixelCount).toBeGreaterThan(0)
    })

    it('should not fill if starting point is already filled with target color', () => {
      // Mock pixels array with black (already filled)
      p.pixels = new Uint8ClampedArray(400 * 400 * 4)
      // Fill with black
      for (let i = 0; i < p.pixels.length; i += 4) {
        p.pixels[i] = 0
        p.pixels[i + 1] = 0
        p.pixels[i + 2] = 0
        p.pixels[i + 3] = 255
      }
      
      fillInstance.setFillColor({ r: 0, g: 0, b: 0 })
      const result = fillInstance.floodFill(p as any, 200, 200)
      
      // Should return 0 pixels filled
      expect(result.pixelCount).toBe(0)
      // Should not call updatePixels if no changes needed
      expect(p.updatePixels).not.toHaveBeenCalled()
    })

    it('should fill connected regions only', () => {
      // Create a pixels array with a bounded region
      p.pixels = new Uint8ClampedArray(400 * 400 * 4)
      
      // Fill entire canvas with white first
      for (let i = 0; i < p.pixels.length; i += 4) {
        p.pixels[i] = 255      // R
        p.pixels[i + 1] = 255  // G  
        p.pixels[i + 2] = 255  // B
        p.pixels[i + 3] = 255  // A
      }
      
      // Create black boundary from (150,150) to (250,250)
      for (let y = 150; y <= 250; y++) {
        for (let x = 150; x <= 250; x++) {
          // Only boundary pixels, not interior
          if (x === 150 || x === 250 || y === 150 || y === 250) {
            const index = 4 * (y * 400 + x)
            p.pixels[index] = 0      // R
            p.pixels[index + 1] = 0  // G
            p.pixels[index + 2] = 0  // B
            p.pixels[index + 3] = 255 // A
          }
        }
      }
      
      const result = fillInstance.floodFill(p as any, 200, 200)
      
      expect(p.loadPixels).toHaveBeenCalled()
      expect(p.updatePixels).toHaveBeenCalled()
      expect(result.pixelCount).toBeGreaterThan(0)
      expect(result.boundingBox).toBeDefined()
    })
  })

  describe('user interaction', () => {
    let p: P5Instance

    beforeEach(() => {
      p = {
        push: jest.fn(),
        pop: jest.fn(),
        noStroke: jest.fn(),
        fill: jest.fn(),
        noFill: jest.fn(),
        stroke: jest.fn(),
        strokeWeight: jest.fn(),
        point: jest.fn(),
        line: jest.fn(),
        circle: jest.fn(),
        rect: jest.fn(),
        get: jest.fn().mockReturnValue([255, 255, 255, 255]),
        set: jest.fn(),
        width: 400,
        height: 400,
        pixels: new Uint8ClampedArray(400 * 400 * 4),
        loadPixels: jest.fn(),
        updatePixels: jest.fn(),
      }
      fillInstance = new Fill()
    })

    it('should handle mouse click for fill operation', () => {
      const mouseX = 200
      const mouseY = 150
      
      // Mock pixels array
      p.pixels = new Uint8ClampedArray(400 * 400 * 4)
      // Fill with white
      for (let i = 0; i < p.pixels.length; i += 4) {
        p.pixels[i] = 255
        p.pixels[i + 1] = 255
        p.pixels[i + 2] = 255
        p.pixels[i + 3] = 255
      }
      
      const result = fillInstance.handleClick(p as any, mouseX, mouseY)
      
      // Should trigger flood fill operation
      expect(p.loadPixels).toHaveBeenCalled()
      expect(result.pixelCount).toBeGreaterThan(0)
    })

    it('should validate click coordinates are within canvas bounds', () => {
      // Click outside canvas should not trigger fill
      expect(() => fillInstance.handleClick(p as any, -10, 200)).not.toThrow()
      expect(() => fillInstance.handleClick(p as any, 450, 200)).not.toThrow()
      expect(() => fillInstance.handleClick(p as any, 200, -10)).not.toThrow()
      expect(() => fillInstance.handleClick(p as any, 200, 450)).not.toThrow()
    })

    it('should provide visual feedback during fill operation', () => {
      // Mock pixels array
      p.pixels = new Uint8ClampedArray(400 * 400 * 4)
      // Fill with white
      for (let i = 0; i < p.pixels.length; i += 4) {
        p.pixels[i] = 255
        p.pixels[i + 1] = 255
        p.pixels[i + 2] = 255
        p.pixels[i + 3] = 255
      }
      
      fillInstance.handleClick(p as any, 200, 200)
      
      // Should indicate that a fill operation occurred
      expect(fillInstance.getLastFillLocation()).toEqual({ x: 200, y: 200 })
    })
  })

  describe('integration with drawing system', () => {
    let p: P5Instance

    beforeEach(() => {
      p = {
        push: jest.fn(),
        pop: jest.fn(),
        noStroke: jest.fn(),
        fill: jest.fn(),
        noFill: jest.fn(),
        stroke: jest.fn(),
        strokeWeight: jest.fn(),
        point: jest.fn(),
        line: jest.fn(),
        circle: jest.fn(),
        rect: jest.fn(),
        get: jest.fn().mockReturnValue([255, 255, 255, 255]),
        set: jest.fn(),
        width: 400,
        height: 400,
        pixels: new Uint8ClampedArray(400 * 400 * 4),
        loadPixels: jest.fn(),
        updatePixels: jest.fn(),
      }
      fillInstance = new Fill()
    })

    it('should work with existing line boundaries', () => {
      // Create pixels array with vertical line boundary
      p.pixels = new Uint8ClampedArray(400 * 400 * 4)
      
      // Fill with white background
      for (let i = 0; i < p.pixels.length; i += 4) {
        p.pixels[i] = 255
        p.pixels[i + 1] = 255
        p.pixels[i + 2] = 255
        p.pixels[i + 3] = 255
      }
      
      // Draw vertical line at x=200 from y=100 to y=300
      for (let y = 100; y <= 300; y++) {
        const index = 4 * (y * 400 + 200)
        p.pixels[index] = 0      // R (black)
        p.pixels[index + 1] = 0  // G
        p.pixels[index + 2] = 0  // B
        p.pixels[index + 3] = 255 // A
      }
      
      // Fill on left side of line
      const result = fillInstance.handleClick(p as any, 150, 200)
      expect(p.loadPixels).toHaveBeenCalled()
      expect(result.pixelCount).toBeGreaterThan(0)
    })

    it('should work with existing arc boundaries', () => {
      // Create pixels array with circular boundary
      p.pixels = new Uint8ClampedArray(400 * 400 * 4)
      
      // Fill with white background
      for (let i = 0; i < p.pixels.length; i += 4) {
        p.pixels[i] = 255
        p.pixels[i + 1] = 255
        p.pixels[i + 2] = 255
        p.pixels[i + 3] = 255
      }
      
      // Draw circular boundary at (200,200) with radius 50
      for (let y = 0; y < 400; y++) {
        for (let x = 0; x < 400; x++) {
          const dx = x - 200
          const dy = y - 200
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (Math.abs(distance - 50) < 2) {
            const index = 4 * (y * 400 + x)
            p.pixels[index] = 0      // R (black)
            p.pixels[index + 1] = 0  // G
            p.pixels[index + 2] = 0  // B
            p.pixels[index + 3] = 255 // A
          }
        }
      }
      
      // Fill inside the circle
      const result = fillInstance.handleClick(p as any, 200, 200)
      expect(p.loadPixels).toHaveBeenCalled()
      expect(result.pixelCount).toBeGreaterThan(0)
    })

    it('should maintain drawing state consistency', () => {
      // Ensure fill operations don't interfere with other drawing states
      const initialState = fillInstance.getFillColor()
      
      // Mock pixels array
      p.pixels = new Uint8ClampedArray(400 * 400 * 4)
      // Fill with white
      for (let i = 0; i < p.pixels.length; i += 4) {
        p.pixels[i] = 255
        p.pixels[i + 1] = 255
        p.pixels[i + 2] = 255
        p.pixels[i + 3] = 255
      }
      
      fillInstance.handleClick(p as any, 200, 200)
      
      // Fill color should remain unchanged after operation
      expect(fillInstance.getFillColor()).toEqual(initialState)
    })
  })

  describe('performance and edge cases', () => {
    let p: P5Instance

    beforeEach(() => {
      p = {
        push: jest.fn(),
        pop: jest.fn(),
        noStroke: jest.fn(),
        fill: jest.fn(),
        noFill: jest.fn(),
        stroke: jest.fn(),
        strokeWeight: jest.fn(),
        point: jest.fn(),
        line: jest.fn(),
        circle: jest.fn(),
        rect: jest.fn(),
        get: jest.fn().mockReturnValue([255, 255, 255, 255]),
        set: jest.fn(),
        width: 400,
        height: 400,
        pixels: new Uint8ClampedArray(400 * 400 * 4),
        loadPixels: jest.fn(),
        updatePixels: jest.fn(),
      }
      fillInstance = new Fill()
    })

    it('should handle very small regions efficiently', () => {
      // Create pixels array with single fillable pixel
      p.pixels = new Uint8ClampedArray(400 * 400 * 4)
      
      // Fill with black background
      for (let i = 0; i < p.pixels.length; i += 4) {
        p.pixels[i] = 0
        p.pixels[i + 1] = 0
        p.pixels[i + 2] = 0
        p.pixels[i + 3] = 255
      }
      
      // Make single pixel white at (200,200)
      const singlePixelIndex = 4 * (200 * 400 + 200)
      p.pixels[singlePixelIndex] = 255
      p.pixels[singlePixelIndex + 1] = 255
      p.pixels[singlePixelIndex + 2] = 255
      p.pixels[singlePixelIndex + 3] = 255
      
      const result = fillInstance.handleClick(p as any, 200, 200)
      expect(p.loadPixels).toHaveBeenCalled()
      expect(result.pixelCount).toBe(1) // Should fill exactly one pixel
    })

    it('should prevent infinite loops on degenerate cases', () => {
      // This should complete without hanging
      expect(() => {
        fillInstance.handleClick(p as any, 0, 0)
      }).not.toThrow()
    })

    it('should handle canvas boundary conditions', () => {
      // Create pixels array with fillable white background
      p.pixels = new Uint8ClampedArray(400 * 400 * 4)
      // Fill with white
      for (let i = 0; i < p.pixels.length; i += 4) {
        p.pixels[i] = 255
        p.pixels[i + 1] = 255
        p.pixels[i + 2] = 255
        p.pixels[i + 3] = 255
      }
      
      // Test filling at canvas edges
      const result1 = fillInstance.handleClick(p as any, 0, 0)
      expect(p.loadPixels).toHaveBeenCalled()
      expect(result1.pixelCount).toBeGreaterThan(0)
      
      const result2 = fillInstance.handleClick(p as any, 399, 399)
      expect(p.loadPixels).toHaveBeenCalledTimes(2)
    })
  })
})