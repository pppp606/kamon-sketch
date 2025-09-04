import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const p5 = require('p5');
import { CompassArc } from './compassArc.js';

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

export function hello(): string {
  return 'Hello World';
}

export function setup(p: P5Instance): void {
  p.createCanvas(400, 400);
  p.background(220);
  compassArc = new CompassArc();
}

export function draw(p: P5Instance): void {
  p.clear();
  p.background(220);
  
  // Draw the compass arc
  if (compassArc) {
    compassArc.draw(p);
  }
}

function mousePressed(p: P5Instance): void {
  if (!compassArc) return;
  
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

function mouseDragged(p: P5Instance): void {
  if (!compassArc) return;
  
  if (compassArc.getState() === 'DRAWING') {
    compassArc.updateDrawing(p.mouseX, p.mouseY);
  }
}

function mouseReleased(): void {
  if (!compassArc) return;
  
  if (compassArc.getState() === 'DRAWING') {
    if (compassArc.isFullCircle()) {
      compassArc.reset();
    }
  }
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