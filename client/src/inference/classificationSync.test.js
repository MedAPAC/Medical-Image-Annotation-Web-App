import { ClassificationOutput } from "./BaseModelOutput";

describe("Classification Label Sync to Sidebar State", () => {
  test("synchronizes predicted labels with slice classification state object", () => {
    const output = new ClassificationOutput(["mock-label-nodule"]);
    expect(output.type).toBe("classification");
    expect(output.labels).toEqual(["mock-label-nodule"]);

    const selectedFileName = "test-image.dcm";
    const currentSlice = 3;
    let state = {};

    const mockSetClassificationByFileAndSlice = (updater) => {
      state = updater(state);
    };

    const label = output.labels[0];
    if (label) {
      mockSetClassificationByFileAndSlice((prev) => ({
        ...prev,
        [selectedFileName]: {
          ...(prev[selectedFileName] || {}),
          [currentSlice]: label,
        },
      }));
    }

    expect(state[selectedFileName][currentSlice]).toBe("mock-label-nodule");
  });
});
