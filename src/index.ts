// p5.js is loaded globally via script tag
declare const p5: new (sketch: (p: P5Instance) => void) => void;
import { CompassArc } from "./compassArc";
import { CompassController } from "./compassController";
import { Line } from "./line";
import { Selection, SelectableElement } from "./selection";
import { Fill } from "./fill";
import { P5Instance } from "./types/p5";

let compassArc: CompassArc;
let compassController: CompassController;
let completedArcs: CompassArc[] = [];
let lines: Line[] = [];
let currentLine: Line | null = null;
let drawingMode: "compass" | "line" | "fill" = "line"; // Default to line mode for MVP
let selection: Selection;
let fill: Fill;

export function hello(): string {
  return "Hello World";
}

export function setDrawingMode(mode: "compass" | "line" | "fill"): void {
  drawingMode = mode;
  // Reset current drawings when switching modes
  if (compassArc) {
    compassArc.reset();
  }
  currentLine = null;
}

export function getDrawingMode(): "compass" | "line" | "fill" {
  return drawingMode;
}

export function getLines(): Line[] {
  return lines;
}

export function getCurrentLine(): Line | null {
  return currentLine;
}

export function getCompletedArcs(): CompassArc[] {
  return completedArcs;
}

export function setup(p: P5Instance): void {
  // Use full window size for canvas
  p.createCanvas(p.windowWidth, p.windowHeight - 100); // Leave space for UI buttons
  p.background(220);
  compassArc = new CompassArc();
  compassController = new CompassController(compassArc);
  completedArcs = [];
  lines = [];
  currentLine = null;
  selection = new Selection();
  fill = new Fill();
}

export function draw(p: P5Instance): void {
  p.clear();
  p.background(220);

  // Draw all completed lines
  for (const line of lines) {
    line.draw(p);
  }

  // Draw all completed arcs
  for (const arc of completedArcs) {
    arc.draw(p);
  }

  // Draw current line being created
  if (currentLine) {
    currentLine.draw(p);
  }

  // Draw the compass arc (if in compass mode)
  if (drawingMode === "compass" && compassArc) {
    if (compassController && compassController.isInRadiusSettingMode()) {
      // Show radius preview when in radius setting mode
      compassArc.drawRadiusPreview(p);
    } else {
      // Normal compass arc drawing
      compassArc.draw(p);
    }
  }

  // Draw selection highlight
  if (selection) {
    selection.drawHighlight(p as Parameters<typeof selection.drawHighlight>[0]);
  }
}

export function mousePressed(p: P5Instance): void {
  // Detect shift key state from mouse event (works on both Mac and Windows)
  const shiftPressed =
    (typeof window !== "undefined" &&
      !!(window.event as MouseEvent)?.shiftKey) ||
    false;

  // Handle fill mode first
  if (drawingMode === "fill" && fill) {
    fill.handleClick(p, p.mouseX, p.mouseY);
    return;
  }

  // Handle compass arc drawing first (only when actively drawing)
  if (drawingMode === "compass" && compassController) {
    const state = compassController.getState();

    if (state === "CENTER_SET") {
      selection.setSelectedElement(null); // Clear selection when setting radius
      compassController.handleClick(p.mouseX, p.mouseY, {
        shiftKey: shiftPressed,
      });
      return;
    } else if (
      state === "RADIUS_SET" ||
      state === "DRAWING" ||
      state === "SETTING_RADIUS"
    ) {
      // Handle shift+click for radius adjustment or continue normal flow
      compassController.handleClick(p.mouseX, p.mouseY, {
        shiftKey: shiftPressed,
      });
      if (state === "SETTING_RADIUS" || shiftPressed) {
        return; // Don't proceed to selection logic when adjusting radius
      }
    }
    // If state is DRAWING and not shift-clicking, continue to selection logic
    // If state is IDLE, continue to selection logic (don't start new arc yet)
  }

  // Selection logic (only when not in middle of compass arc creation)
  const selectableElements: SelectableElement[] = [
    ...lines.map((line) => ({ type: "line" as const, element: line })),
    ...completedArcs.map((arc) => ({ type: "arc" as const, element: arc })),
    ...(compassArc &&
    (compassArc.getState() === "DRAWING" ||
      compassArc.getState() === "RADIUS_SET")
      ? [{ type: "arc" as const, element: compassArc }]
      : []),
  ];

  const clickPoint = { x: p.mouseX, y: p.mouseY };
  const closestElement = selection.findClosestElement(
    clickPoint,
    selectableElements,
  );

  // Selection threshold - only select if click is close enough
  const SELECTION_THRESHOLD = 20;

  if (closestElement) {
    let distance: number;
    if (closestElement.type === "line") {
      distance = selection.calculateDistanceToLine(
        clickPoint,
        closestElement.element,
      );
    } else {
      distance = selection.calculateDistanceToArc(
        clickPoint,
        closestElement.element,
      );
    }

    if (distance <= SELECTION_THRESHOLD) {
      selection.setSelectedElement(closestElement);

      // Extract radius from selected circles/arcs and apply to compass
      if (closestElement.type === "arc") {
        const selectedRadius = closestElement.element.getRadius();
        // Only update currentRadius when selecting circles/arcs, preserving lastRadius
        if (compassArc && selectedRadius > 0) {
          const clampedRadius = Math.max(1, Math.min(10000, selectedRadius));
          compassArc.setCurrentRadius(clampedRadius);
        }
      }

      return; // Don't proceed with drawing when selecting
    }
  }

  // Clear selection if not clicking on an element
  selection.setSelectedElement(null);

  // Start new drawing based on current mode
  if (drawingMode === "compass" && compassController) {
    const state = compassController.getState();
    if (state === "IDLE") {
      // Start a new compass arc
      compassController.handleClick(p.mouseX, p.mouseY, {
        shiftKey: shiftPressed,
      });
      return;
    }
  } else if (drawingMode === "line") {
    if (!currentLine) {
      // Start a new line
      currentLine = new Line();
      currentLine.setFirstPoint(p.mouseX, p.mouseY);
    } else if (currentLine.getState() === "FIRST_POINT") {
      // Set the second point and complete the line
      currentLine.setSecondPoint(p.mouseX, p.mouseY);
      lines.push(currentLine);
      // Start a new line immediately
      currentLine = new Line();
      currentLine.setFirstPoint(p.mouseX, p.mouseY);
    }
  }
}

