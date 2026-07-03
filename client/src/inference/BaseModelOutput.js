export class BaseModelOutput {
  constructor(type) {
    if (new.target === BaseModelOutput) {
      throw new Error("Cannot instantiate abstract class BaseModelOutput");
    }
    this.type = type;
  }
}

export class PolygonOutput extends BaseModelOutput {
  constructor(points) {
    super("polygon");
    this.points = points;
  }
}

export class MaskOutput extends BaseModelOutput {
  constructor(grid) {
    super("mask");
    this.grid = grid;
  }
}

export class BboxOutput extends BaseModelOutput {
  constructor(x1, y1, x2, y2) {
    super("box");
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }
}

export class ClassificationOutput extends BaseModelOutput {
  constructor(labels) {
    super("classification");
    this.labels = labels;
  }
}

export class KeypointOutput extends BaseModelOutput {
  constructor(points) {
    super("keypoint");
    this.points = points;
  }
}
