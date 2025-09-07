import { CompassArc } from "./compassArc";

export type CompassControllerState =
  | "IDLE"
  | "CENTER_SET"
  | "RADIUS_SET"
  | "DRAWING"
  | "SETTING_RADIUS";

export class CompassController {
  private compassArc: CompassArc;
  private state: CompassControllerState = "IDLE";

  constructor(compassArc: CompassArc) {
    this.compassArc = compassArc;
  }

  getState(): CompassControllerState {
    const arcState = this.compassArc.getState();

    // Map compass arc states to controller states
    if (this.state === "SETTING_RADIUS") {
      return "SETTING_RADIUS";
    }

    switch (arcState) {
      case "IDLE":
        return "IDLE";
      case "CENTER_SET":
        return "CENTER_SET";
      case "RADIUS_SET":
        return "RADIUS_SET";
      case "DRAWING":
        return "DRAWING";
      default:
        return "IDLE";
    }
  }

  handleClick(
    mouseX: number,
    mouseY: number,
    options: { shiftKey: boolean },
  ): void {
    const currentState = this.getState();

    if (
      options.shiftKey &&
      (currentState === "RADIUS_SET" || currentState === "DRAWING")
    ) {
      // Shift+click: enter radius adjustment mode
      this.state = "SETTING_RADIUS";
      this.compassArc.setRadius(mouseX, mouseY);
      return;
    }

    // Normal click behavior
    this.state = currentState; // Reset any special states

    if (currentState === "IDLE") {
      this.compassArc.setCenter(mouseX, mouseY);
    } else if (currentState === "CENTER_SET") {
      // Use stored currentRadius from CompassArc for default radius
      const currentRadius = this.compassArc.getCurrentRadius();
      const dx = mouseX - this.compassArc.getCenterPoint()!.x;
      const dy = mouseY - this.compassArc.getCenterPoint()!.y;

      // Set radius point at the currentRadius distance from center, in direction of click
      const angle = Math.atan2(dy, dx);
      const radiusX =
        this.compassArc.getCenterPoint()!.x + currentRadius * Math.cos(angle);
      const radiusY =
        this.compassArc.getCenterPoint()!.y + currentRadius * Math.sin(angle);

      this.compassArc.setRadius(radiusX, radiusY);
      this.compassArc.startDrawing();
      this.compassArc.updateDrawing(mouseX, mouseY);
    }
  }

  handleDrag(mouseX: number, mouseY: number): void {
    const currentState = this.getState();

    if (currentState === "SETTING_RADIUS") {
      // Update radius during drag when in radius setting mode
      this.compassArc.setRadius(mouseX, mouseY);
      return;
    }

    if (currentState === "DRAWING") {
      this.compassArc.updateDrawing(mouseX, mouseY);
    }
  }

  handleRelease(): void {
    const currentState = this.getState();

    if (currentState === "SETTING_RADIUS") {
      // Update currentRadius with the new radius and exit radius setting mode
      const newRadius = this.compassArc.getRadius();
      this.compassArc.setCurrentRadius(newRadius);
      this.state = "RADIUS_SET";
      return;
    }

    if (currentState === "DRAWING") {
      // Complete the arc
      this.state = "IDLE";
    }
  }

  getCompassArc(): CompassArc {
    return this.compassArc;
  }

  isInRadiusSettingMode(): boolean {
    return this.state === "SETTING_RADIUS";
  }
}
