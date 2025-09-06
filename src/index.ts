// eslint-disable-next-line @typescript-eslint/no-var-requires
const p5 = require('p5');
import { CompassController } from './compassController';
import { Line } from './line';
import { Selection, SelectableElement } from './selection';
import { Fill } from './fill';
import { P5Instance } from './types/p5';

let compassController: CompassController;
let lines: Line[] = [];
let currentLine: Line | null = null;
let drawingMode: 'compass' | 'line' | 'fill' = 'line'; // Default to line mode for MVP
let selection: Selection;
let fill: Fill;

// Utility function to detect Shift key state
function isShiftPressed(p: P5Instance, event?: { shiftKey?: boolean }): boolean {
  // Check event first (most reliable)
  if (event?.shiftKey !== undefined) {
    return event.shiftKey;
  }
  
  // Fallback to p5.js keyIsDown if available
  if (p.keyIsDown && p.SHIFT !== undefined) {
    return p.keyIsDown(p.SHIFT);
  }
  
  // Final fallback: false (no Shift key detection available)
  return false;
}

export function hello(): string {
  return 'Hello World';
}

export function setDrawingMode(mode: 'compass' | 'line' | 'fill'): void {
  drawingMode = mode;
  // Reset current drawings when switching modes
  if (compassController) {
    compassController.reset();
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
  p.createCanvas(400, 400);
  p.background(220);
  compassController = new CompassController();
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
  
  // Draw current line being created
  if (currentLine) {
    currentLine.draw(p);
  }
  
  // Draw the compass arc (if in compass mode)
  if (drawingMode === 'compass' && compassController) {
    compassController.draw(p);
  }
  
  // Draw selection highlight
  if (selection) {
    selection.drawHighlight(p as Parameters<typeof selection.drawHighlight>[0]);
  }
}

export function mousePressed(p: P5Instance, event?: { shiftKey?: boolean }): void {
  // Handle fill mode first
  if (drawingMode === 'fill' && fill) {
    fill.handleClick(p, p.mouseX, p.mouseY);
    return;
  }
  
  // Handle compass arc drawing first (it has precedence when in progress)
  let compassHandledClick = false;
  if (drawingMode === 'compass' && compassController) {
    const state = compassController.getState();
    
    // Only handle compass clicks immediately if we're not in DRAWING or IDLE state
    if (state !== 'DRAWING' && state !== 'IDLE') {
      // Handle compass controller click (includes Shift+click support)
      const shiftPressed = isShiftPressed(p, event);
      const compassEvent = { shiftKey: shiftPressed };
      compassController.handleClick(p.mouseX, p.mouseY, compassEvent);
      compassHandledClick = true;
      
      // Clear selection when starting compass operations
      if (state === 'SETTING_RADIUS') {
        selection.setSelectedElement(null);
      }
      
      // Return if we handled the click
      return;
    }
    
    // For DRAWING and IDLE states, continue to selection logic first
  }
  
  // Selection logic (only when not in middle of compass arc creation)
  const compassArc = compassController ? compassController.getCompassArc() : null;
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
  
  // Proceed with drawing logic
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
  } else if (drawingMode === 'compass' && compassController && !compassHandledClick) {
    // Handle compass clicks that didn't result in selection
    const shiftPressed = isShiftPressed(p, event);
    const compassEvent = { shiftKey: shiftPressed };
    compassController.handleClick(p.mouseX, p.mouseY, compassEvent);
  }
}

export function mouseDragged(p: P5Instance): void {
  if (drawingMode === 'compass' && compassController) {
    compassController.handleMouseDrag(p.mouseX, p.mouseY);
  }
  // Line mode doesn't use drag for drawing (click-click interaction)
}

export function mouseReleased(p: P5Instance): void {
  if (drawingMode === 'compass' && compassController) {
    compassController.handleMouseRelease(p.mouseX, p.mouseY);
  }
  // Line mode doesn't use mouse release events
}

export function getCompassArc() {
  return compassController ? compassController.getCompassArc() : null;
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
    compassController.reset()
    const compassEvent = { shiftKey: false } // Double-click never uses Shift
    compassController.handleClick(closestPoint.x, closestPoint.y, compassEvent)
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

export function keyPressed(p: P5Instance): void {
  if (p.key === 'Escape') {
    if (drawingMode === 'compass' && compassController) {
      compassController.handleKeyPress('Escape');
    } else if (drawingMode === 'line') {
      // Reset line drawing
      currentLine = null;
    }
  }
}

export function createSketch(): void {
  new p5((p: P5Instance) => {
    p.setup = () => setup(p);
    p.draw = () => draw(p);
    p.mouseDragged = () => mouseDragged(p);
    p.mouseReleased = () => mouseReleased(p);
    p.doubleClicked = () => doubleClicked(p);
    p.keyPressed = () => keyPressed(p);
    p.mousePressed = (event?: { button?: number; shiftKey?: boolean }) => {
      // Handle right-click cancellation
      if (event && event.button === 2) {
        if (drawingMode === 'compass' && compassController) {
          compassController.handleRightClick();
        }
        return false; // Prevent context menu
      }
      mousePressed(p, event);
      return true; // Allow normal processing
    };
  });
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
  createSketch();
}