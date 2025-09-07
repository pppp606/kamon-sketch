import { Line } from "./line.js";
import { CompassArc } from "./compassArc.js";
import { SelectableElement } from "./selection.js";

export type Point = { x: number; y: number };

export interface DivisionPoint {
  x: number;
  y: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

interface P5DrawingContext {
  push(): void;
  pop(): void;
  noFill(): void;
  fill(r: number, g?: number, b?: number): void;
  stroke(r: number, g?: number, b?: number): void;
  strokeWeight(weight: number): void;
  ellipse(x: number, y: number, w: number, h?: number): void;
}

// Constants for rendering precision and optimization
const RENDER_CONSTANTS = {
  // Floating point precision tolerance for coordinate comparisons
  COORDINATE_EPSILON: 0.01,

  // Default sizes and thresholds
  DEFAULT_DIVISION_POINT_SIZE: 6,
  DEFAULT_DIVISION_POINT_THRESHOLD: 15,

  // Colors
  COLORS: {
    BLACK: { r: 0, g: 0, b: 0 } as Color,
    DIVISION_POINT_DEFAULT: { r: 0, g: 0, b: 255 } as Color,
  },
} as const;

/**
 * Divides a line segment between two points into equal parts
 * @param pointA - Starting point of the line segment
 * @param pointB - Ending point of the line segment
 * @param divisions - Number of divisions to create (must be > 0)
 * @returns Array of division points (divisions-1 points for equal segments)
 */
export function divideTwoPoints(
  pointA: Point,
  pointB: Point,
  divisions: number,
): DivisionPoint[] {
  if (divisions <= 0) {
    throw new Error("Division count must be greater than 0");
  }

  // For n divisions, we need n-1 division points
  const numDivisionPoints = divisions - 1;

  if (numDivisionPoints === 0) {
    return []; // No division needed
  }

  const divisionPoints: DivisionPoint[] = [];

  // Calculate the step size for each division
  const dx = (pointB.x - pointA.x) / divisions;
  const dy = (pointB.y - pointA.y) / divisions;

  // Generate division points
  for (let i = 1; i <= numDivisionPoints; i++) {
    const x = pointA.x + dx * i;
    const y = pointA.y + dy * i;
    divisionPoints.push({ x, y });
  }

  return divisionPoints;
}

/**
 * Divides a line segment into equal parts
 * @param line - Line object with first and second points set
 * @param divisions - Number of divisions to create (must be > 0)
 * @returns Array of division points (divisions-1 points for equal segments)
 */
export function divideLineSegment(
  line: Line,
  divisions: number,
): DivisionPoint[] {
  if (divisions <= 0) {
    throw new Error("Division count must be greater than 0");
  }

  const firstPoint = line.getFirstPoint();
  const secondPoint = line.getSecondPoint();

  if (!firstPoint || !secondPoint) {
    throw new Error(
      "Line must be completed (have both points) before division",
    );
  }

  // Use our existing divideTwoPoints function
  return divideTwoPoints(firstPoint, secondPoint, divisions);
}

/**
 * Divides a compass arc radius into equal parts
 * @param arc - CompassArc object with center and radius set
 * @param divisions - Number of divisions to create (must be > 0)
 * @returns Array of division points along the radius line (divisions-1 points)
 */
export function divideRadiusPoints(
  arc: CompassArc,
  divisions: number,
): DivisionPoint[] {
  if (divisions <= 0) {
    throw new Error("Division count must be greater than 0");
  }

  const centerPoint = arc.getCenterPoint();
  const radiusPoint = arc.getRadiusPoint();

  if (!centerPoint || !radiusPoint) {
    throw new Error("Arc must have both center and radius set before division");
  }

  // Use our existing divideTwoPoints function to divide the radius line
  return divideTwoPoints(centerPoint, radiusPoint, divisions);
}

/**
 * Manages division mode state and interactions
 */
export class DivisionMode {
  private active = false;
  private selectedElement: SelectableElement | null = null;
  private divisions = 2; // Default to dividing into 2 parts
  private divisionPoints: DivisionPoint[] = [];

  /**
   * Check if division mode is currently active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Get the currently selected element for division
   */
  getSelectedElement(): SelectableElement | null {
    return this.selectedElement;
  }

  /**
   * Get the current number of divisions
   */
  getDivisions(): number {
    return this.divisions;
  }

  /**
   * Get the calculated division points
   */
  getDivisionPoints(): DivisionPoint[] {
    return [...this.divisionPoints]; // Return copy to prevent mutation
  }

  /**
   * Activate division mode for the selected element
   * @param element - Line or Arc element to divide
   * @param divisions - Number of divisions (must be > 0)
   */
  activate(element: SelectableElement, divisions: number): void {
    if (divisions <= 0) {
      throw new Error("Division count must be greater than 0");
    }

    this.selectedElement = element;
    this.divisions = divisions;
    this.active = true;
    this.calculateDivisionPoints();
  }

  /**
   * Update the number of divisions and recalculate points
   * @param divisions - New number of divisions (must be > 0)
   */
  setDivisions(divisions: number): void {
    if (divisions <= 0) {
      throw new Error("Division count must be greater than 0");
    }

    if (!this.active || !this.selectedElement) {
      return; // No-op if not active
    }

    this.divisions = divisions;
    this.calculateDivisionPoints();
  }

  /**
   * Deactivate division mode and clear state
   */
  deactivate(): void {
    this.active = false;
    this.selectedElement = null;
    this.divisionPoints = [];
  }

