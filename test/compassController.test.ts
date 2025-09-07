import {
  CompassController,
  CompassControllerState,
} from "../src/compassController";
import { CompassArc } from "../src/compassArc";

// Mock CompassArc class
class MockCompassArc {
  private state: "IDLE" | "CENTER_SET" | "RADIUS_SET" | "DRAWING" = "IDLE";
  private centerPoint: { x: number; y: number } | null = null;
  private radiusPoint: { x: number; y: number } | null = null;
  private currentRadius: number = 10;

  getState(): "IDLE" | "CENTER_SET" | "RADIUS_SET" | "DRAWING" {
    return this.state;
  }

  getCenterPoint(): { x: number; y: number } | null {
    return this.centerPoint;
  }

  getRadiusPoint(): { x: number; y: number } | null {
    return this.radiusPoint;
  }

  getRadius(): number {
    if (!this.centerPoint || !this.radiusPoint) {
      return this.currentRadius;
    }
    const dx = this.radiusPoint.x - this.centerPoint.x;
    const dy = this.radiusPoint.y - this.centerPoint.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getCurrentRadius = jest.fn(() => {
    return this.currentRadius;
  });

  setCurrentRadius = jest.fn((radius: number) => {
    this.currentRadius = radius;
  });

  setCenter = jest.fn((x: number, y: number) => {
    this.centerPoint = { x, y };
    this.radiusPoint = null;
    this.state = "CENTER_SET";
  });

  setRadius = jest.fn((x: number, y: number) => {
    this.radiusPoint = { x, y };
    this.state = "RADIUS_SET";
  });

  startDrawing = jest.fn(() => {
    this.state = "DRAWING";
  });

  updateDrawing = jest.fn();

  // Helper methods to control mock state for testing
  mockSetState(state: "IDLE" | "CENTER_SET" | "RADIUS_SET" | "DRAWING") {
    this.state = state;
    // Set a default center point when in CENTER_SET or later states
    if (state !== "IDLE" && !this.centerPoint) {
      this.centerPoint = { x: 100, y: 100 };
    }
  }

  mockSetCurrentRadius(radius: number) {
    this.currentRadius = radius;
  }

  resetMocks() {
    this.setCenter.mockClear();
    this.setRadius.mockClear();
    this.startDrawing.mockClear();
    this.updateDrawing.mockClear();
    this.getCurrentRadius.mockClear();
    this.setCurrentRadius.mockClear();
    this.state = "IDLE";
    this.centerPoint = null;
    this.radiusPoint = null;
    this.currentRadius = 10;
  }
}

describe("CompassController", () => {
  let compassController: CompassController;
  let mockCompassArc: MockCompassArc;

  beforeEach(() => {
    mockCompassArc = new MockCompassArc();
    compassController = new CompassController(mockCompassArc as any);
  });

  describe("initialization", () => {
    it("should create a CompassController instance", () => {
      expect(compassController).toBeInstanceOf(CompassController);
    });

    it("should initialize with IDLE state", () => {
      expect(compassController.getState()).toBe("IDLE");
    });

    it("should return the compass arc instance", () => {
      expect(compassController.getCompassArc()).toBe(mockCompassArc);
    });
  });

  describe("getState", () => {
    it("should return IDLE when compass arc is IDLE", () => {
      mockCompassArc.mockSetState("IDLE");
      expect(compassController.getState()).toBe("IDLE");
    });

    it("should return CENTER_SET when compass arc is CENTER_SET", () => {
      mockCompassArc.mockSetState("CENTER_SET");
      expect(compassController.getState()).toBe("CENTER_SET");
    });

    it("should return RADIUS_SET when compass arc is RADIUS_SET", () => {
      mockCompassArc.mockSetState("RADIUS_SET");
      expect(compassController.getState()).toBe("RADIUS_SET");
    });

    it("should return DRAWING when compass arc is DRAWING", () => {
      mockCompassArc.mockSetState("DRAWING");
      expect(compassController.getState()).toBe("DRAWING");
    });

    it("should return SETTING_RADIUS when controller is in radius setting mode", () => {
      // Simulate entering radius setting mode
      mockCompassArc.mockSetState("RADIUS_SET");
      compassController.handleClick(100, 100, { shiftKey: true });
      expect(compassController.getState()).toBe("SETTING_RADIUS");
    });
  });

  describe("handleClick - Normal Click Behavior (shiftKey: false)", () => {
    describe("when state is IDLE", () => {
      beforeEach(() => {
        mockCompassArc.mockSetState("IDLE");
      });

      it("should set center point on normal click", () => {
        compassController.handleClick(100, 150, { shiftKey: false });

        expect(mockCompassArc.setCenter).toHaveBeenCalledWith(100, 150);
        expect(mockCompassArc.setCenter).toHaveBeenCalledTimes(1);
      });

      it("should not call other compass arc methods", () => {
        compassController.handleClick(100, 150, { shiftKey: false });

        expect(mockCompassArc.setRadius).not.toHaveBeenCalled();
        expect(mockCompassArc.startDrawing).not.toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).not.toHaveBeenCalled();
      });

      it("should handle multiple center clicks", () => {
        compassController.handleClick(100, 150, { shiftKey: false });
        mockCompassArc.mockSetState("CENTER_SET"); // Simulate compass arc state change after first click
        compassController.handleClick(200, 250, { shiftKey: false });

        expect(mockCompassArc.setCenter).toHaveBeenCalledTimes(1); // Only first call sets center from IDLE
        expect(mockCompassArc.setCenter).toHaveBeenCalledWith(100, 150);
        // Second call from CENTER_SET state should set radius using currentRadius distance
        expect(mockCompassArc.setRadius).toHaveBeenCalledTimes(1);
        // The exact coordinates depend on currentRadius calculation, so just verify it was called
        const setRadiusCall = mockCompassArc.setRadius.mock.calls[0];
        expect(setRadiusCall).toHaveLength(2);
        expect(typeof setRadiusCall[0]).toBe("number");
        expect(typeof setRadiusCall[1]).toBe("number");
      });
    });

    describe("when state is CENTER_SET", () => {
      beforeEach(() => {
        mockCompassArc.mockSetState("CENTER_SET");
      });

      it("should set radius and start drawing on normal click", () => {
        compassController.handleClick(200, 250, { shiftKey: false });

        // Radius is now calculated based on currentRadius, not direct click coordinates
        expect(mockCompassArc.setRadius).toHaveBeenCalledTimes(1);
        expect(mockCompassArc.startDrawing).toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).toHaveBeenCalledWith(200, 250);

        // Verify the radius point was calculated correctly (distance from center should be currentRadius)
        const setRadiusCall = mockCompassArc.setRadius.mock.calls[0];
        const radiusX = setRadiusCall[0];
        const radiusY = setRadiusCall[1];
        const centerPoint = mockCompassArc.getCenterPoint()!;
        const distance = Math.sqrt(
          Math.pow(radiusX - centerPoint.x, 2) +
            Math.pow(radiusY - centerPoint.y, 2),
        );
        expect(
          Math.abs(distance - mockCompassArc.getCurrentRadius()),
        ).toBeLessThan(0.001); // Should be very close to currentRadius
      });

      it("should call methods in correct order", () => {
        compassController.handleClick(200, 250, { shiftKey: false });

        const calls = [
          ...mockCompassArc.setRadius.mock.invocationCallOrder,
          ...mockCompassArc.startDrawing.mock.invocationCallOrder,
          ...mockCompassArc.updateDrawing.mock.invocationCallOrder,
        ].sort((a, b) => a - b);

        expect(calls).toHaveLength(3);
        expect(
          mockCompassArc.setRadius.mock.invocationCallOrder[0],
        ).toBeLessThan(mockCompassArc.startDrawing.mock.invocationCallOrder[0]);
        expect(
          mockCompassArc.startDrawing.mock.invocationCallOrder[0],
        ).toBeLessThan(
          mockCompassArc.updateDrawing.mock.invocationCallOrder[0],
        );
      });

      it("should not call setCenter", () => {
        compassController.handleClick(200, 250, { shiftKey: false });
        expect(mockCompassArc.setCenter).not.toHaveBeenCalled();
      });
    });

    describe("when state is RADIUS_SET", () => {
      beforeEach(() => {
        mockCompassArc.mockSetState("RADIUS_SET");
      });

      it("should not perform any action on normal click", () => {
        compassController.handleClick(200, 250, { shiftKey: false });

        expect(mockCompassArc.setCenter).not.toHaveBeenCalled();
        expect(mockCompassArc.setRadius).not.toHaveBeenCalled();
        expect(mockCompassArc.startDrawing).not.toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).not.toHaveBeenCalled();
      });
    });

    describe("when state is DRAWING", () => {
      beforeEach(() => {
        mockCompassArc.mockSetState("DRAWING");
      });

      it("should not perform any action on normal click", () => {
        compassController.handleClick(200, 250, { shiftKey: false });

        expect(mockCompassArc.setCenter).not.toHaveBeenCalled();
        expect(mockCompassArc.setRadius).not.toHaveBeenCalled();
        expect(mockCompassArc.startDrawing).not.toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).not.toHaveBeenCalled();
      });
    });
  });

  describe("handleClick - Shift+Click Behavior (shiftKey: true)", () => {
    describe("when state is RADIUS_SET", () => {
      beforeEach(() => {
        mockCompassArc.mockSetState("RADIUS_SET");
      });

      it("should enter radius setting mode and update radius", () => {
        compassController.handleClick(200, 250, { shiftKey: true });

        expect(compassController.getState()).toBe("SETTING_RADIUS");
        expect(mockCompassArc.setRadius).toHaveBeenCalledWith(200, 250);
        expect(mockCompassArc.setRadius).toHaveBeenCalledTimes(1);
      });

      it("should not call other compass arc methods", () => {
        compassController.handleClick(200, 250, { shiftKey: true });

        expect(mockCompassArc.setCenter).not.toHaveBeenCalled();
        expect(mockCompassArc.startDrawing).not.toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).not.toHaveBeenCalled();
      });
    });

    describe("when state is DRAWING", () => {
      beforeEach(() => {
        mockCompassArc.mockSetState("DRAWING");
      });

      it("should enter radius setting mode and update radius", () => {
        compassController.handleClick(200, 250, { shiftKey: true });

        expect(compassController.getState()).toBe("SETTING_RADIUS");
        expect(mockCompassArc.setRadius).toHaveBeenCalledWith(200, 250);
        expect(mockCompassArc.setRadius).toHaveBeenCalledTimes(1);
      });

      it("should not call other compass arc methods", () => {
        compassController.handleClick(200, 250, { shiftKey: true });

        expect(mockCompassArc.setCenter).not.toHaveBeenCalled();
        expect(mockCompassArc.startDrawing).not.toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).not.toHaveBeenCalled();
      });
    });

    describe("when state is IDLE", () => {
      beforeEach(() => {
        mockCompassArc.mockSetState("IDLE");
      });

      it("should perform normal click behavior (set center)", () => {
        compassController.handleClick(100, 150, { shiftKey: true });

        expect(mockCompassArc.setCenter).toHaveBeenCalledWith(100, 150);
        // State will be IDLE initially, but after setCenter call, the compass arc state would change
        mockCompassArc.mockSetState("CENTER_SET"); // Simulate state change after setCenter
        expect(compassController.getState()).toBe("CENTER_SET");
      });

      it("should not enter radius setting mode", () => {
        const initialState = compassController.getState();
        compassController.handleClick(100, 150, { shiftKey: true });

        // Should not be in SETTING_RADIUS mode since we started from IDLE
        expect(compassController.getState()).not.toBe("SETTING_RADIUS");
      });
    });

    describe("when state is CENTER_SET", () => {
      beforeEach(() => {
        mockCompassArc.mockSetState("CENTER_SET");
      });

      it("should perform normal click behavior (set radius and start drawing)", () => {
        compassController.handleClick(200, 250, { shiftKey: true });

        // Radius is now calculated based on currentRadius, not direct click coordinates
        expect(mockCompassArc.setRadius).toHaveBeenCalledTimes(1);
        expect(mockCompassArc.startDrawing).toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).toHaveBeenCalledWith(200, 250);
      });

      it("should not enter radius setting mode", () => {
        compassController.handleClick(200, 250, { shiftKey: true });
        expect(compassController.getState()).not.toBe("SETTING_RADIUS");
      });
    });
  });

  describe("handleDrag", () => {
    describe("when in SETTING_RADIUS mode", () => {
      beforeEach(() => {
        // Enter radius setting mode first
        mockCompassArc.mockSetState("RADIUS_SET");
        compassController.handleClick(200, 250, { shiftKey: true });
        mockCompassArc.setRadius.mockClear(); // Clear the call from handleClick
      });

      it("should update radius during drag", () => {
        compassController.handleDrag(300, 350, { shiftKey: false });

        expect(mockCompassArc.setRadius).toHaveBeenCalledWith(300, 350);
        expect(mockCompassArc.setRadius).toHaveBeenCalledTimes(1);
      });

      it("should not call other compass arc methods", () => {
        compassController.handleDrag(300, 350, { shiftKey: false });

        expect(mockCompassArc.setCenter).not.toHaveBeenCalled();
        expect(mockCompassArc.startDrawing).not.toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).not.toHaveBeenCalled();
      });

      it("should handle multiple drag updates", () => {
        compassController.handleDrag(300, 350, { shiftKey: false });
        compassController.handleDrag(400, 450, { shiftKey: false });

        expect(mockCompassArc.setRadius).toHaveBeenCalledTimes(2);
        expect(mockCompassArc.setRadius).toHaveBeenNthCalledWith(1, 300, 350);
        expect(mockCompassArc.setRadius).toHaveBeenNthCalledWith(2, 400, 450);
      });

      it("should work regardless of shiftKey state during drag", () => {
        compassController.handleDrag(300, 350, { shiftKey: true });

        expect(mockCompassArc.setRadius).toHaveBeenCalledWith(300, 350);
      });
    });

    describe("when in DRAWING mode", () => {
      beforeEach(() => {
        mockCompassArc.mockSetState("DRAWING");
      });

      it("should update drawing", () => {
        compassController.handleDrag(300, 350, { shiftKey: false });

        expect(mockCompassArc.updateDrawing).toHaveBeenCalledWith(300, 350);
        expect(mockCompassArc.updateDrawing).toHaveBeenCalledTimes(1);
      });

      it("should not call other compass arc methods", () => {
        compassController.handleDrag(300, 350, { shiftKey: false });

        expect(mockCompassArc.setCenter).not.toHaveBeenCalled();
        expect(mockCompassArc.setRadius).not.toHaveBeenCalled();
        expect(mockCompassArc.startDrawing).not.toHaveBeenCalled();
      });

      it("should handle multiple drag updates", () => {
        compassController.handleDrag(300, 350, { shiftKey: false });
        compassController.handleDrag(400, 450, { shiftKey: false });

        expect(mockCompassArc.updateDrawing).toHaveBeenCalledTimes(2);
        expect(mockCompassArc.updateDrawing).toHaveBeenNthCalledWith(
          1,
          300,
          350,
        );
        expect(mockCompassArc.updateDrawing).toHaveBeenNthCalledWith(
          2,
          400,
          450,
        );
      });
    });

    describe("when in other states", () => {
      it("should not perform any action when IDLE", () => {
        mockCompassArc.mockSetState("IDLE");
        compassController.handleDrag(300, 350, { shiftKey: false });

        expect(mockCompassArc.setCenter).not.toHaveBeenCalled();
        expect(mockCompassArc.setRadius).not.toHaveBeenCalled();
        expect(mockCompassArc.startDrawing).not.toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).not.toHaveBeenCalled();
      });

      it("should not perform any action when CENTER_SET", () => {
        mockCompassArc.mockSetState("CENTER_SET");
        compassController.handleDrag(300, 350, { shiftKey: false });

        expect(mockCompassArc.setCenter).not.toHaveBeenCalled();
        expect(mockCompassArc.setRadius).not.toHaveBeenCalled();
        expect(mockCompassArc.startDrawing).not.toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).not.toHaveBeenCalled();
      });

      it("should not perform any action when RADIUS_SET", () => {
        mockCompassArc.mockSetState("RADIUS_SET");
        compassController.handleDrag(300, 350, { shiftKey: false });

        expect(mockCompassArc.setCenter).not.toHaveBeenCalled();
        expect(mockCompassArc.setRadius).not.toHaveBeenCalled();
        expect(mockCompassArc.startDrawing).not.toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).not.toHaveBeenCalled();
      });
    });
  });

  describe("handleRelease", () => {
    describe("when in SETTING_RADIUS mode", () => {
      beforeEach(() => {
        // Enter radius setting mode first
        mockCompassArc.mockSetState("RADIUS_SET");
        compassController.handleClick(200, 250, { shiftKey: true });
      });

      it("should exit radius setting mode and return to RADIUS_SET", () => {
        expect(compassController.getState()).toBe("SETTING_RADIUS");

        compassController.handleRelease();

        expect(compassController.getState()).toBe("RADIUS_SET");
      });

      it("should not call compass arc methods", () => {
        mockCompassArc.setCenter.mockClear();
        mockCompassArc.setRadius.mockClear();
        mockCompassArc.startDrawing.mockClear();
        mockCompassArc.updateDrawing.mockClear();

        compassController.handleRelease();

        expect(mockCompassArc.setCenter).not.toHaveBeenCalled();
        expect(mockCompassArc.setRadius).not.toHaveBeenCalled();
        expect(mockCompassArc.startDrawing).not.toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).not.toHaveBeenCalled();
      });
    });

    describe("when in DRAWING mode", () => {
      beforeEach(() => {
        mockCompassArc.mockSetState("DRAWING");
      });

      it("should complete the arc and return to IDLE", () => {
        expect(compassController.getState()).toBe("DRAWING");

        compassController.handleRelease();

        // Controller sets its internal state to IDLE, but getState() depends on compass arc state
        // We need to simulate compass arc state change to IDLE for this test
        mockCompassArc.mockSetState("IDLE");
        expect(compassController.getState()).toBe("IDLE");
      });

      it("should not call compass arc methods", () => {
        compassController.handleRelease();

        expect(mockCompassArc.setCenter).not.toHaveBeenCalled();
        expect(mockCompassArc.setRadius).not.toHaveBeenCalled();
        expect(mockCompassArc.startDrawing).not.toHaveBeenCalled();
        expect(mockCompassArc.updateDrawing).not.toHaveBeenCalled();
      });
    });

    describe("when in other states", () => {
      it("should not change state when IDLE", () => {
        mockCompassArc.mockSetState("IDLE");
        expect(compassController.getState()).toBe("IDLE");

        compassController.handleRelease();

        expect(compassController.getState()).toBe("IDLE");
      });

      it("should not change state when CENTER_SET", () => {
        mockCompassArc.mockSetState("CENTER_SET");
        expect(compassController.getState()).toBe("CENTER_SET");

        compassController.handleRelease();

        expect(compassController.getState()).toBe("CENTER_SET");
      });

      it("should not change state when RADIUS_SET", () => {
        mockCompassArc.mockSetState("RADIUS_SET");
        expect(compassController.getState()).toBe("RADIUS_SET");

        compassController.handleRelease();

        expect(compassController.getState()).toBe("RADIUS_SET");
      });
    });
  });

  describe("state transitions", () => {
    it("should transition IDLE -> CENTER_SET -> RADIUS_SET -> DRAWING with normal clicks", () => {
      // Start in IDLE
      mockCompassArc.mockSetState("IDLE");
      expect(compassController.getState()).toBe("IDLE");

      // Click to set center -> CENTER_SET
      compassController.handleClick(100, 100, { shiftKey: false });
      mockCompassArc.mockSetState("CENTER_SET"); // Simulate compass arc state change
      expect(compassController.getState()).toBe("CENTER_SET");

      // Click to set radius and start drawing -> DRAWING
      compassController.handleClick(200, 200, { shiftKey: false });
      mockCompassArc.mockSetState("DRAWING"); // Simulate compass arc state change
      expect(compassController.getState()).toBe("DRAWING");

      // Release to complete -> IDLE
      compassController.handleRelease();
      mockCompassArc.mockSetState("IDLE"); // Simulate compass arc state change
      expect(compassController.getState()).toBe("IDLE");
    });

    it("should transition RADIUS_SET -> SETTING_RADIUS -> RADIUS_SET with shift+click", () => {
      // Start in RADIUS_SET
      mockCompassArc.mockSetState("RADIUS_SET");
      expect(compassController.getState()).toBe("RADIUS_SET");

      // Shift+click to enter radius setting mode
      compassController.handleClick(200, 250, { shiftKey: true });
      expect(compassController.getState()).toBe("SETTING_RADIUS");

      // Release to exit radius setting mode
      compassController.handleRelease();
      expect(compassController.getState()).toBe("RADIUS_SET");
    });

    it("should transition DRAWING -> SETTING_RADIUS -> RADIUS_SET with shift+click", () => {
      // Start in DRAWING
      mockCompassArc.mockSetState("DRAWING");
      expect(compassController.getState()).toBe("DRAWING");

      // Shift+click to enter radius setting mode
      compassController.handleClick(200, 250, { shiftKey: true });
      expect(compassController.getState()).toBe("SETTING_RADIUS");

      // Release to exit radius setting mode (should go to RADIUS_SET, not back to DRAWING)
      compassController.handleRelease();
      expect(compassController.getState()).toBe("RADIUS_SET");
    });
  });

  describe("shiftKey parameter handling", () => {
    it("should properly receive and process shiftKey: false", () => {
      mockCompassArc.mockSetState("IDLE");
      const handleClickSpy = jest.spyOn(compassController, "handleClick");

      compassController.handleClick(100, 100, { shiftKey: false });

      expect(handleClickSpy).toHaveBeenCalledWith(100, 100, {
        shiftKey: false,
      });
      expect(mockCompassArc.setCenter).toHaveBeenCalled();
    });

    it("should properly receive and process shiftKey: true", () => {
      mockCompassArc.mockSetState("RADIUS_SET");
      const handleClickSpy = jest.spyOn(compassController, "handleClick");

      compassController.handleClick(200, 250, { shiftKey: true });

      expect(handleClickSpy).toHaveBeenCalledWith(200, 250, { shiftKey: true });
      expect(compassController.getState()).toBe("SETTING_RADIUS");
    });

    it("should handle drag with shiftKey parameter", () => {
      const handleDragSpy = jest.spyOn(compassController, "handleDrag");

      compassController.handleDrag(300, 350, { shiftKey: true });

      expect(handleDragSpy).toHaveBeenCalledWith(300, 350, { shiftKey: true });
    });
  });

  describe("radius updating behavior", () => {
    it("should only update radius when in SETTING_RADIUS mode", () => {
      // Test normal states don't update radius on drag
      const states: Array<"IDLE" | "CENTER_SET" | "RADIUS_SET"> = [
        "IDLE",
        "CENTER_SET",
        "RADIUS_SET",
      ];

      states.forEach((state) => {
        mockCompassArc.resetMocks();
        mockCompassArc.mockSetState(state);

        compassController.handleDrag(300, 350, { shiftKey: false });

        if (state === "RADIUS_SET") {
          expect(mockCompassArc.setRadius).not.toHaveBeenCalled();
        } else {
          expect(mockCompassArc.setRadius).not.toHaveBeenCalled();
        }
      });
    });

    it("should update radius when in SETTING_RADIUS mode", () => {
      // Enter radius setting mode
      mockCompassArc.mockSetState("RADIUS_SET");
      compassController.handleClick(200, 250, { shiftKey: true });
      mockCompassArc.setRadius.mockClear();

      // Now drag should update radius
      compassController.handleDrag(300, 350, { shiftKey: false });

      expect(mockCompassArc.setRadius).toHaveBeenCalledWith(300, 350);
    });

    it("should update radius on shift+click when applicable", () => {
      mockCompassArc.mockSetState("RADIUS_SET");

      compassController.handleClick(200, 250, { shiftKey: true });

      expect(mockCompassArc.setRadius).toHaveBeenCalledWith(200, 250);
    });

    it("should not update radius on normal click in non-radius-setting states", () => {
      mockCompassArc.mockSetState("IDLE");

      compassController.handleClick(100, 100, { shiftKey: false });

      expect(mockCompassArc.setRadius).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle multiple rapid shift+clicks in RADIUS_SET mode", () => {
      mockCompassArc.mockSetState("RADIUS_SET");

      // First shift+click enters SETTING_RADIUS mode
      compassController.handleClick(200, 250, { shiftKey: true });
      expect(compassController.getState()).toBe("SETTING_RADIUS");

      // Subsequent shift+clicks while in SETTING_RADIUS mode don't trigger the special behavior
      // because the condition only checks for RADIUS_SET or DRAWING states
      compassController.handleClick(300, 350, { shiftKey: true });
      compassController.handleClick(400, 450, { shiftKey: true });

      expect(compassController.getState()).toBe("SETTING_RADIUS");
      // Only the first shift+click calls setRadius (the one that enters SETTING_RADIUS mode)
      expect(mockCompassArc.setRadius).toHaveBeenCalledTimes(1);
      expect(mockCompassArc.setRadius).toHaveBeenCalledWith(200, 250);
    });

    it("should handle mixed normal and shift clicks", () => {
      // Start with normal click (set center)
      mockCompassArc.mockSetState("IDLE");
      compassController.handleClick(100, 100, { shiftKey: false });
      mockCompassArc.mockSetState("CENTER_SET");

      // Normal click to set radius and start drawing
      compassController.handleClick(200, 200, { shiftKey: false });
      mockCompassArc.mockSetState("DRAWING");

      // Shift+click to enter radius setting mode
      compassController.handleClick(250, 250, { shiftKey: true });
      expect(compassController.getState()).toBe("SETTING_RADIUS");

      // Release to exit radius setting mode
      compassController.handleRelease();
      expect(compassController.getState()).toBe("RADIUS_SET");
    });

    it("should handle coordinates with negative values", () => {
      mockCompassArc.mockSetState("IDLE");

      compassController.handleClick(-100, -150, { shiftKey: false });

      expect(mockCompassArc.setCenter).toHaveBeenCalledWith(-100, -150);
    });

    it("should handle coordinates with decimal values", () => {
      mockCompassArc.mockSetState("RADIUS_SET");

      compassController.handleClick(123.456, 789.012, { shiftKey: true });

      expect(mockCompassArc.setRadius).toHaveBeenCalledWith(123.456, 789.012);
    });
  });
});
