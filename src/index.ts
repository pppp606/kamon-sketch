// p5.js is loaded globally via script tag
declare const p5: new (sketch: (p: P5Instance) => void) => void;
import { CompassArc } from './compassArc';
import { Line } from './line';
import { Selection, SelectableElement } from './selection';
import { Fill } from './fill';
import { CompassRadiusState } from './compassRadiusState';
import { History, HistoryState } from './history';
import { UndoRedoButtons } from './undoRedoButtons';
import { P5Instance } from './types/p5';

let compassArc: CompassArc;
let completedArcs: CompassArc[] = [];
let lines: Line[] = [];
let currentLine: Line | null = null;
let drawingMode: 'compass' | 'line' | 'fill' = 'line'; // Default to line mode for MVP
let selection: Selection;
let fill: Fill;
let compassRadiusState: CompassRadiusState;
let history: History;
let undoRedoButtons: UndoRedoButtons;

// Keyboard state
let isShiftPressed = false;
let isInShiftRadiusMode = false; // Track if we're in Shift+click radius setting mode

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
  isInShiftRadiusMode = false; // Clear Shift radius mode state
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
  // Use full window size for canvas
  p.createCanvas(p.windowWidth, p.windowHeight - 100); // Leave space for UI buttons
  p.background(220);
  compassArc = new CompassArc();
  completedArcs = [];
  lines = [];
  currentLine = null;
  selection = new Selection();
  fill = new Fill();
  compassRadiusState = new CompassRadiusState();
  
  // Initialize history system
  history = new History();
  undoRedoButtons = new UndoRedoButtons(history, performUndo, performRedo);
  
  // Save initial empty state
  saveCurrentState();
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
    selection.drawHighlight(p);
  }
}

export function mousePressed(p: P5Instance): void {
  // Handle fill mode first
  if (drawingMode === 'fill' && fill) {
    fill.handleClick(p, p.mouseX, p.mouseY);
    return;
  }
  
  // Handle compass arc drawing with Shift+click support
  if (drawingMode === 'compass' && compassArc) {
    const state = compassArc.getState();
    
    if (state === 'IDLE') {
      selection.setSelectedElement(null); // Clear selection when starting new compass arc
      compassArc.setCenter(p.mouseX, p.mouseY);
      
      // Check if this is Shift+click for radius setting mode
      if (isShiftPressed) {
        isInShiftRadiusMode = true;
      } else {
        isInShiftRadiusMode = false;
      }
      
      // Always stay in CENTER_SET state after setting center
      // Both normal click and Shift+click wait for second click
      return;
    } else if (state === 'CENTER_SET') {
      selection.setSelectedElement(null); // Clear selection when setting radius
      
      if (isShiftPressed || isInShiftRadiusMode) {
        // Shift+click: set new radius point and update stored radius
        compassArc.setRadius(p.mouseX, p.mouseY);
        const newRadius = compassArc.getRadius();
        compassRadiusState.updateRadius(newRadius);
        
        // Clear preview and exit Shift radius mode
        compassArc.clearPreview();
        isInShiftRadiusMode = false;
        
        // Start drawing
        compassArc.startDrawing();
        compassArc.updateDrawing(p.mouseX, p.mouseY);
      } else {
        // Normal click after center set: use current stored radius
        const currentRadius = compassRadiusState.getCurrentRadius();
        compassArc.setRadiusDistance(currentRadius);
        // Start drawing after setting radius with stored value
        compassArc.startDrawing();
        compassArc.updateDrawing(p.mouseX, p.mouseY);
      }
      return;
    }
    // If state is DRAWING, continue to selection logic
  }
  
  // Selection logic (only when not in middle of compass arc creation)
  const selectableElements: SelectableElement[] = [
    ...lines.map(line => ({ type: 'line' as const, element: line })),
    ...completedArcs.map(arc => ({ type: 'arc' as const, element: arc })),
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
      
      // Extract radius from selected element and update CompassRadiusState
      if (closestElement.type === 'line') {
        compassRadiusState.setRadiusFromShape(closestElement.element as Line);
      } else if (closestElement.type === 'arc') {
        compassRadiusState.setRadiusFromShape(closestElement.element as CompassArc);
      }
      
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
      
      // Save state after completing a line
      saveCurrentState();
      
      // Start a new line immediately
      currentLine = new Line();
      currentLine.setFirstPoint(p.mouseX, p.mouseY);
    }
  }
}

