import {
  InferenceRunner,
  runnerRegistry,
  MockInferenceRunner
} from "./InferenceRunner";
import { PointPrompt, BoxPrompt, TextPrompt } from "./BasePrompt";
import { PolygonOutput, MaskOutput, BboxOutput, ClassificationOutput } from "./BaseModelOutput";

describe("InferenceRunner and Registry", () => {
  beforeEach(() => {
    runnerRegistry.clear();
  });

  test("InferenceRunner constructor throws error if instantiated directly", () => {
    expect(() => new InferenceRunner()).toThrow("Cannot instantiate abstract class");
  });

  test("InferenceRunner subclasses must implement run method", async () => {
    class BadRunner extends InferenceRunner {}
    const runner = new BadRunner();
    await expect(runner.run(new PointPrompt(0, 0))).rejects.toThrow("Method 'run' must be implemented");
  });

  test("runnerRegistry can register and retrieve runners", () => {
    class DummyRunner extends InferenceRunner {
      async run() { return null; }
    }
    const runner = new DummyRunner();
    runnerRegistry.register("dummy", runner);
    expect(runnerRegistry.get("dummy")).toBe(runner);
  });
});

describe("MockInferenceRunner", () => {
  test("MockInferenceRunner returns simulated outputs based on prompt types", async () => {
    const runner = new MockInferenceRunner();
    
    // Test point prompt -> returns PolygonOutput
    const pointPrompt = new PointPrompt(100, 150, true);
    const output1 = await runner.run(pointPrompt, { width: 512, height: 512 });
    expect(output1).toBeInstanceOf(PolygonOutput);
    expect(output1.points.length).toBeGreaterThan(2);

    // Test box prompt -> returns BboxOutput/PolygonOutput
    const boxPrompt = new BoxPrompt(50, 50, 200, 200);
    const output2 = await runner.run(boxPrompt, { width: 512, height: 512 });
    expect(output2).toBeInstanceOf(PolygonOutput);

    // Test text prompt -> returns multi-label ClassificationOutput & PolygonOutput combined or classification
    const textPrompt = new TextPrompt("lung");
    const output3 = await runner.run(textPrompt, { width: 512, height: 512 });
    expect(output3).toBeInstanceOf(ClassificationOutput);
    expect(output3.labels).toContain("mock-label-lung");
  });
});
