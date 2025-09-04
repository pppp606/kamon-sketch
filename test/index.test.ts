import { hello, setup, draw, createSketch, mousePressed, mouseDragged, mouseReleased, getCompassArc } from '../src/index';

interface P5Instance {
  createCanvas: jest.Mock;
  background: jest.Mock;
  clear: jest.Mock;
  stroke: jest.Mock;
  strokeWeight: jest.Mock;
  line: jest.Mock;
  fill: jest.Mock;
  ellipse: jest.Mock;
  circle: jest.Mock;
  arc: jest.Mock;
  point: jest.Mock;
  push: jest.Mock;
  pop: jest.Mock;
  noFill: jest.Mock;
  mouseX: number;
  mouseY: number;
  mousePressed?: jest.Mock;
  mouseDragged?: jest.Mock;
  mouseReleased?: jest.Mock;
  setup?: jest.Mock;
  draw?: jest.Mock;
}

describe('Hello World', () => {
  test('should return Hello World message', () => {
    expect(hello()).toBe('Hello World');
  });
});

describe('p5.js integration', () => {
  let p: P5Instance;

  beforeEach(() => {
    p = {
      createCanvas: jest.fn(),
      background: jest.fn(),
      clear: jest.fn(),
      stroke: jest.fn(),
      strokeWeight: jest.fn(),
      line: jest.fn(),
      fill: jest.fn(),
      ellipse: jest.fn(),
      circle: jest.fn(),
      arc: jest.fn(),
      point: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      noFill: jest.fn(),
      mouseX: 150,
      mouseY: 200,
      mousePressed: jest.fn(),
      mouseDragged: jest.fn(),
      mouseReleased: jest.fn(),
      setup: jest.fn(),
      draw: jest.fn(),
    } as any;
  });

  test('setup should initialize canvas and CompassArc', () => {
    setup(p);
    
    expect(p.createCanvas).toHaveBeenCalledWith(400, 400);
    expect(p.background).toHaveBeenCalledWith(220);
  });

  test('draw should clear canvas and render CompassArc', () => {
    setup(p);
    draw(p);
    
    expect(p.clear).toHaveBeenCalled();
    expect(p.background).toHaveBeenCalledWith(220);
  });

  test('createSketch should set up p5 instance with handlers', () => {
    expect(createSketch).toBeDefined();
    expect(() => createSketch()).not.toThrow();
  });

  describe('mouse interactions', () => {
    beforeEach(() => {
      setup(p);
    });

    test('should set center point on first mouse press', () => {
      p.mouseX = 100;
      p.mouseY = 150;
      
      mousePressed(p);
      
      const arc = getCompassArc();
      expect(arc?.getCenterPoint()).toEqual({ x: 100, y: 150 });
      expect(arc?.getState()).toBe('CENTER_SET');
    });

    test('should set radius point on second mouse press', () => {
      p.mouseX = 100;
      p.mouseY = 150;
      mousePressed(p);
      
      p.mouseX = 200;
      p.mouseY = 150;
      mousePressed(p);
      
      const arc = getCompassArc();
      expect(arc?.getRadiusPoint()).toEqual({ x: 200, y: 150 });
      expect(arc?.getState()).toBe('RADIUS_SET');
    });

    test('should start drawing on third mouse press', () => {
      p.mouseX = 100;
      p.mouseY = 150;
      mousePressed(p);
      
      p.mouseX = 200;
      p.mouseY = 150;
      mousePressed(p);
      
      p.mouseX = 200;
      p.mouseY = 200;
      mousePressed(p);
      
      const arc = getCompassArc();
      expect(arc?.getState()).toBe('DRAWING');
    });

    test('should update drawing position during mouse drag', () => {
      p.mouseX = 100;
      p.mouseY = 150;
      mousePressed(p);
      
      p.mouseX = 200;
      p.mouseY = 150;
      mousePressed(p);
      
      p.mouseX = 200;
      p.mouseY = 200;
      mousePressed(p);
      
      p.mouseX = 250;
      p.mouseY = 200;
      mouseDragged(p);
      
      const arc = getCompassArc();
      expect(arc?.getState()).toBe('DRAWING');
    });

    test('should reset on mouse release after full circle', () => {
      p.mouseX = 100;
      p.mouseY = 150;
      mousePressed(p);
      
      p.mouseX = 200;
      p.mouseY = 150;
      mousePressed(p);
      
      p.mouseX = 200;
      p.mouseY = 200;
      mousePressed(p);
      
      const arc = getCompassArc();
      if (arc) {
        arc.updateDrawing(100, 250);
        arc.updateDrawing(0, 150);
        arc.updateDrawing(100, 50);
        arc.updateDrawing(199, 149);
        
        mouseReleased();
        expect(arc.getState()).toBe('IDLE');
      }
    });

    test('should handle mouse interactions when compassArc is null', () => {
      expect(() => mousePressed(p)).not.toThrow();
      expect(() => mouseDragged(p)).not.toThrow();
      expect(() => mouseReleased()).not.toThrow();
    });
  });
});