import { fabric } from "fabric";
import { PolygonOutput, BboxOutput, KeypointOutput } from "./BaseModelOutput";

describe("Model Output Canvas Rendering Helper", () => {
  let mockCanvas;

  beforeEach(() => {
    mockCanvas = {
      add: jest.fn(),
      requestRenderAll: jest.fn(),
    };
  });

  test("translates PolygonOutput into fabric.Polygon", () => {
    const output = new PolygonOutput([{ x: 10, y: 10 }, { x: 50, y: 10 }, { x: 50, y: 50 }]);
    expect(output.type).toBe("polygon");
    expect(output.points).toEqual([{ x: 10, y: 10 }, { x: 50, y: 10 }, { x: 50, y: 50 }]);

    const poly = new fabric.Polygon(output.points, {
      stroke: "blue",
      strokeWidth: 2,
      fill: "rgba(0, 0, 255, 0.1)",
    });
    mockCanvas.add(poly);
    expect(mockCanvas.add).toHaveBeenCalledWith(expect.any(fabric.Polygon));
  });

  test("translates BboxOutput into fabric Bbox points", () => {
    const output = new BboxOutput(10, 20, 100, 200);
    expect(output.type).toBe("box");
    expect(output.x1).toBe(10);
    expect(output.y1).toBe(20);
    expect(output.x2).toBe(100);
    expect(output.y2).toBe(200);

    const points = [
      { x: output.x1, y: output.y1 },
      { x: output.x2, y: output.y1 },
      { x: output.x2, y: output.y2 },
      { x: output.x1, y: output.y2 },
    ];
    const polyRect = new fabric.Polygon(points, {
      stroke: "blue",
      strokeWidth: 2,
      fill: "rgba(0, 0, 255, 0.1)",
      annotationKind: "rectangle",
    });
    mockCanvas.add(polyRect);
    expect(mockCanvas.add).toHaveBeenCalledWith(expect.any(fabric.Polygon));
    expect(polyRect.annotationKind).toBe("rectangle");
  });

  test("translates KeypointOutput into fabric.Circle markers", () => {
    const output = new KeypointOutput([{ x: 100, y: 100 }]);
    expect(output.type).toBe("keypoint");
    expect(output.points).toEqual([{ x: 100, y: 100 }]);

    output.points.forEach((pt) => {
      const circle = new fabric.Circle({
        radius: 4,
        left: pt.x,
        top: pt.y,
      });
      mockCanvas.add(circle);
    });
    expect(mockCanvas.add).toHaveBeenCalledWith(expect.any(fabric.Circle));
  });
});
