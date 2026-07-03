import {
  BasePrompt,
  PointPrompt,
  BoxPrompt,
  TextPrompt
} from "./BasePrompt";
import {
  BaseModelOutput,
  PolygonOutput,
  MaskOutput,
  BboxOutput,
  ClassificationOutput,
  KeypointOutput
} from "./BaseModelOutput";

describe("BasePrompt and Subclasses", () => {
  test("BasePrompt constructor throws error if instantiated directly", () => {
    expect(() => new BasePrompt("generic")).toThrow("Cannot instantiate abstract class");
  });

  test("PointPrompt inherits BasePrompt and holds point data", () => {
    const prompt = new PointPrompt(10, 20, true);
    expect(prompt).toBeInstanceOf(BasePrompt);
    expect(prompt.type).toBe("point");
    expect(prompt.x).toBe(10);
    expect(prompt.y).toBe(20);
    expect(prompt.isPositive).toBe(true);
  });

  test("BoxPrompt inherits BasePrompt and holds bounding coordinates", () => {
    const prompt = new BoxPrompt(10, 20, 100, 200);
    expect(prompt).toBeInstanceOf(BasePrompt);
    expect(prompt.type).toBe("box");
    expect(prompt.x1).toBe(10);
    expect(prompt.y1).toBe(20);
    expect(prompt.x2).toBe(100);
    expect(prompt.y2).toBe(200);
  });

  test("TextPrompt inherits BasePrompt and holds text string", () => {
    const prompt = new TextPrompt("lung nodule");
    expect(prompt).toBeInstanceOf(BasePrompt);
    expect(prompt.type).toBe("text");
    expect(prompt.text).toBe("lung nodule");
  });
});

describe("BaseModelOutput and Subclasses", () => {
  test("BaseModelOutput constructor throws error if instantiated directly", () => {
    expect(() => new BaseModelOutput("generic")).toThrow("Cannot instantiate abstract class");
  });

  test("PolygonOutput inherits BaseModelOutput and holds points list", () => {
    const points = [{ x: 10, y: 10 }, { x: 20, y: 20 }];
    const output = new PolygonOutput(points);
    expect(output).toBeInstanceOf(BaseModelOutput);
    expect(output.type).toBe("polygon");
    expect(output.points).toEqual(points);
  });

  test("MaskOutput inherits BaseModelOutput and holds grid data", () => {
    const grid = [[0, 1], [1, 0]];
    const output = new MaskOutput(grid);
    expect(output).toBeInstanceOf(BaseModelOutput);
    expect(output.type).toBe("mask");
    expect(output.grid).toEqual(grid);
  });

  test("BboxOutput inherits BaseModelOutput and holds coordinates", () => {
    const output = new BboxOutput(10, 20, 100, 200);
    expect(output).toBeInstanceOf(BaseModelOutput);
    expect(output.type).toBe("box");
    expect(output.x1).toBe(10);
    expect(output.y1).toBe(20);
    expect(output.x2).toBe(100);
    expect(output.y2).toBe(200);
  });

  test("ClassificationOutput inherits BaseModelOutput and holds classification labels", () => {
    const labels = ["nodule", "opacity"];
    const output = new ClassificationOutput(labels);
    expect(output).toBeInstanceOf(BaseModelOutput);
    expect(output.type).toBe("classification");
    expect(output.labels).toEqual(labels);
  });

  test("KeypointOutput inherits BaseModelOutput and holds keypoints list", () => {
    const points = [{ x: 5, y: 5 }];
    const output = new KeypointOutput(points);
    expect(output).toBeInstanceOf(BaseModelOutput);
    expect(output.type).toBe("keypoint");
    expect(output.points).toEqual(points);
  });
});
