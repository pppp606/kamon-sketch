export interface P5Instance {
  createCanvas: (width: number, height: number) => void
  background: (color: number) => void
  clear: () => void
  stroke: (r: number, g?: number, b?: number) => void
  strokeWeight: (weight: number) => void
  line: (x1: number, y1: number, x2: number, y2: number) => void
  fill: (r: number, g?: number, b?: number) => void
  ellipse: (x: number, y: number, w: number, h?: number) => void
  circle: (x: number, y: number, d: number) => void
  arc: (x: number, y: number, w: number, h: number, start: number, stop: number) => void
  point: (x: number, y: number) => void
  push: () => void
  pop: () => void
  noFill: () => void
  noStroke: () => void
  rect: (x: number, y: number, w: number, h: number) => void
  mouseX: number
  mouseY: number
  mousePressed?: () => void
  mouseDragged?: () => void
  mouseReleased?: () => void
  doubleClicked?: () => void
  keyPressed?: () => void
  setup?: () => void
  draw?: () => void
  key: string
  width: number
  height: number
  pixels: Uint8ClampedArray
  loadPixels: () => void
  updatePixels: () => void
  get: (x: number, y: number) => number[]
  set: (x: number, y: number, color: number[]) => void
}