export function mouseDragged(p: P5Instance): void {
  if (drawingMode === 'compass' && compassArc) {
    if (compassArc.getState() === 'DRAWING') {
      compassArc.updateDrawing(p.mouseX, p.mouseY);
    }
  }
  // Line mode doesn't use drag for drawing (click-click interaction)
}

export function mouseReleased(): void {
  if (drawingMode === 'compass' && compassArc) {
    if (compassArc.getState() === 'DRAWING') {
      // Save the completed arc before resetting
      const completedArc = compassArc.createCompletedCopy();
      if (completedArc) {
        completedArcs.push(completedArc);
        
        // Save state after completing an arc
        saveCurrentState();
      }
      // Reset to start a new arc
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

export function getIsShiftPressed(): boolean {
  return isShiftPressed;
}

export function getCompassRadiusState(): CompassRadiusState {
  return compassRadiusState;
}

export function saveCurrentState(): void {
  if (history) {
    const currentState: HistoryState = {
      lines: [...lines], // Create a copy of the current lines
      arcs: [...completedArcs] // Create a copy of the current completed arcs
    };
    history.pushHistory(currentState);
    
    // Update button states after saving
    if (undoRedoButtons) {
      undoRedoButtons.updateButtonStates();
    }
  }
}

export function performUndo(): void {
  if (history) {
    const previousState = history.undo();
    if (previousState) {
      // Restore the previous state
      lines = [...previousState.lines];
      completedArcs = [...previousState.arcs];
      
      // Clear any current drawing operations
      currentLine = null;
      if (compassArc) {
        compassArc.reset();
      }
      
      // Clear selection
      if (selection) {
        selection.setSelectedElement(null);
      }
    }
    
    // Always update button states after undo attempt, regardless of result
    if (undoRedoButtons) {
      undoRedoButtons.updateButtonStates();
    }
  }
}

export function performRedo(): void {
  if (history) {
    const nextState = history.redo();
    if (nextState) {
      // Restore the next state
      lines = [...nextState.lines];
      completedArcs = [...nextState.arcs];
      
      // Clear any current drawing operations
      currentLine = null;
      if (compassArc) {
        compassArc.reset();
      }
      
      // Clear selection
      if (selection) {
        selection.setSelectedElement(null);
      }
    }
    
    // Always update button states after redo attempt, regardless of result
    if (undoRedoButtons) {
      undoRedoButtons.updateButtonStates();
    }
  }
}

export function keyPressed(p: P5Instance): void {
  // Update shift key state
  isShiftPressed = p.keyIsDown(p.SHIFT);
  
  // Keyboard shortcuts are handled by native event listeners
  
  // Handle Escape key for canceling operations
  if (p.keyCode === p.ESCAPE) {
    if (drawingMode === 'compass' && compassArc) {
      compassArc.reset();
      isInShiftRadiusMode = false; // Exit Shift radius mode
    }
    if (currentLine) {
      currentLine = null;
    }
    selection.setSelectedElement(null);
  }
}

export function keyReleased(p: P5Instance): void {
  // Update shift key state
  isShiftPressed = p.keyIsDown(p.SHIFT);
}

export function mouseMoved(p: P5Instance): void {
  // Update preview line during Shift+click radius setting mode
  if (drawingMode === 'compass' && compassArc && isInShiftRadiusMode) {
    const state = compassArc.getState();
    if (state === 'CENTER_SET') {
      compassArc.setPreviewPoint(p.mouseX, p.mouseY);
    }
  }
}

export function doubleClicked(p: P5Instance): void {
  // Handle Shift+double-click for compass mode (new functionality)
  if (isShiftPressed && drawingMode === 'compass') {
    const clickPoint = { x: p.mouseX, y: p.mouseY }
    const selectedElement = selection.getSelectedElement()

    // Clear any selection first
    selection.setSelectedElement(null)

    if (selectedElement) {
      // Shift+double-click on selected element: use closest point on element as center,
      // then calculate radius from center to click position and start drawing
      const closestPoint = selection.getClosestPointOnElement(clickPoint, selectedElement)
      if (closestPoint) {
        compassArc.reset()
        // Use setRadiusAndStartDrawing with center at closest point and radius to click position
        compassArc.setCenter(closestPoint.x, closestPoint.y)
        compassArc.setRadiusAndStartDrawing(p.mouseX, p.mouseY)

        // Update stored radius state
        const newRadius = compassArc.getRadius()
        compassRadiusState.updateRadius(newRadius)
      }
    } else {
      // Shift+double-click on empty space: set center at click position,
      // use current stored radius, and start drawing immediately
      compassArc.reset()
      compassArc.setCenter(p.mouseX, p.mouseY)

      // Use current stored radius to set radius point and start drawing immediately
      const currentRadius = compassRadiusState.getCurrentRadius()
      compassArc.setRadiusDistance(currentRadius)
      compassArc.startDrawing()
      compassArc.updateDrawing(p.mouseX, p.mouseY)
    }
    return
  }

  // Handle normal double-click (existing functionality)
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

export function setupModeButtons(): void {
  const lineBtn = document.getElementById('line-btn');
  const compassBtn = document.getElementById('compass-btn');
  const fillBtn = document.getElementById('fill-btn');

  if (!lineBtn || !compassBtn || !fillBtn) {
    return;
  }

  function updateActiveButton(activeMode: 'compass' | 'line' | 'fill'): void {
    // Remove active class from all buttons
    [lineBtn!, compassBtn!, fillBtn!].forEach(btn => btn.classList.remove('active'));
    
    // Add active class to current mode button
    switch (activeMode) {
      case 'line':
        lineBtn!.classList.add('active');
        break;
      case 'compass':
        compassBtn!.classList.add('active');
        break;
      case 'fill':
        fillBtn!.classList.add('active');
        break;
    }
  }

  lineBtn!.addEventListener('click', () => {
    setDrawingMode('line');
    updateActiveButton('line');
  });

  compassBtn!.addEventListener('click', () => {
    setDrawingMode('compass');
    updateActiveButton('compass');
  });

  fillBtn!.addEventListener('click', () => {
    setDrawingMode('fill');
    updateActiveButton('fill');
  });
}

export function createSketch(): void {
  // Check if p5 is available globally (browser environment)
  if (typeof p5 === 'undefined') {
    return;
  }
  
  new p5((p: P5Instance) => {
    p.setup = () => setup(p);
    p.draw = () => draw(p);
    p.mousePressed = () => mousePressed(p);
    p.mouseDragged = () => mouseDragged(p);
    p.mouseReleased = () => mouseReleased();
    p.mouseMoved = () => mouseMoved(p);
    p.doubleClicked = () => doubleClicked(p);
    p.keyPressed = () => keyPressed(p);
    p.keyReleased = () => keyReleased(p);
  });
}

// Add native keyboard event listeners for better key repeat handling
export function setupNativeKeyboardListeners(): void {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey
    
    // Handle Ctrl/Cmd+Z (Undo)
    if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      performUndo()
    }
    // Handle Ctrl/Cmd+Shift+Z (Redo)
    else if (isCtrlOrCmd && e.key === 'z' && e.shiftKey) {
      e.preventDefault()
      performRedo()
    }
    // Handle Ctrl/Cmd+Y (Redo)
    else if (isCtrlOrCmd && e.key === 'y') {
      e.preventDefault()
      performRedo()
    }
  })
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupModeButtons();
      setupNativeKeyboardListeners();
      createSketch();
    });
  } else {
    setupModeButtons();
    setupNativeKeyboardListeners();
    createSketch();
  }
}