import { PointPrompt, BoxPrompt, TextPrompt } from "./BasePrompt";

export function formatAIPrompt(rawPrompt) {
  if (!rawPrompt || typeof rawPrompt !== "object" || !rawPrompt.type) {
    throw new Error("Invalid prompt");
  }

  const { type } = rawPrompt;

  if (type === "point") {
    const { x, y, isPositive } = rawPrompt;
    return new PointPrompt(x, y, isPositive);
  } else if (type === "box") {
    const { x1, y1, x2, y2 } = rawPrompt;
    return new BoxPrompt(x1, y1, x2, y2);
  } else if (type === "text") {
    const { text } = rawPrompt;
    return new TextPrompt(text);
  }

  throw new Error(`Unsupported prompt type: ${type}`);
}
