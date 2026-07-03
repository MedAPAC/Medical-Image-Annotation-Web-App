export class BasePrompt {
  constructor(type) {
    if (new.target === BasePrompt) {
      throw new Error("Cannot instantiate abstract class BasePrompt");
    }
    this.type = type;
  }
}

export class PointPrompt extends BasePrompt {
  constructor(x, y, isPositive = true) {
    super("point");
    this.x = x;
    this.y = y;
    this.isPositive = isPositive;
  }
}

export class BoxPrompt extends BasePrompt {
  constructor(x1, y1, x2, y2) {
    super("box");
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }
}

export class TextPrompt extends BasePrompt {
  constructor(text) {
    super("text");
    this.text = text;
  }
}