export function mouseDragged(p: P5Instance): void {
  if (drawingMode === "compass" && compassController) {
    const state = compassController.getState();
    if (state === "DRAWING" || state === "SETTING_RADIUS") {
      compassController.handleDrag(p.mouseX, p.mouseY);
    }
  }
  // Line mode doesn't use drag for drawing (click-click interaction)
}

export function mouseReleased(): void {
  if (drawingMode === "compass" && compassController) {
    const state = compassController.getState();
    if (state === "DRAWING") {
      // Save the completed arc before resetting
      const completedArc = compassArc.createCompletedCopy();
      if (completedArc) {
        completedArcs.push(completedArc);
      }
      // Reset to start a new arc
      compassArc.reset();
    } else {
      // Handle other release events (like ending radius adjustment)
      compassController.handleRelease();
    }
  }
  // Line mode doesn't use mouse release events
}

export function getCompassArc() {
  return compassArc;
}

export function getSelection() {
  return selection;
}

export function getFill() {
  return fill;
}

export function setFillColor(color: { r: number; g: number; b: number }) {
  if (fill) {
    fill.setFillColor(color);
  }
}

export function getFillColor() {
  return fill ? fill.getFillColor() : { r: 0, g: 0, b: 0 };
}

export function doubleClicked(p: P5Instance): void {
  const selectedElement = selection.getSelectedElement();

  if (!selectedElement) {
    return;
  }

  const clickPoint = { x: p.mouseX, y: p.mouseY };
  const closestPoint = selection.getClosestPointOnElement(
    clickPoint,
    selectedElement,
  );

  if (!closestPoint) {
    return;
  }

  // Start new drawing from the closest point on the selected element
  if (drawingMode === "line") {
    // Clear any current line and start new one from the closest point
    currentLine = new Line();
    currentLine.setFirstPoint(closestPoint.x, closestPoint.y);
  } else if (drawingMode === "compass") {
    // For compass mode, start new arc with center at the closest point
    compassArc.reset();
    compassController.handleClick(closestPoint.x, closestPoint.y, {
      shiftKey: false,
    });
  }

  // Clear selection after starting new drawing
  selection.setSelectedElement(null);
}

export function startDrawingFromSelectedElement(): boolean {
  const selectedElement = selection.getSelectedElement();

  if (!selectedElement) {
    return false;
  }

  // For line mode, start a new line from the closest point on the selected element
  if (drawingMode === "line") {
    // Clear any current line
    currentLine = null;
    return true;
  }

  // For compass mode, we would implement arc-to-arc continuation here
  return false;
}

function setupModeButtons(): void {
  const lineBtn = document.getElementById("line-btn");
  const compassBtn = document.getElementById("compass-btn");
  const fillBtn = document.getElementById("fill-btn");

  if (!lineBtn || !compassBtn || !fillBtn) {
    return;
  }

  function updateActiveButton(activeMode: "compass" | "line" | "fill"): void {
    // Remove active class from all buttons
    [lineBtn!, compassBtn!, fillBtn!].forEach((btn) =>
      btn.classList.remove("active"),
    );

    // Add active class to current mode button
    switch (activeMode) {
      case "line":
        lineBtn!.classList.add("active");
        break;
      case "compass":
        compassBtn!.classList.add("active");
        break;
      case "fill":
        fillBtn!.classList.add("active");
        break;
    }
  }

  lineBtn!.addEventListener("click", () => {
    setDrawingMode("line");
    updateActiveButton("line");
  });

  compassBtn!.addEventListener("click", () => {
    setDrawingMode("compass");
    updateActiveButton("compass");
  });

  fillBtn!.addEventListener("click", () => {
    setDrawingMode("fill");
    updateActiveButton("fill");
  });
}

export function createSketch(): void {
  // Check if p5 is available globally (browser environment)
  if (typeof p5 === "undefined") {
    console.warn("p5.js is not loaded. Skipping sketch creation.");
    return;
  }

  new p5((p: P5Instance) => {
    p.setup = () => setup(p);
    p.draw = () => draw(p);
    p.mousePressed = () => mousePressed(p);
    p.mouseDragged = () => mouseDragged(p);
    p.mouseReleased = () => mouseReleased();
    p.doubleClicked = () => doubleClicked(p);
  });
}

// Auto-initialize if running in browser
if (typeof window !== "undefined") {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setupModeButtons();
      createSketch();
    });
  } else {
    setupModeButtons();
    createSketch();
  }
}
