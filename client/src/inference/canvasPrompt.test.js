import { formatAIPrompt } from "./promptFormatter";
import { PointPrompt, BoxPrompt, TextPrompt } from "./BasePrompt";

describe("Prompt Formatter", () => {
  test("formats raw click point coordinates to PointPrompt", () => {
    const rawPrompt = { type: "point", x: 120, y: 340, isPositive: true };
    const prompt = formatAIPrompt(rawPrompt);
    expect(prompt).toBeInstanceOf(PointPrompt);
    expect(prompt.type).toBe("point");
    expect(prompt.x).toBe(120);
    expect(prompt.y).toBe(340);
    expect(prompt.isPositive).toBe(true);
  });

  test("formats raw box coordinates to BoxPrompt", () => {
    const rawPrompt = { type: "box", x1: 10, y1: 20, x2: 100, y2: 200 };
    const prompt = formatAIPrompt(rawPrompt);
    expect(prompt).toBeInstanceOf(BoxPrompt);
    expect(prompt.type).toBe("box");
    expect(prompt.x1).toBe(10);
    expect(prompt.y1).toBe(20);
    expect(prompt.x2).toBe(100);
    expect(prompt.y2).toBe(200);
  });

  test("formats raw text to TextPrompt", () => {
    const rawPrompt = { type: "text", text: "nodule" };
    const prompt = formatAIPrompt(rawPrompt);
    expect(prompt).toBeInstanceOf(TextPrompt);
    expect(prompt.type).toBe("text");
    expect(prompt.text).toBe("nodule");
  });

  test("throws error for unsupported prompt formats", () => {
    expect(() => formatAIPrompt({ type: "invalid" })).toThrow("Unsupported prompt type");
  });
});
