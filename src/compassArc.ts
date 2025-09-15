export type Point = { x: number; y: number };
export type ArcState = "IDLE" | "CENTER_SET" | "RADIUS_SET" | "DRAWING";

const FULL_CIRCLE_EPS = 0.05;
const MIN_RADIUS = 0.001;

// Angle utility functions (exported for testing)
export function normalizeAngle(angle: number): number {
  // Normalize angle to range (-π, π]
  let normalized = angle % (2 * Math.PI);
  // Handle negative results from modulo in JavaScript
  if (normalized <= -Math.PI) {
    normalized += 2 * Math.PI;
  } else if (normalized > Math.PI) {
    normalized -= 2 * Math.PI;
  }
  // Special case: -π should become π for consistency
  if (Math.abs(normalized + Math.PI) < 1e-10) {
    normalized = Math.PI;
  }
  return normalized;
}

export function shortestSignedDelta(fromAngle: number, toAngle: number): number {
  // Calculate shortest signed angular difference from fromAngle to toAngle
  // Returns value in range (-π, π]
  const delta = normalizeAngle(toAngle - fromAngle);
  return delta;
}

interface P5DrawingContext {
  push(): void;
  pop(): void;
  noFill(): void;
  stroke(r: number, g?: number, b?: number): void;
  strokeWeight(weight: number): void;
  point(x: number, y: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  circle(x: number, y: number, d: number): void;
  arc(
    x: number,
    y: number,
    w: number,
    h: number,
    start: number,
    stop: number,
  ): void;
  drawingContext: {
    setLineDash: (dash: number[]) => void;
    lineDashOffset: number;
  };
}

export class CompassArc {
  private centerPoint: Point | null = null;
  private radiusPoint: Point | null = null;
  private currentPoint: Point | null = null;
  private state: ArcState = "IDLE";
  private lastAngle: number | null = null;
  private netAngle = 0; // Signed accumulated angle for proper full circle detection
  private accumulatedAngleAbs = 0; // Absolute accumulated angle for drawing threshold
  private previewPoint: Point | null = null;

  getCenterPoint(): Point | null {
    return this.centerPoint;
  }

  getRadiusPoint(): Point | null {
    return this.radiusPoint;
  }

  getState(): ArcState {
    return this.state;
  }

  setCenter(x: number, y: number): void {
    this.centerPoint = { x, y };
    this.radiusPoint = null;
    this.currentPoint = null;
    this.state = "CENTER_SET";
    this.resetAngleTracking();
  }

  setRadius(x: number, y: number): void {
    if (!this.centerPoint) {
      throw new Error("Center point must be set before setting radius");
    }
    this.radiusPoint = { x, y };
    this.state = "RADIUS_SET";
  }

  setRadiusDistance(radius: number): void {
    if (!this.centerPoint) {
      throw new Error("Center point must be set before setting radius");
    }
    // Set radius point at horizontal distance from center (for simplicity)
    this.radiusPoint = {
      x: this.centerPoint.x + radius,
      y: this.centerPoint.y,
    };
    this.state = "RADIUS_SET";
  }

  setRadiusAndStartDrawing(x: number, y: number): void {
    if (!this.centerPoint) {
      throw new Error('Center point must be set before setting radius and starting drawing')
    }

    // Calculate radius distance from center to click position
    const radius = Math.sqrt((x - this.centerPoint.x) ** 2 + (y - this.centerPoint.y) ** 2)

    // Set radius point at the calculated distance from center in direction of click position
    if (radius > 0) {
      const angle = Math.atan2(y - this.centerPoint.y, x - this.centerPoint.x)
      this.radiusPoint = {
        x: this.centerPoint.x + radius * Math.cos(angle),
        y: this.centerPoint.y + radius * Math.sin(angle)
      }
    } else {
      // Handle zero radius case (click at same position as center)
      this.radiusPoint = { x: this.centerPoint.x, y: this.centerPoint.y }
    }

    // Immediately transition to DRAWING state
    this.state = 'DRAWING'
    this.resetAngleTracking()
  }

  startDrawing(): void {
    if (this.state !== "RADIUS_SET") {
      throw new Error("Radius must be set before drawing");
    }
    this.state = "DRAWING";
    this.resetAngleTracking();
  }

  updateDrawing(x: number, y: number): void {
    if (this.state !== "DRAWING") {
      throw new Error("Must start drawing before updating");
    }
    this.currentPoint = { x, y };
    this.accumulateAngle();
  }

