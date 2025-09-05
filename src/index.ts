// eslint-disable-next-line @typescript-eslint/no-var-requires
const p5 = require('p5');
import { CompassArc } from './compassArc';
import { Line } from './line';
import { Selection, SelectableElement } from './selection';
import { Fill } from './fill';
import { P5Instance } from './types/p5';

let compassArc: CompassArc;
let completedArcs: CompassArc[] = []; // Store completed arcs
let lines: Line[] = [];
let currentLine: Line | null = null;
let drawingMode: 'compass' | 'line' | 'fill' = 'line'; // Default to line mode for MVP
let selection: Selection;
let fill: Fill;

export function hello(): string {
  return 'Hello World';
}

export function setDrawingMode(mode: 'compass' | 'line' | 'fill'): void {
  drawingMode = mode;
  // Reset current drawings when switching modes
  if (compassArc) {
    compassArc.reset();
  }
  currentLine = null;
}

export function getDrawingMode(): 'compass' | 'line' | 'fill' {
  return drawingMode;
}

export function getLines(): Line[] {
  return lines;
}

export function getCurrentLine(): Line | null {
  return currentLine;
}

export function setup(p: P5Instance): void {
  p.createCanvas(800, 800);
  p.background(220);
  compassArc = new CompassArc();
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
  if (drawingMode === 'compass' && compassArc) {
    compassArc.draw(p);
  }
  
  // Draw selection highlight
  if (selection) {
    selection.drawHighlight(p as Parameters<typeof selection.drawHighlight>[0]);
  }
}

export function mousePressed(p: P5Instance): void {
  // Handle fill mode first
  if (drawingMode === 'fill' && fill) {
    fill.handleClick(p, p.mouseX, p.mouseY);
    return;
  }
  
  // Handle compass arc drawing first (it has precedence when in progress)
  if (drawingMode === 'compass' && compassArc) {
    const state = compassArc.getState();
    
    if (state === 'IDLE') {
      selection.setSelectedElement(null); // Clear selection when starting new compass arc
      compassArc.setCenter(p.mouseX, p.mouseY);
      return;
    } else if (state === 'CENTER_SET') {
      selection.setSelectedElement(null); // Clear selection when setting radius
      compassArc.setRadius(p.mouseX, p.mouseY);
      return;
    }
    // If state is DRAWING, continue to selection logic
  }
  
  // Selection logic (only when not in middle of compass arc creation)
  const selectableElements: SelectableElement[] = [
    ...lines.map(line => ({ type: 'line' as const, element: line })),
    ...(compassArc && (compassArc.getState() === 'DRAWING' || compassArc.getState() === 'RADIUS_SET') ? [{ type: 'arc' as const, element: compassArc }] : [])
  ];
  
  const clickPoint = { x: p.mouseX, y: p.mouseY };
  const closestElement = selection.findClosestElement(clickPoint, selectableElements);
  
  // Selection threshold - only select if click is close enough
  const SELECTION_THRESHOLD = 20;
  
  if (closestElement) {
    let distance: number;
    if (closestElement.type === 'line') {
      distance = selection.calculateDistanceToLine(clickPoint, closestElement.element);
    } else {
      distance = selection.calculateDistanceToArc(clickPoint, closestElement.element);
    }
    
    if (distance <= SELECTION_THRESHOLD) {
      selection.setSelectedElement(closestElement);
      return; // Don't proceed with drawing when selecting
    }
  }
  
  // Clear selection if not clicking on an element
  selection.setSelectedElement(null);
  
  // Proceed with line drawing logic
  if (drawingMode === 'line') {
    if (!currentLine) {
      // Start a new line
      currentLine = new Line();
      currentLine.setFirstPoint(p.mouseX, p.mouseY);
    } else if (currentLine.getState() === 'FIRST_POINT') {
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
  if (drawingMode === 'compass' && compassArc) {
    if (compassArc.getState() === 'RADIUS_SET') {
      // Start drawing when dragging begins from RADIUS_SET state
      compassArc.startDrawing();
      compassArc.updateDrawing(p.mouseX, p.mouseY);
    } else if (compassArc.getState() === 'DRAWING') {
      compassArc.updateDrawing(p.mouseX, p.mouseY);
    }
  }
  // Line mode doesn't use drag for drawing (click-click interaction)
}

export function mouseReleased(): void {
  if (drawingMode === 'compass' && compassArc) {
    if (compassArc.getState() === 'DRAWING') {
      // Create a complete copy of the current arc and add to completed arcs
      const completedArc = new CompassArc();
      completedArc.copyFrom(compassArc);
      completedArcs.push(completedArc);
      compassArc.reset();
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
  const selectedElement = selection.getSelectedElement()
  
  if (!selectedElement) {
    return
  }

  const clickPoint = { x: p.mouseX, y: p.mouseY }
  const closestPoint = selection.getClosestPointOnElement(clickPoint, selectedElement)
  
  if (!closestPoint) {
    return
  }

  // Start new drawing from the closest point on the selected element
  if (drawingMode === 'line') {
    // Clear any current line and start new one from the closest point
    currentLine = new Line()
    currentLine.setFirstPoint(closestPoint.x, closestPoint.y)
  } else if (drawingMode === 'compass') {
    // For compass mode, start new arc with center at the closest point
    compassArc.reset()
    compassArc.setCenter(closestPoint.x, closestPoint.y)
  }
  
  // Clear selection after starting new drawing
  selection.setSelectedElement(null)
}

export function startDrawingFromSelectedElement(): boolean {
  const selectedElement = selection.getSelectedElement()
  
  if (!selectedElement) {
    return false
  }

  // For line mode, start a new line from the closest point on the selected element
  if (drawingMode === 'line') {
    // Clear any current line
    currentLine = null
    return true
  }
  
  // For compass mode, we would implement arc-to-arc continuation here
  return false
}

export function createSketch(): void {
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
if (typeof window !== 'undefined') {
  createSketch();
}