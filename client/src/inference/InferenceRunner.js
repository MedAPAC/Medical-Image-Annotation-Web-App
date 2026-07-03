import { PolygonOutput, ClassificationOutput } from "./BaseModelOutput";

export class InferenceRunner {
  constructor() {
    if (new.target === InferenceRunner) {
      throw new Error("Cannot instantiate abstract class InferenceRunner");
    }
  }

  async run(prompt, imageContext) {
    throw new Error("Method 'run' must be implemented");
  }
}

class RunnerRegistry {
  constructor() {
    this.registry = new Map();
  }

  register(modelName, runnerInstance) {
    this.registry.set(modelName, runnerInstance);
  }

  get(modelName) {
    return this.registry.get(modelName);
  }

  clear() {
    this.registry.clear();
  }
}

export const runnerRegistry = new RunnerRegistry();

export class MockInferenceRunner extends InferenceRunner {
  async run(prompt, imageContext) {
    const { width = 512, height = 512 } = imageContext || {};

    if (prompt.type === "point") {
      const { x, y } = prompt;
      const points = [
        { x: Math.max(0, x - 30), y: Math.max(0, y - 30) },
        { x: Math.min(width, x + 30), y: Math.max(0, y - 30) },
        { x: Math.min(width, x + 30), y: Math.min(height, y + 30) },
        { x: Math.max(0, x - 30), y: Math.min(height, y + 30) }
      ];
      return new PolygonOutput(points);
    } else if (prompt.type === "box") {
      const { x1, y1, x2, y2 } = prompt;
      const padX = (x2 - x1) * 0.1;
      const padY = (y2 - y1) * 0.1;
      const points = [
        { x: x1 + padX, y: y1 + padY },
        { x: x2 - padX, y: y1 + padY },
        { x: x2 - padX, y: y2 - padY },
        { x: x1 + padX, y: y2 - padY }
      ];
      return new PolygonOutput(points);
    } else if (prompt.type === "text") {
      const textVal = (prompt.text || "").toLowerCase();
      const labels = [`mock-label-${textVal || "generic"}`];
      return new ClassificationOutput(labels);
    }

    throw new Error(`Unsupported prompt type: ${prompt.type}`);
  }
}
