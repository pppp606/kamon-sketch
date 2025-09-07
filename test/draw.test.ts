import 'jest-canvas-mock';
import { setup, draw, createSketch } from '../src/index';
import { DivisionMode } from '../src/division';
import { Line } from '../src/line';
import { CompassArc } from '../src/compassArc';

interface P5Instance {
  createCanvas: jest.Mock;
  background: jest.Mock;
  clear: jest.Mock;
  stroke: jest.Mock;
  strokeWeight: jest.Mock;
  line: jest.Mock;
  fill: jest.Mock;
  ellipse: jest.Mock;
  push: jest.Mock;
  pop: jest.Mock;
  noFill: jest.Mock;
}

describe('p5.js Drawing Tests', () => {
  let p: P5Instance;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Create a mock p5 instance
    canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    // Mock p5 methods
    p = {
      createCanvas: jest.fn().mockReturnValue(canvas),
      background: jest.fn(),
      clear: jest.fn(),
      stroke: jest.fn(),
      strokeWeight: jest.fn(),
      line: jest.fn(),
      fill: jest.fn(),
      ellipse: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      noFill: jest.fn(),
      windowWidth: 800,
      windowHeight: 600,
    } as any;
  });

  test('should create canvas with correct dimensions', () => {
    setup(p);
    expect(p.createCanvas).toHaveBeenCalledWith(800, 500);
    expect(p.background).toHaveBeenCalledWith(220);
  });

  test('should clear canvas and set background', () => {
    draw(p);
    
    expect(p.clear).toHaveBeenCalled();
    expect(p.background).toHaveBeenCalledWith(220);
  });

  test('should clear canvas before drawing', () => {
    draw(p);
    
    expect(p.clear).toHaveBeenCalled();
    expect(p.background).toHaveBeenCalledWith(220);
  });

  test('canvas drawing operations snapshot', () => {
    // Create a real canvas context for snapshot testing
    const realCanvas = document.createElement('canvas');
    realCanvas.width = 400;
    realCanvas.height = 400;
    const realCtx = realCanvas.getContext('2d') as CanvasRenderingContext2D;

    // Simulate drawing operations manually for snapshot
    realCtx.clearRect(0, 0, 400, 400);
    realCtx.fillStyle = '#dcdcdc'; // background(220) in p5.js
    realCtx.fillRect(0, 0, 400, 400);
    
    // Draw line (red stroke)
    realCtx.strokeStyle = 'rgb(255, 0, 0)';
    realCtx.lineWidth = 2;
    realCtx.beginPath();
    realCtx.moveTo(50, 50);
    realCtx.lineTo(350, 350);
    realCtx.stroke();
    
    // Draw circle (green fill, black stroke)
    realCtx.fillStyle = 'rgb(0, 255, 0)';
    realCtx.strokeStyle = 'rgb(0, 0, 0)';
    realCtx.lineWidth = 1;
    realCtx.beginPath();
    realCtx.arc(200, 200, 50, 0, 2 * Math.PI);
    realCtx.fill();
    realCtx.stroke();

    // Take snapshot of canvas operations
    const events = (realCtx as any).__getEvents();
    expect(events).toMatchSnapshot();
  });

  test('should create p5.js sketch instance', () => {
    // Test that the function exists and is callable
    expect(typeof createSketch).toBe('function');
    
    // Should not throw errors when called
    expect(() => createSketch()).not.toThrow();
  });
});

