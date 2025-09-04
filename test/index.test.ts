import { 
  hello, 
  setup, 
  draw, 
  createSketch, 
  mousePressed, 
  mouseDragged, 
  mouseReleased, 
  getCompassArc,
  setDrawingMode,
  getDrawingMode,
  getLines,
  getCurrentLine
} from '../src/index';

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

  describe('line drawing mode', () => {
    beforeEach(() => {
      setup(p);
      setDrawingMode('line');
    });

    test('should default to line drawing mode', () => {
      setup(p); // Reset to defaults
      expect(getDrawingMode()).toBe('line');
    });

    test('should set first point on mouse press', () => {
      p.mouseX = 100;
      p.mouseY = 150;
      
      mousePressed(p);
      
      const currentLine = getCurrentLine();
      expect(currentLine?.getFirstPoint()).toEqual({ x: 100, y: 150 });
      expect(currentLine?.getState()).toBe('FIRST_POINT');
    });

    test('should complete line and start new one on second click', () => {
      p.mouseX = 100;
      p.mouseY = 150;
      mousePressed(p);
      
      p.mouseX = 200;
      p.mouseY = 250;
      mousePressed(p);
      
      const lines = getLines();
      expect(lines).toHaveLength(1);
      expect(lines[0].getFirstPoint()).toEqual({ x: 100, y: 150 });
      expect(lines[0].getSecondPoint()).toEqual({ x: 200, y: 250 });
      
      const currentLine = getCurrentLine();
      expect(currentLine?.getFirstPoint()).toEqual({ x: 200, y: 250 });
      expect(currentLine?.getState()).toBe('FIRST_POINT');
    });

    test('should support drawing multiple lines', () => {
      // First line
      p.mouseX = 0;
      p.mouseY = 0;
      mousePressed(p);
      p.mouseX = 100;
      p.mouseY = 100;
      mousePressed(p);
      
      // Second line (starts from end of first)
      p.mouseX = 200;
      p.mouseY = 100;
      mousePressed(p);
      
      // Third line (starts from end of second)
      p.mouseX = 300;
      p.mouseY = 300;
      mousePressed(p);
      
      const lines = getLines();
      expect(lines).toHaveLength(3);
      expect(lines[0].getFirstPoint()).toEqual({ x: 0, y: 0 });
      expect(lines[0].getSecondPoint()).toEqual({ x: 100, y: 100 });
      expect(lines[1].getFirstPoint()).toEqual({ x: 100, y: 100 });
      expect(lines[1].getSecondPoint()).toEqual({ x: 200, y: 100 });
      expect(lines[2].getFirstPoint()).toEqual({ x: 200, y: 100 });
      expect(lines[2].getSecondPoint()).toEqual({ x: 300, y: 300 });
      
      // And there should be a current line ready for the next segment
      const currentLine = getCurrentLine();
      expect(currentLine?.getFirstPoint()).toEqual({ x: 300, y: 300 });
      expect(currentLine?.getState()).toBe('FIRST_POINT');
    });

    test('should not respond to drag events in line mode', () => {
      p.mouseX = 100;
      p.mouseY = 150;
      mousePressed(p);
      
      const beforeDrag = getCurrentLine()?.getFirstPoint();
      
      p.mouseX = 200;
      p.mouseY = 250;
      mouseDragged(p);
      
      const afterDrag = getCurrentLine()?.getFirstPoint();
      expect(afterDrag).toEqual(beforeDrag);
    });

    test('should not respond to release events in line mode', () => {
      p.mouseX = 100;
      p.mouseY = 150;
      mousePressed(p);
      
      const beforeRelease = getCurrentLine()?.getState();
      
      mouseReleased();
      
      const afterRelease = getCurrentLine()?.getState();
      expect(afterRelease).toEqual(beforeRelease);
    });
  });

  describe('drawing mode switching', () => {
    beforeEach(() => {
      setup(p);
    });

    test('should switch between line and compass modes', () => {
      expect(getDrawingMode()).toBe('line');
      
      setDrawingMode('compass');
      expect(getDrawingMode()).toBe('compass');
      
      setDrawingMode('line');
      expect(getDrawingMode()).toBe('line');
    });

    test('should reset compass when switching to line mode', () => {
      setDrawingMode('compass');
      p.mouseX = 100;
      p.mouseY = 150;
      mousePressed(p);
      
      const arc = getCompassArc();
      expect(arc?.getState()).toBe('CENTER_SET');
      
      setDrawingMode('line');
      expect(arc?.getState()).toBe('IDLE');
    });

    test('should clear current line when switching to compass mode', () => {
      setDrawingMode('line');
      p.mouseX = 100;
      p.mouseY = 150;
      mousePressed(p);
      
      expect(getCurrentLine()).not.toBeNull();
      
      setDrawingMode('compass');
      expect(getCurrentLine()).toBeNull();
    });
  });

  describe('compass drawing mode', () => {
    beforeEach(() => {
      setup(p);
      setDrawingMode('compass');
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

    test('should handle drawing interactions correctly in compass mode', () => {
      // Should work in compass mode as before
      p.mouseX = 100;
      p.mouseY = 150;
      mousePressed(p);
      
      p.mouseX = 200;
      p.mouseY = 250;
      mouseDragged(p);
      
      mouseReleased();
      
      const arc = getCompassArc();
      expect(arc?.getState()).toBe('CENTER_SET');
    });
  });
});