  /**
   * Find the closest division point to a given mouse position
   * @param mousePoint - Mouse position
   * @param threshold - Maximum distance threshold for selection
   * @returns Closest division point within threshold, or null if none found
   */
  getClosestDivisionPoint(
    mousePoint: Point,
    threshold: number = RENDER_CONSTANTS.DEFAULT_DIVISION_POINT_THRESHOLD,
  ): DivisionPoint | null {
    if (!this.active || this.divisionPoints.length === 0) {
      return null;
    }

    let closestPoint: DivisionPoint | null = null;
    let closestDistanceSquared = Infinity;
    const thresholdSquared = threshold * threshold; // Avoid sqrt by comparing squared distances

    for (const divisionPoint of this.divisionPoints) {
      const dx = mousePoint.x - divisionPoint.x;
      const dy = mousePoint.y - divisionPoint.y;
      const distanceSquared = dx * dx + dy * dy;

      if (
        distanceSquared <= thresholdSquared &&
        distanceSquared < closestDistanceSquared
      ) {
        closestDistanceSquared = distanceSquared;
        closestPoint = divisionPoint;
      }
    }

    return closestPoint;
  }

  /**
   * Draw division points on the canvas
   * @param p - p5.js drawing context
   * @param color - Color for division point indicators (default: blue)
   * @param size - Size of division point markers (default: 6)
   */
  draw(
    p: P5DrawingContext,
    color: Color = RENDER_CONSTANTS.COLORS.DIVISION_POINT_DEFAULT,
    size: number = RENDER_CONSTANTS.DEFAULT_DIVISION_POINT_SIZE,
  ): void {
    if (!this.active || this.divisionPoints.length === 0) {
      return;
    }

    p.push();
    p.fill(color.r, color.g, color.b);
    p.strokeWeight(1);
    p.stroke(0, 0, 0); // Black outline

    for (const point of this.divisionPoints) {
      // Use coordinate epsilon for precise rendering
      const renderX =
        Math.round(point.x / RENDER_CONSTANTS.COORDINATE_EPSILON) *
        RENDER_CONSTANTS.COORDINATE_EPSILON;
      const renderY =
        Math.round(point.y / RENDER_CONSTANTS.COORDINATE_EPSILON) *
        RENDER_CONSTANTS.COORDINATE_EPSILON;

      // Draw small circles at each division point
      p.ellipse(renderX, renderY, size, size);
    }

    p.pop();
  }

  /**
   * Calculate division points based on current element and divisions
   */
  private calculateDivisionPoints(): void {
    if (!this.selectedElement) {
      this.divisionPoints = [];
      return;
    }

    if (this.selectedElement.type === "line") {
      this.divisionPoints = divideLineSegment(
        this.selectedElement.element,
        this.divisions,
      );
    } else if (this.selectedElement.type === "arc") {
      this.divisionPoints = divideRadiusPoints(
        this.selectedElement.element,
        this.divisions,
      );
    } else {
      // This should never happen due to type constraints, but satisfy TypeScript
      const unknownType = this.selectedElement as { type: string };
      throw new Error(
        `Unsupported element type for division: ${unknownType.type}`,
      );
    }
  }
}

/**
 * Integration helper for selection-to-division workflow
 * Provides convenient methods for common division operations
 */
export class DivisionIntegrationHelper {
  private divisionMode: DivisionMode;

  constructor() {
    this.divisionMode = new DivisionMode();
  }

  /**
   * Get the division mode instance
   */
  getDivisionMode(): DivisionMode {
    return this.divisionMode;
  }

  /**
   * Quick activation of division mode for a selected element with common division counts
   * @param element - Selected line or arc element
   * @param divisions - Number of divisions (2, 3, 4, 5, or custom)
   * @returns Success status and any error message
   */
  activateQuickDivision(
    element: SelectableElement | null,
    divisions: 2 | 3 | 4 | 5 | number,
  ): { success: boolean; error?: string } {
    if (!element) {
      return { success: false, error: "No element selected" };
    }

    try {
      this.divisionMode.activate(element, divisions);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle mouse interaction for division point selection
   * @param mousePoint - Current mouse position
   * @param onDivisionPointSelected - Callback when a division point is selected
   * @param threshold - Distance threshold for selection
   */
  handleMouseInteraction(
    mousePoint: Point,
    onDivisionPointSelected: (point: DivisionPoint) => void,
    threshold?: number,
  ): boolean {
    if (!this.divisionMode.isActive()) {
      return false;
    }

    const closestPoint = this.divisionMode.getClosestDivisionPoint(
      mousePoint,
      threshold,
    );
    if (closestPoint) {
      onDivisionPointSelected(closestPoint);
      return true;
    }

    return false;
  }

  /**
   * Get division status information for UI display
   */
  getDivisionStatus(): {
    isActive: boolean;
    selectedElementType?: "line" | "arc";
    divisions?: number;
    pointCount?: number;
  } {
    const selectedElement = this.divisionMode.getSelectedElement();

    return {
      isActive: this.divisionMode.isActive(),
      selectedElementType: selectedElement?.type,
      divisions: this.divisionMode.isActive()
        ? this.divisionMode.getDivisions()
        : undefined,
      pointCount: this.divisionMode.getDivisionPoints().length,
    };
  }

  /**
   * Cycle through common division counts (2, 3, 4, 5) for keyboard shortcuts
   */
  cycleDivisions(): void {
    if (!this.divisionMode.isActive()) {
      return;
    }

    const current = this.divisionMode.getDivisions();
    const commonDivisions: number[] = [2, 3, 4, 5];
    const currentIndex = commonDivisions.indexOf(current);
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % commonDivisions.length;
    const nextDivisions = commonDivisions[nextIndex]!; // Non-null assertion - array bounds are guaranteed

    this.divisionMode.setDivisions(nextDivisions);
  }

  /**
   * Deactivate division mode and clear state
   */
  deactivate(): void {
    this.divisionMode.deactivate();
  }
}
