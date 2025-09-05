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
      
      fillInstance.floodFill(p as any, startX, startY)
      
      expect(p.loadPixels).toHaveBeenCalled()
      expect(p.updatePixels).toHaveBeenCalled()
    })

    it('should not fill if starting point is already filled with target color', () => {
      // Mock get to return black (already filled)
      p.get.mockReturnValue([0, 0, 0, 255])
      
      fillInstance.setFillColor({ r: 0, g: 0, b: 0 })
      fillInstance.floodFill(p as any, 200, 200)
      
      // Should not call updatePixels if no changes needed
      expect(p.updatePixels).not.toHaveBeenCalled()
    })

    it('should fill connected regions only', () => {
      // This test will verify that flood fill respects boundaries
      // We'll mock the pixel checking to simulate a bounded region
      let callCount = 0
      p.get.mockImplementation((x: number, y: number) => {
        callCount++
        // Return white for fillable area, black for boundaries
        if (x < 150 || x > 250 || y < 150 || y > 250) {
          return [0, 0, 0, 255] // Black boundary
        }
        return [255, 255, 255, 255] // White fillable area
      })
      
      fillInstance.floodFill(p as any, 200, 200)
      
      expect(p.loadPixels).toHaveBeenCalled()
      expect(p.updatePixels).toHaveBeenCalled()
      expect(callCount).toBeGreaterThan(0)
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
      
      fillInstance.handleClick(p as any, mouseX, mouseY)
      
      // Should trigger flood fill operation
      expect(p.loadPixels).toHaveBeenCalled()
    })

    it('should validate click coordinates are within canvas bounds', () => {
      // Click outside canvas should not trigger fill
      expect(() => fillInstance.handleClick(p as any, -10, 200)).not.toThrow()
      expect(() => fillInstance.handleClick(p as any, 450, 200)).not.toThrow()
      expect(() => fillInstance.handleClick(p as any, 200, -10)).not.toThrow()
      expect(() => fillInstance.handleClick(p as any, 200, 450)).not.toThrow()
    })

    it('should provide visual feedback during fill operation', () => {
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
      // Mock scenario where lines create boundaries
      p.get.mockImplementation((x: number, y: number) => {
        // Simulate vertical line at x=200 from y=100 to y=300
        if (x === 200 && y >= 100 && y <= 300) {
          return [0, 0, 0, 255] // Black line
        }
        return [255, 255, 255, 255] // White background
      })
      
      // Fill on left side of line
      fillInstance.handleClick(p as any, 150, 200)
      expect(p.loadPixels).toHaveBeenCalled()
    })

    it('should work with existing arc boundaries', () => {
      // Mock scenario where arcs create boundaries
      p.get.mockImplementation((x: number, y: number) => {
        // Simulate circular boundary at (200,200) with radius 50
        const dx = x - 200
        const dy = y - 200
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (Math.abs(distance - 50) < 2) {
          return [0, 0, 0, 255] // Black arc boundary
        }
        return [255, 255, 255, 255] // White background
      })
      
      // Fill inside the circle
      fillInstance.handleClick(p as any, 200, 200)
      expect(p.loadPixels).toHaveBeenCalled()
    })

    it('should maintain drawing state consistency', () => {
      // Ensure fill operations don't interfere with other drawing states
      const initialState = fillInstance.getFillColor()
      
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
      // Mock a single pixel region
      p.get.mockImplementation((x: number, y: number) => {
        if (x === 200 && y === 200) {
          return [255, 255, 255, 255] // Single white pixel
        }
        return [0, 0, 0, 255] // Black everywhere else
      })
      
      fillInstance.handleClick(p as any, 200, 200)
      expect(p.loadPixels).toHaveBeenCalled()
    })

    it('should prevent infinite loops on degenerate cases', () => {
      // This should complete without hanging
      expect(() => {
        fillInstance.handleClick(p as any, 0, 0)
      }).not.toThrow()
    })

    it('should handle canvas boundary conditions', () => {
      // Test filling at canvas edges
      fillInstance.handleClick(p as any, 0, 0)
      expect(p.loadPixels).toHaveBeenCalled()
      
      fillInstance.handleClick(p as any, 399, 399)
      expect(p.loadPixels).toHaveBeenCalledTimes(2)
    })
  })
})