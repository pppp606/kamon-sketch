import 'jest-canvas-mock';
import { setup, draw, createSketch } from '../src/index';

interface P5Instance {
  createCanvas: jest.Mock;
  background: jest.Mock;
  clear: jest.Mock;
  stroke: jest.Mock;
  strokeWeight: jest.Mock;
  line: jest.Mock;
  fill: jest.Mock;
  ellipse: jest.Mock;
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
    } as any;
  });

  test('should create canvas with correct dimensions', () => {
    setup(p);
    expect(p.createCanvas).toHaveBeenCalledWith(400, 400);
    expect(p.background).toHaveBeenCalledWith(220);
  });

  test('should draw line with correct parameters', () => {
    draw(p);
    
    expect(p.clear).toHaveBeenCalled();
    expect(p.background).toHaveBeenCalledWith(220);
    
    // Verify line drawing
    expect(p.stroke).toHaveBeenCalledWith(255, 0, 0);
    expect(p.strokeWeight).toHaveBeenCalledWith(2);
    expect(p.line).toHaveBeenCalledWith(50, 50, 350, 350);
  });

  test('should draw circle with correct parameters', () => {
    draw(p);
    
    // Verify circle drawing
    expect(p.fill).toHaveBeenCalledWith(0, 255, 0);
    expect(p.stroke).toHaveBeenCalledWith(0);
    expect(p.strokeWeight).toHaveBeenCalledWith(1);
    expect(p.ellipse).toHaveBeenCalledWith(200, 200, 100, 100);
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