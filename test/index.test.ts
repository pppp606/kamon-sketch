import { 
  hello, 
  setup, 
  draw, 
  createSketch, 
  mousePressed, 
  mouseDragged, 
  mouseReleased, 
  doubleClicked,
  getCompassArc,
  setDrawingMode,
  getDrawingMode,
  getLines,
  getCurrentLine,
  getSelection,
  getFill,
  setFillColor,
  getFillColor
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
  width?: number;
  height?: number;
  pixels?: Uint8ClampedArray;
  loadPixels?: jest.Mock;
  updatePixels?: jest.Mock;
  get?: jest.Mock;
  set?: jest.Mock;
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
      windowWidth: 800,
      windowHeight: 600,
      mousePressed: jest.fn(),
      mouseDragged: jest.fn(),
      mouseReleased: jest.fn(),
      setup: jest.fn(),
      draw: jest.fn(),
    } as any;
  });

  test('setup should initialize canvas and CompassArc', () => {
    setup(p);
    
    expect(p.createCanvas).toHaveBeenCalledWith(800, 500);
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
      // After setting radius, it immediately starts drawing
      expect(arc?.getState()).toBe('DRAWING');
    });

    test('should continue drawing state after setting radius', () => {
      // Set center
      p.mouseX = 100;
      p.mouseY = 150;
      mousePressed(p);
      
      // Set radius (and immediately start drawing)
      p.mouseX = 200;
      p.mouseY = 150;
      mousePressed(p);
      
      // Drag to draw
      p.mouseX = 200;
      p.mouseY = 200;
      mouseDragged(p);
      
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

  describe('selection integration', () => {
    beforeEach(() => {
      setup(p);
      setDrawingMode('line');
    });

    test('should initialize selection system during setup', () => {
      setup(p);
      const selection = getSelection();
      expect(selection).toBeDefined();
      expect(selection.getSelectedElement()).toBeNull();
    });

    test('should select a line when clicking near it', () => {
      // Create a line first
      p.mouseX = 100;
      p.mouseY = 100;
      mousePressed(p);
      p.mouseX = 200;
      p.mouseY = 100;
      mousePressed(p);
      
      // Click near the line to select it
      p.mouseX = 150;
      p.mouseY = 105; // 5 pixels away from line
      mousePressed(p);
      
      const selection = getSelection();
      const selectedElement = selection.getSelectedElement();
      expect(selectedElement).not.toBeNull();
      expect(selectedElement?.type).toBe('line');
    });

    test('should not select a line when clicking far from it', () => {
      // Create a line first
      p.mouseX = 100;
      p.mouseY = 100;
      mousePressed(p);
      p.mouseX = 200;
      p.mouseY = 100;
      mousePressed(p);
      
      // Click far from the line
      p.mouseX = 150;
      p.mouseY = 150; // More than threshold distance
      mousePressed(p);
      
      const selection = getSelection();
      expect(selection.getSelectedElement()).toBeNull();
    });

    test('should clear selection when clicking in empty space', () => {
      // Create and select a line
      p.mouseX = 100;
      p.mouseY = 100;
      mousePressed(p);
      p.mouseX = 200;
      p.mouseY = 100;
      mousePressed(p);
      p.mouseX = 150;
      p.mouseY = 105;
      mousePressed(p);
      
      const selection = getSelection();
      expect(selection.getSelectedElement()).not.toBeNull();
      
      // Click in empty space
      p.mouseX = 300;
      p.mouseY = 300;
      mousePressed(p);
      
      expect(selection.getSelectedElement()).toBeNull();
    });

    test('should select closest element when multiple elements are present', () => {
      // Create first line
      p.mouseX = 50;
      p.mouseY = 50;
      mousePressed(p);
      p.mouseX = 150;
      p.mouseY = 50;
      mousePressed(p);
      
      // Create second line
      p.mouseX = 50;
      p.mouseY = 100;
      mousePressed(p);
      
      // Click closer to first line
      p.mouseX = 100;
      p.mouseY = 55; // Closer to first line at y=50
      mousePressed(p);
      
      const selection = getSelection();
      const selectedElement = selection.getSelectedElement();
      expect(selectedElement).not.toBeNull();
      expect(selectedElement?.type).toBe('line');
      
      const lines = getLines();
      expect(selectedElement?.element).toBe(lines[0]); // Should be the first line
    });

    test('should prevent new line drawing when selecting existing element', () => {
      // Create a line first
      p.mouseX = 100;
      p.mouseY = 100;
      mousePressed(p);
      p.mouseX = 200;
      p.mouseY = 100;
      mousePressed(p);
      
      const linesCountBefore = getLines().length;
      
      // Click near the line to select it (should not create new line)
      p.mouseX = 150;
      p.mouseY = 105;
      mousePressed(p);
      
      const linesCountAfter = getLines().length;
      expect(linesCountAfter).toBe(linesCountBefore); // No new line created
      
      const selection = getSelection();
      expect(selection.getSelectedElement()).not.toBeNull();
    });

    test('should render selection highlight during draw', () => {
      // Create and select a line
      p.mouseX = 100;
      p.mouseY = 100;
      mousePressed(p);
      p.mouseX = 200;
      p.mouseY = 100;
      mousePressed(p);
      p.mouseX = 150;
      p.mouseY = 105;
      mousePressed(p);
      
      // Mock the selection's drawHighlight method to track if it's called
      const selection = getSelection();
      const drawHighlightSpy = jest.spyOn(selection, 'drawHighlight');
      
      draw(p);
      
      expect(drawHighlightSpy).toHaveBeenCalledWith(p);
    });
  });

  describe('compass arc selection', () => {
    beforeEach(() => {
      setup(p);
      setDrawingMode('compass');
    });

    test('should select compass arc when clicking near it', () => {
      // Create a compass arc
      p.mouseX = 100;
      p.mouseY = 100;
      mousePressed(p); // Center at (100, 100)
      p.mouseX = 150;
      p.mouseY = 100;
      mousePressed(p); // Radius point at (150, 100), so radius = 50
      p.mouseX = 150;
      p.mouseY = 150;
      mousePressed(p); // Start drawing at (150, 150)
      
      // Click near the arc circle to select it (radius = 50, center = (100, 100))
      // Point (150, 100) should be exactly on the circle
      p.mouseX = 150;
      p.mouseY = 100;
      mousePressed(p);
      
      const selection = getSelection();
      const selectedElement = selection.getSelectedElement();
      expect(selectedElement).not.toBeNull();
      expect(selectedElement?.type).toBe('arc');
    });
  });

  describe('drawing from selected elements', () => {
    beforeEach(() => {
      setup(p);
      setDrawingMode('line');
    });

    test('should start new line from selected line on double click', () => {
      // Create a line first
      p.mouseX = 100;
      p.mouseY = 100;
      mousePressed(p);
      p.mouseX = 200;
      p.mouseY = 100;
      mousePressed(p);

      // Select the line
      p.mouseX = 150;
      p.mouseY = 105;
      mousePressed(p);

      const selection = getSelection();
      expect(selection.getSelectedElement()).not.toBeNull();

      // Double click to start drawing from selected element
      p.mouseX = 150;
      p.mouseY = 105;
      doubleClicked(p);

      // Should clear selection and start new line from closest point
      expect(selection.getSelectedElement()).toBeNull();
      
      const currentLine = getCurrentLine();
      expect(currentLine).not.toBeNull();
      expect(currentLine?.getFirstPoint()?.x).toBeCloseTo(150, 1);
      expect(currentLine?.getFirstPoint()?.y).toBeCloseTo(100, 1); // Projected onto line
    });

    test('should start new compass arc from selected line on double click', () => {
      setDrawingMode('line');
      
      // Create a line first
      p.mouseX = 100;
      p.mouseY = 100;
      mousePressed(p);
      p.mouseX = 200;
      p.mouseY = 100;
      mousePressed(p);

      // Select the line
      p.mouseX = 150;
      p.mouseY = 105;
      mousePressed(p);

      // Switch to compass mode
      setDrawingMode('compass');

      // Double click to start drawing from selected element
      p.mouseX = 150;
      p.mouseY = 105;
      doubleClicked(p);

      const arc = getCompassArc();
      expect(arc?.getState()).toBe('CENTER_SET');
      expect(arc?.getCenterPoint()?.x).toBeCloseTo(150, 1);
      expect(arc?.getCenterPoint()?.y).toBeCloseTo(100, 1);
    });

    test('should not start drawing if no element is selected', () => {
      const selection = getSelection();
      expect(selection.getSelectedElement()).toBeNull();

      const linesBefore = getLines().length;
      const currentLineBefore = getCurrentLine();

      // Double click with no selection
      p.mouseX = 100;
      p.mouseY = 100;
      doubleClicked(p);

      // Nothing should change
      expect(getLines().length).toBe(linesBefore);
      expect(getCurrentLine()).toBe(currentLineBefore);
    });

    test('should start drawing from closest point when double clicking in line mode', () => {
      setDrawingMode('line');

      // Create a line first
      p.mouseX = 100;
      p.mouseY = 100;
      mousePressed(p);
      p.mouseX = 200;
      p.mouseY = 100;
      mousePressed(p);

      // Select the line
      p.mouseX = 150;
      p.mouseY = 105;
      mousePressed(p);

      const selection = getSelection();
      expect(selection.getSelectedElement()).not.toBeNull();

      // Double click to start new line from selected element's closest point
      p.mouseX = 160; // Slightly different position
      p.mouseY = 110;
      doubleClicked(p);

      // Should start new line from the closest point on the selected line
      const currentLine = getCurrentLine();
      expect(currentLine).not.toBeNull();
      expect(currentLine?.getFirstPoint()?.x).toBeCloseTo(160, 1);
      expect(currentLine?.getFirstPoint()?.y).toBeCloseTo(100, 1); // Projected to line y=100
    });
  });

  describe('fill mode integration', () => {
    beforeEach(() => {
      setup(p);
      // Add fill-specific p5 properties
      p.width = 400;
      p.height = 400;
      p.pixels = new Uint8ClampedArray(400 * 400 * 4);
      p.loadPixels = jest.fn();
      p.updatePixels = jest.fn();
      p.get = jest.fn().mockReturnValue([255, 255, 255, 255]); // Default white
      p.set = jest.fn();
    });

    test('should initialize fill system during setup', () => {
      setup(p);
      const fillInstance = getFill();
      expect(fillInstance).toBeDefined();
      expect(getFillColor()).toEqual({ r: 0, g: 0, b: 0 }); // Default black
    });

    test('should switch to fill drawing mode', () => {
      expect(getDrawingMode()).toBe('line');
      
      setDrawingMode('fill');
      expect(getDrawingMode()).toBe('fill');
    });

    test('should set and get fill color', () => {
      const redColor = { r: 255, g: 0, b: 0 };
      setFillColor(redColor);
      expect(getFillColor()).toEqual(redColor);
    });

    test('should handle mouse clicks in fill mode', () => {
      setDrawingMode('fill');
      
      p.mouseX = 200;
      p.mouseY = 200;
      
      // Add pixels array to mock for fill operation
      p.pixels = new Uint8ClampedArray(400 * 400 * 4);
      // Fill with white
      for (let i = 0; i < p.pixels.length; i += 4) {
        p.pixels[i] = 255;
        p.pixels[i + 1] = 255;
        p.pixels[i + 2] = 255;
        p.pixels[i + 3] = 255;
      }
      
      mousePressed(p);
      
      // Should trigger fill operation
      expect(p.loadPixels).toHaveBeenCalled();
      
      const fillInstance = getFill();
      expect(fillInstance.getLastFillLocation()).toEqual({ x: 200, y: 200 });
    });

    test('should not trigger other drawing modes when in fill mode', () => {
      setDrawingMode('fill');
      
      p.mouseX = 100;
      p.mouseY = 100;
      mousePressed(p);
      
      // Should not create lines
      expect(getLines()).toHaveLength(0);
      expect(getCurrentLine()).toBeNull();
      
      // Should not affect compass arc
      const arc = getCompassArc();
      expect(arc?.getState()).toBe('IDLE');
    });

    test('should work with custom fill colors', () => {
      setDrawingMode('fill');
      
      const blueColor = { r: 0, g: 0, b: 255 };
      setFillColor(blueColor);
      
      // Add pixels array to mock for fill operation
      p.pixels = new Uint8ClampedArray(400 * 400 * 4);
      // Fill with white
      for (let i = 0; i < p.pixels.length; i += 4) {
        p.pixels[i] = 255;
        p.pixels[i + 1] = 255;
        p.pixels[i + 2] = 255;
        p.pixels[i + 3] = 255;
      }
      
      p.mouseX = 150;
      p.mouseY = 150;
      mousePressed(p);
      
      expect(getFillColor()).toEqual(blueColor);
      expect(p.loadPixels).toHaveBeenCalled();
    });

    test('should handle boundary cases in fill mode', () => {
      setDrawingMode('fill');
      
      // Click outside canvas bounds
      p.mouseX = -10;
      p.mouseY = 200;
      mousePressed(p);
      
      // Should not crash or cause errors
      expect(() => mousePressed(p)).not.toThrow();
      
      // Click at edge of canvas
      p.mouseX = 399;
      p.mouseY = 399;
      mousePressed(p);
      
      expect(() => mousePressed(p)).not.toThrow();
    });

    test('should reset drawing state when switching to fill mode', () => {
      // Start with line mode and create a line
      setDrawingMode('line');
      p.mouseX = 100;
      p.mouseY = 100;
      mousePressed(p);
      
      expect(getCurrentLine()).not.toBeNull();
      
      // Switch to fill mode
      setDrawingMode('fill');
      
      // Current line should be cleared
      expect(getCurrentLine()).toBeNull();
    });
  });
});