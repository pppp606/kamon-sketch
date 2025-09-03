// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const p5 = require('p5');

export function hello(): string {
  return 'Hello World';
}

interface P5Instance {
  createCanvas: (width: number, height: number) => void;
  background: (color: number) => void;
  clear: () => void;
  stroke: (r: number, g?: number, b?: number) => void;
  strokeWeight: (weight: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  fill: (r: number, g?: number, b?: number) => void;
  ellipse: (x: number, y: number, w: number, h?: number) => void;
  setup?: () => void;
  draw?: () => void;
}

export function setup(p: P5Instance): void {
  p.createCanvas(400, 400);
  p.background(220);
}

export function draw(p: P5Instance): void {
  p.clear();
  p.background(220);
  
  // Draw a line
  p.stroke(255, 0, 0);
  p.strokeWeight(2);
  p.line(50, 50, 350, 350);
  
  // Draw a circle (ellipse)
  p.fill(0, 255, 0);
  p.stroke(0);
  p.strokeWeight(1);
  p.ellipse(200, 200, 100, 100);
}

export function createSketch(): void {
  new p5((p: P5Instance) => {
    p.setup = () => setup(p);
    p.draw = () => draw(p);
  });
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined') {
  createSketch();
}