  getRadius(): number {
    if (!this.centerPoint || !this.radiusPoint) {
      return 0;
    }
    const dx = this.radiusPoint.x - this.centerPoint.x;
    const dy = this.radiusPoint.y - this.centerPoint.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  setPreviewPoint(x: number, y: number): void {
    this.previewPoint = { x, y };
  }

  getPreviewPoint(): Point | null {
    return this.previewPoint;
  }

  clearPreview(): void {
    this.previewPoint = null;
  }

  private calculateAngle(point: Point): number {
    if (!this.centerPoint) {
      return 0;
    }
    return Math.atan2(
      point.y - this.centerPoint.y,
      point.x - this.centerPoint.x,
    );
  }

  getStartAngle(): number {
    if (!this.centerPoint || !this.radiusPoint) {
      return 0;
    }
    return this.calculateAngle(this.radiusPoint);
  }

  getEndAngle(): number {
    if (!this.centerPoint || !this.currentPoint) {
      return 0;
    }
    return this.calculateAngle(this.currentPoint);
  }

  getTotalAngle(): number {
    return this.accumulatedAngleAbs;
  }

  isFullCircle(): boolean {
    if (this.state !== "DRAWING") {
      return false;
    }

    if (!this.radiusPoint || !this.currentPoint) {
      return false;
    }

    // Condition A: Net angle indicates at least one full revolution
    const hasCompletedRevolution = Math.abs(this.netAngle) >= (2 * Math.PI - FULL_CIRCLE_EPS);

    // Condition B: Current angle is close to start angle
    const startAngle = this.getStartAngle();
    const currentAngle = this.getEndAngle();
    const angleProximity = Math.abs(shortestSignedDelta(startAngle, currentAngle)) <= FULL_CIRCLE_EPS;

    return hasCompletedRevolution && angleProximity;
  }

  draw(p: P5DrawingContext): void {
    if (!this.centerPoint) return;

    p.push();
    p.noFill();
    p.stroke(0, 0, 0);
    p.strokeWeight(2);

    if (this.state === "CENTER_SET") {
      p.point(this.centerPoint.x, this.centerPoint.y);

      // Draw preview line if preview point is set (during Shift+click radius setting)
      if (this.previewPoint) {
        p.push();
        // Set up dashed line style
        p.strokeWeight(1);
        p.stroke(100, 100, 100); // Gray color
        p.drawingContext.setLineDash([5, 5]); // 5px dash, 5px gap
        p.line(
          this.centerPoint.x,
          this.centerPoint.y,
          this.previewPoint.x,
          this.previewPoint.y,
        );
        p.drawingContext.setLineDash([]); // Reset to solid line
        p.pop();
      }
    } else if (this.state === "RADIUS_SET" && this.radiusPoint) {
      p.point(this.centerPoint.x, this.centerPoint.y);
      p.line(
        this.centerPoint.x,
        this.centerPoint.y,
        this.radiusPoint.x,
        this.radiusPoint.y,
      );
    } else if (
      this.state === "DRAWING" &&
      this.radiusPoint &&
      this.currentPoint
    ) {
      const radius = this.getRadius();
      const startAngle = this.getStartAngle();
      const endAngle = this.getEndAngle();

      if (this.isFullCircle()) {
        p.circle(this.centerPoint.x, this.centerPoint.y, radius * 2);
      } else {
        // Only draw arc if there's accumulated angle (user has moved the mouse)
        const totalAngle = this.getTotalAngle();
        if (Math.abs(totalAngle) > 0.01) {
          p.arc(
            this.centerPoint.x,
            this.centerPoint.y,
            radius * 2,
            radius * 2,
            startAngle,
            endAngle,
          );
        }
      }
    }

    p.pop();
  }

  reset(): void {
    this.centerPoint = null;
    this.radiusPoint = null;
    this.currentPoint = null;
    this.state = "IDLE";
    this.previewPoint = null;
    this.resetAngleTracking();
  }

  createCompletedCopy(): CompassArc | null {
    if (
      this.state !== "DRAWING" ||
      !this.centerPoint ||
      !this.radiusPoint ||
      !this.currentPoint
    ) {
      return null;
    }

    const copy = new CompassArc();
    copy.centerPoint = { ...this.centerPoint };
    copy.radiusPoint = { ...this.radiusPoint };
    copy.currentPoint = { ...this.currentPoint };
    copy.state = "DRAWING";
    copy.netAngle = this.netAngle;
    copy.accumulatedAngleAbs = this.accumulatedAngleAbs;
    copy.lastAngle = this.lastAngle;

    return copy;
  }

  private resetAngleTracking(): void {
    this.lastAngle = null;
    this.netAngle = 0;
    this.accumulatedAngleAbs = 0;
  }

  private accumulateAngle(): void {
    if (!this.centerPoint || !this.currentPoint || !this.radiusPoint) {
      return;
    }

    const currentAngle = this.calculateAngle(this.currentPoint);
    const startAngle = this.calculateAngle(this.radiusPoint);

    if (this.lastAngle === null) {
      this.lastAngle = startAngle;
      this.netAngle = 0;
      this.accumulatedAngleAbs = 0;
    }

    // Calculate signed delta using utility function
    const deltaSigned = shortestSignedDelta(this.lastAngle, currentAngle);

    // Accumulate both signed angle (for full circle detection) and absolute angle (for drawing threshold)
    this.netAngle += deltaSigned;
    this.accumulatedAngleAbs += Math.abs(deltaSigned);

    this.lastAngle = currentAngle;
  }

  static getFullCircleThreshold(): number {
    return FULL_CIRCLE_EPS;
  }

  static getMinRadius(): number {
    return MIN_RADIUS;
  }

  calculateStartAngleFromClick(x: number, y: number): number {
    if (!this.centerPoint) {
      throw new Error(
        "Center point must be set before calculating angle from click",
      );
    }
    return Math.atan2(y - this.centerPoint.y, x - this.centerPoint.x);
  }

  setRadiusAtAngle(angle: number, radius: number, startDrawingImmediately = false): void {
    if (!this.centerPoint) {
      throw new Error(
        "Center point must be set before setting radius at angle",
      );
    }
    if (radius <= MIN_RADIUS) {
      throw new Error(
        "Valid radius must be greater than minimum radius",
      );
    }
    // Calculate radius point at the specified angle
    const x = this.centerPoint.x + radius * Math.cos(angle);
    const y = this.centerPoint.y + radius * Math.sin(angle);
    this.radiusPoint = { x, y };

    if (startDrawingImmediately) {
      this.state = "DRAWING";
      this.resetAngleTracking();
    } else {
      this.state = "RADIUS_SET";
    }
  }


  // Serialization methods for localStorage persistence
  toJSON(): {
    centerPoint: Point | null;
    radiusPoint: Point | null;
    currentPoint: Point | null;
    state: ArcState;
    lastAngle: number | null;
    netAngle: number;
    accumulatedAngleAbs: number;
    previewPoint: Point | null;
  } {
    return {
      centerPoint: this.centerPoint,
      radiusPoint: this.radiusPoint,
      currentPoint: this.currentPoint,
      state: this.state,
      lastAngle: this.lastAngle,
      netAngle: this.netAngle,
      accumulatedAngleAbs: this.accumulatedAngleAbs,
      previewPoint: this.previewPoint,
    };
  }

  static fromJSON(data: {
    centerPoint?: Point | null;
    radiusPoint?: Point | null;
    currentPoint?: Point | null;
    state?: ArcState;
    lastAngle?: number | null;
    netAngle?: number;
    accumulatedAngleAbs?: number;
    // Legacy fields for backward compatibility
    accumulatedAngle?: number;
  }): CompassArc {
    const arc = new CompassArc();
    // Use any cast for deserialization as it's a controlled internal operation
    const arcPrivate = arc as unknown as {
      centerPoint: Point | null;
      radiusPoint: Point | null;
      currentPoint: Point | null;
      state: ArcState;
      lastAngle: number | null;
      netAngle: number;
      accumulatedAngleAbs: number;
    };
    arcPrivate.centerPoint = data.centerPoint || null;
    arcPrivate.radiusPoint = data.radiusPoint || null;
    arcPrivate.currentPoint = data.currentPoint || null;
    arcPrivate.state = data.state || "IDLE";
    arcPrivate.lastAngle = data.lastAngle || null;
    arcPrivate.netAngle = data.netAngle || 0;
    // Backward compatibility: use old accumulatedAngle if new field not present
    arcPrivate.accumulatedAngleAbs = data.accumulatedAngleAbs || data.accumulatedAngle || 0;
    return arc;
  }
}