describe('Division Point Rendering Tests', () => {
  let p: P5Instance;

  beforeEach(() => {
    // Mock p5 methods for division rendering
    p = {
      createCanvas: jest.fn(),
      background: jest.fn(),
      clear: jest.fn(),
      stroke: jest.fn(),
      strokeWeight: jest.fn(),
      line: jest.fn(),
      fill: jest.fn(),
      ellipse: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      noFill: jest.fn(),
    } as any;
  });

  test('should render division points for Line element', () => {
    const line = new Line();
    line.setFirstPoint(0, 0);
    line.setSecondPoint(100, 0);
    
    const divisionMode = new DivisionMode();
    const element = { type: 'line' as const, element: line };
    
    divisionMode.activate(element, 3); // 3 divisions = 2 division points

    // Draw division points
    divisionMode.draw(p);

    // Verify p5.js methods were called correctly
    expect(p.push).toHaveBeenCalled();
    expect(p.fill).toHaveBeenCalledWith(0, 0, 255); // Blue color by default
    expect(p.strokeWeight).toHaveBeenCalledWith(1);
    expect(p.stroke).toHaveBeenCalledWith(0, 0, 0); // Black outline
    
    // Should draw 2 ellipses at division points - coordinates are rounded due to epsilon precision
    expect(p.ellipse).toHaveBeenCalledTimes(2);
    expect(p.ellipse).toHaveBeenNthCalledWith(1, 33.33, 0, 6, 6); // First division point (rounded)
    expect(p.ellipse).toHaveBeenNthCalledWith(2, 66.67, 0, 6, 6); // Second division point (rounded)
    
    expect(p.pop).toHaveBeenCalled();
  });

  test('should render division points for Arc element', () => {
    const arc = new CompassArc();
    arc.setCenter(0, 0);
    arc.setRadius(60, 0); // Radius of 60
    
    const divisionMode = new DivisionMode();
    const element = { type: 'arc' as const, element: arc };
    
    divisionMode.activate(element, 2); // 2 divisions = 1 division point

    // Draw division points
    divisionMode.draw(p);

    // Verify p5.js methods were called correctly
    expect(p.push).toHaveBeenCalled();
    expect(p.fill).toHaveBeenCalledWith(0, 0, 255); // Blue color by default
    expect(p.strokeWeight).toHaveBeenCalledWith(1);
    expect(p.stroke).toHaveBeenCalledWith(0, 0, 0); // Black outline
    
    // Should draw 1 ellipse at midpoint of radius (30, 0)
    expect(p.ellipse).toHaveBeenCalledTimes(1);
    expect(p.ellipse).toHaveBeenCalledWith(30, 0, 6, 6); // Midpoint of radius
    
    expect(p.pop).toHaveBeenCalled();
  });

  test('should render division points with custom color and size', () => {
    const line = new Line();
    line.setFirstPoint(0, 0);
    line.setSecondPoint(40, 0);
    
    const divisionMode = new DivisionMode();
    const element = { type: 'line' as const, element: line };
    
    divisionMode.activate(element, 4); // 4 divisions = 3 division points

    // Draw with custom color (red) and size (8)
    const customColor = { r: 255, g: 0, b: 0 };
    const customSize = 8;
    divisionMode.draw(p, customColor, customSize);

    // Verify custom parameters were used
    expect(p.fill).toHaveBeenCalledWith(255, 0, 0); // Red color
    
    // Should draw 3 ellipses with custom size
    expect(p.ellipse).toHaveBeenCalledTimes(3);
    expect(p.ellipse).toHaveBeenNthCalledWith(1, 10, 0, 8, 8); // 1/4 point
    expect(p.ellipse).toHaveBeenNthCalledWith(2, 20, 0, 8, 8); // 2/4 point  
    expect(p.ellipse).toHaveBeenNthCalledWith(3, 30, 0, 8, 8); // 3/4 point
  });

  test('should not render when division mode is inactive', () => {
    const divisionMode = new DivisionMode();

    // Try to draw when inactive
    divisionMode.draw(p);

    // Should not call any drawing methods
    expect(p.push).not.toHaveBeenCalled();
    expect(p.fill).not.toHaveBeenCalled();
    expect(p.ellipse).not.toHaveBeenCalled();
    expect(p.pop).not.toHaveBeenCalled();
  });

  test('should not render when no division points exist', () => {
    const line = new Line();
    line.setFirstPoint(0, 0);
    line.setSecondPoint(10, 0);
    
    const divisionMode = new DivisionMode();
    const element = { type: 'line' as const, element: line };
    
    divisionMode.activate(element, 1); // 1 division = 0 division points

    // Try to draw with no division points
    divisionMode.draw(p);

    // Should not call drawing methods when no points to draw
    expect(p.push).not.toHaveBeenCalled();
    expect(p.fill).not.toHaveBeenCalled();
    expect(p.ellipse).not.toHaveBeenCalled();
    expect(p.pop).not.toHaveBeenCalled();
  });

  test('division point rendering canvas snapshot', () => {
    // Create a real canvas context for snapshot testing
    const realCanvas = document.createElement('canvas');
    realCanvas.width = 200;
    realCanvas.height = 100;
    const realCtx = realCanvas.getContext('2d') as CanvasRenderingContext2D;

    // Clear canvas
    realCtx.clearRect(0, 0, 200, 100);
    realCtx.fillStyle = '#f0f0f0'; // Light gray background
    realCtx.fillRect(0, 0, 200, 100);
    
    // Draw a line from (20, 50) to (180, 50) - 160px long
    realCtx.strokeStyle = 'rgb(0, 0, 0)';
    realCtx.lineWidth = 2;
    realCtx.beginPath();
    realCtx.moveTo(20, 50);
    realCtx.lineTo(180, 50);
    realCtx.stroke();
    
    // Draw division points for 4 divisions (3 division points)
    // Points should be at: (60, 50), (100, 50), (140, 50)
    realCtx.fillStyle = 'rgb(0, 0, 255)'; // Blue division points
    realCtx.strokeStyle = 'rgb(0, 0, 0)'; // Black outline
    realCtx.lineWidth = 1;
    
    // Division point 1: x = 20 + (160/4)*1 = 60
    realCtx.beginPath();
    realCtx.arc(60, 50, 3, 0, 2 * Math.PI);
    realCtx.fill();
    realCtx.stroke();
    
    // Division point 2: x = 20 + (160/4)*2 = 100
    realCtx.beginPath();
    realCtx.arc(100, 50, 3, 0, 2 * Math.PI);
    realCtx.fill();
    realCtx.stroke();
    
    // Division point 3: x = 20 + (160/4)*3 = 140
    realCtx.beginPath();
    realCtx.arc(140, 50, 3, 0, 2 * Math.PI);
    realCtx.fill();
    realCtx.stroke();

    // Take snapshot of canvas operations
    const events = (realCtx as any).__getEvents();
    expect(events).toMatchSnapshot('division-points-rendering');
  });
});