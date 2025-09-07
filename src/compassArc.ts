export type Point = { x: number; y: number };
export type ArcState = "IDLE" | "CENTER_SET" | "RADIUS_SET" | "DRAWING";

const FULL_CIRCLE_EPS = 0.1;
const MIN_RADIUS = 0.001;
const DEFAULT_RADIUS = 10;
const MIN_PERSISTENT_RADIUS = 1;
const MAX_PERSISTENT_RADIUS = 10000;
const RADIUS_STORAGE_KEY = "compass.radius";

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
}

export class CompassArc {
  private centerPoint: Point | null = null;
  private radiusPoint: Point | null = null;
  private currentPoint: Point | null = null;
  private state: ArcState = "IDLE";
  private lastAngle: number | null = null;
  private accumulatedAngle = 0;
  private currentRadius: number = DEFAULT_RADIUS;
  private lastRadius: number = DEFAULT_RADIUS;

  constructor() {
    this.loadRadiusFromStorage();
  }

  private loadRadiusFromStorage(): void {
    try {
      if (typeof localStorage !== "undefined") {
        const storedRadius = localStorage.getItem(RADIUS_STORAGE_KEY);
        if (storedRadius) {
          const radius = parseFloat(storedRadius);
          if (!isNaN(radius)) {
            this.currentRadius = this.clampRadius(radius);
            this.lastRadius = this.currentRadius;
          }
        }
      }
    } catch (error) {
      // Ignore localStorage errors (e.g., in private browsing mode)
    }
  }

  private saveRadiusToStorage(): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(RADIUS_STORAGE_KEY, this.currentRadius.toString());
      }
    } catch (error) {
      // Ignore localStorage errors (e.g., in private browsing mode)
    }
  }

  private clampRadius(radius: number): number {
    return Math.max(
      MIN_PERSISTENT_RADIUS,
      Math.min(MAX_PERSISTENT_RADIUS, radius),
    );
  }

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
      return this.currentRadius;
    }
    const dx = this.radiusPoint.x - this.centerPoint.x;
    const dy = this.radiusPoint.y - this.centerPoint.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  setCurrentRadius(radius: number): void {
    this.lastRadius = this.currentRadius;
    this.currentRadius = this.clampRadius(radius);
    this.saveRadiusToStorage();
  }

  getCurrentRadius(): number {
    return this.currentRadius;
  }

  useLastRadius(): void {
    const temp = this.currentRadius;
    this.currentRadius = this.lastRadius;
    this.lastRadius = temp;
    this.saveRadiusToStorage();
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
    return this.accumulatedAngle;
  }

  isFullCircle(): boolean {
    if (this.state !== "DRAWING") {
      return false;
    }

    const totalAngle = this.getTotalAngle();

    return Math.abs(totalAngle - 2 * Math.PI) < FULL_CIRCLE_EPS;
  }

  draw(p: P5DrawingContext): void {
    if (!this.centerPoint) return;

    p.push();
    p.noFill();
    p.stroke(0, 0, 0);
    p.strokeWeight(2);

    if (this.state === "CENTER_SET") {
      p.point(this.centerPoint.x, this.centerPoint.y);
    } else if (this.state === "RADIUS_SET" && this.radiusPoint) {
      p.point(this.centerPoint.x, this.centerPoint.y);
      p.line(
        this.centerPoint.x,
        this.centerPoint.y,
        this.radiusPoint.x,
        this.radiusPoint.y,
      );
      p.circle(this.centerPoint.x, this.centerPoint.y, this.getRadius() * 2);
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

    p.pop();
  }

  drawRadiusPreview(p: P5DrawingContext): void {
    if (!this.centerPoint || !this.radiusPoint) return;

    p.push();
    p.noFill();

    // Use a more distinctive color for radius adjustment preview (orange/blue)
    p.stroke(255, 140, 0); // Orange color for better visibility during radius adjustment
    p.strokeWeight(2); // Slightly thicker for better visibility

    // Draw center point with higher visibility
    p.stroke(255, 0, 0); // Red for center point
    p.strokeWeight(4);
    p.point(this.centerPoint.x, this.centerPoint.y);

    // Draw radius line
    p.stroke(255, 140, 0); // Orange for radius line
    p.strokeWeight(2);
    p.line(
      this.centerPoint.x,
      this.centerPoint.y,
      this.radiusPoint.x,
      this.radiusPoint.y,
    );

    // Draw radius circle preview with dashed effect (simulated with multiple arcs)
    const radius = this.getRadius();
    const segments = 16;
    const dashLength = (2 * Math.PI) / (segments * 2); // Half segments for dashed effect

    p.strokeWeight(2);
    for (let i = 0; i < segments; i += 2) {
      const startAngle = (i * 2 * Math.PI) / segments;
      const endAngle = startAngle + dashLength;
      p.arc(
        this.centerPoint.x,
        this.centerPoint.y,
        radius * 2,
        radius * 2,
        startAngle,
        endAngle,
      );
    }

    p.pop();
  }

  reset(): void {
    this.centerPoint = null;
    this.radiusPoint = null;
    this.currentPoint = null;
    this.state = "IDLE";
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
    copy.accumulatedAngle = this.accumulatedAngle;
    copy.lastAngle = this.lastAngle;

    return copy;
  }

  private resetAngleTracking(): void {
    this.lastAngle = null;
    this.accumulatedAngle = 0;
  }

  private accumulateAngle(): void {
    if (!this.centerPoint || !this.currentPoint || !this.radiusPoint) {
      return;
    }

    const currentAngle = this.calculateAngle(this.currentPoint);
    const startAngle = this.calculateAngle(this.radiusPoint);

    if (this.lastAngle === null) {
      this.lastAngle = startAngle;
      this.accumulatedAngle = 0;
    }

    let delta = currentAngle - this.lastAngle;

    while (delta <= -Math.PI) {
      delta += 2 * Math.PI;
    }
    while (delta > Math.PI) {
      delta -= 2 * Math.PI;
    }

    this.accumulatedAngle += Math.abs(delta);
    this.lastAngle = currentAngle;
  }

  static getFullCircleThreshold(): number {
    return FULL_CIRCLE_EPS;
  }

  static getMinRadius(): number {
    return MIN_RADIUS;
  }

  static getDefaultRadius(): number {
    return DEFAULT_RADIUS;
  }

  static getMinPersistentRadius(): number {
    return MIN_PERSISTENT_RADIUS;
  }

  static getMaxPersistentRadius(): number {
    return MAX_PERSISTENT_RADIUS;
  }

  static getRadiusStorageKey(): string {
    return RADIUS_STORAGE_KEY;
  }
}
