import { P5Instance } from "./types/p5";

export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface FillResult {
  pixelCount: number;
  boundingBox?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export class Fill {
  private fillColor: Color = { r: 0, g: 0, b: 0 };
  private lastFillLocation: Point | null = null;
  private colorTolerance = 10; // Default tolerance for color matching

  constructor() {}

  getFillColor(): Color {
    return { ...this.fillColor };
  }

  setFillColor(color: Color): void {
    this.fillColor = {
      r: Math.max(0, Math.min(255, color.r)),
      g: Math.max(0, Math.min(255, color.g)),
      b: Math.max(0, Math.min(255, color.b)),
    };
  }

  setColorTolerance(tolerance: number): void {
    this.colorTolerance = Math.max(0, Math.min(255, tolerance));
  }

  getColorTolerance(): number {
    return this.colorTolerance;
  }

  private colorsMatch(
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number,
  ): boolean {
    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    return diff <= this.colorTolerance;
  }

  private getPixelIndex(x: number, y: number, width: number): number {
    return 4 * (y * width + x);
  }

  floodFill(p: P5Instance, startX: number, startY: number): FillResult {
    if (startX < 0 || startX >= p.width || startY < 0 || startY >= p.height) {
      return { pixelCount: 0 };
    }

    p.loadPixels();

    // Get start color directly from pixels array
    const startIndex = this.getPixelIndex(startX, startY, p.width);
    const startR = p.pixels[startIndex] ?? 255;
    const startG = p.pixels[startIndex + 1] ?? 255;
    const startB = p.pixels[startIndex + 2] ?? 255;

    // Don't fill if already target color (within tolerance)
    if (
      this.colorsMatch(
        startR,
        startG,
        startB,
        this.fillColor.r,
        this.fillColor.g,
        this.fillColor.b,
      )
    ) {
      return { pixelCount: 0 };
    }

    // Use stack instead of queue for better performance
    const stack: Point[] = [{ x: startX, y: startY }];

    // Use Uint8Array for visited tracking (much more efficient than Set<string>)
    const visited = new Uint8Array(p.width * p.height);

    let pixelCount = 0;
    let minX = startX,
      maxX = startX;
    let minY = startY,
      maxY = startY;

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (
        current.x < 0 ||
        current.x >= p.width ||
        current.y < 0 ||
        current.y >= p.height
      ) {
        continue;
      }

      const visitedIndex = current.y * p.width + current.x;
      if (visited[visitedIndex]) {
        continue;
      }

      // Get current pixel color directly from pixels array
      const pixelIndex = this.getPixelIndex(current.x, current.y, p.width);
      const currentR = p.pixels[pixelIndex] ?? 255;
      const currentG = p.pixels[pixelIndex + 1] ?? 255;
      const currentB = p.pixels[pixelIndex + 2] ?? 255;

      // Check if this pixel matches the original color (within tolerance)
      if (
        !this.colorsMatch(currentR, currentG, currentB, startR, startG, startB)
      ) {
        continue;
      }

      // Mark as visited and fill pixel
      visited[visitedIndex] = 1;
      p.pixels[pixelIndex] = this.fillColor.r;
      p.pixels[pixelIndex + 1] = this.fillColor.g;
      p.pixels[pixelIndex + 2] = this.fillColor.b;
      p.pixels[pixelIndex + 3] = 255; // Keep full opacity for now

      pixelCount++;

      // Update bounding box
      minX = Math.min(minX, current.x);
      maxX = Math.max(maxX, current.x);
      minY = Math.min(minY, current.y);
      maxY = Math.max(maxY, current.y);

      // Add neighboring pixels to stack (4-way flood fill)
      stack.push({ x: current.x + 1, y: current.y });
      stack.push({ x: current.x - 1, y: current.y });
      stack.push({ x: current.x, y: current.y + 1 });
      stack.push({ x: current.x, y: current.y - 1 });
    }

    p.updatePixels();

    return {
      pixelCount,
      boundingBox: pixelCount > 0 ? { minX, minY, maxX, maxY } : undefined,
    };
  }

  handleClick(p: P5Instance, mouseX: number, mouseY: number): FillResult {
    if (mouseX < 0 || mouseX >= p.width || mouseY < 0 || mouseY >= p.height) {
      return { pixelCount: 0 };
    }

    this.lastFillLocation = { x: mouseX, y: mouseY };
    return this.floodFill(p, mouseX, mouseY);
  }

  getLastFillLocation(): Point | null {
    return this.lastFillLocation ? { ...this.lastFillLocation } : null;
  }

  // Deprecated: These methods are kept for backward compatibility but not used internally
  isPointInRegion(p: P5Instance, x: number, y: number): boolean {
    if (x < 0 || x >= p.width || y < 0 || y >= p.height) {
      return false;
    }

    // For backward compatibility, check if pixel is fillable (white-ish background)
    const pixelColor = p.get(x, y);
    return this.colorsMatch(
      pixelColor[0] ?? 255,
      pixelColor[1] ?? 255,
      pixelColor[2] ?? 255,
      255,
      255,
      255,
    );
  }

  canFillPixel(p: P5Instance, x: number, y: number): boolean {
    return this.isPointInRegion(p, x, y);
  }
}
