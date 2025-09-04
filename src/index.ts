// eslint-disable-next-line @typescript-eslint/no-var-requires
const p5 = require('p5');
import { CompassArc } from './compassArc';
import { Line } from './line';

type P5Instance = {
  createCanvas: (width: number, height: number) => void;
  background: (color: number) => void;
  clear: () => void;
  stroke: (r: number, g?: number, b?: number) => void;
  strokeWeight: (weight: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  fill: (r: number, g?: number, b?: number) => void;
  ellipse: (x: number, y: number, w: number, h?: number) => void;
  circle: (x: number, y: number, d: number) => void;
  arc: (x: number, y: number, w: number, h: number, start: number, stop: number) => void;
  point: (x: number, y: number) => void;
  push: () => void;
  pop: () => void;
  noFill: () => void;
  mouseX: number;
  mouseY: number;
  mousePressed?: () => void;
  mouseDragged?: () => void;
  mouseReleased?: () => void;
  setup?: () => void;
  draw?: () => void;
};

let compassArc: CompassArc;
let lines: Line[] = [];
let currentLine: Line | null = null;
let drawingMode: 'compass' | 'line' = 'line'; // Default to line mode for MVP

export function hello(): string {
  return 'Hello World';
}

export function setDrawingMode(mode: 'compass' | 'line'): void {
  drawingMode = mode;
  // Reset current drawings when switching modes
  if (compassArc) {
    compassArc.reset();
  }
  currentLine = null;
}

export function getDrawingMode(): 'compass' | 'line' {
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
  compassArc = new CompassArc();
  lines = [];
  currentLine = null;
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
  if (drawingMode === 'compass' && compassArc) {
    compassArc.draw(p);
  }
}

export function mousePressed(p: P5Instance): void {
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
  } else if (drawingMode === 'compass' && compassArc) {
    const state = compassArc.getState();
    
    if (state === 'IDLE') {
      compassArc.setCenter(p.mouseX, p.mouseY);
    } else if (state === 'CENTER_SET') {
      compassArc.setRadius(p.mouseX, p.mouseY);
    } else if (state === 'RADIUS_SET') {
      compassArc.startDrawing();
      compassArc.updateDrawing(p.mouseX, p.mouseY);
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
      if (compassArc.isFullCircle()) {
        compassArc.reset();
      }
    }
  }
  // Line mode doesn't use mouse release events
}

export function getCompassArc() {
  return compassArc;
}

export function createSketch(): void {
  new p5((p: P5Instance) => {
    p.setup = () => setup(p);
    p.draw = () => draw(p);
    p.mousePressed = () => mousePressed(p);
    p.mouseDragged = () => mouseDragged(p);
    p.mouseReleased = () => mouseReleased();
  });
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
  createSketch();
}