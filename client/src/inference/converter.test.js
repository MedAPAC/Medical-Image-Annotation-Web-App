import { polygonToMask, maskToPolygon } from "./maskConverter";

describe("Bi-directional Polygon/Mask Converter", () => {
  const width = 10;
  const height = 10;

  test("polygonToMask rasterizes a triangle", () => {
    // Triangle: (2,2) -> (8,2) -> (5,8)
    const points = [
      { x: 2, y: 2 },
      { x: 8, y: 2 },
      { x: 5, y: 8 }
    ];

    const mask = polygonToMask(points, width, height);

    // Verify dimensions
    expect(mask.length).toBe(height);
    expect(mask[0].length).toBe(width);

    // Center point (5, 4) should be inside
    expect(mask[4][5]).toBe(1);

    // Top-left corner (0, 0) should be outside
    expect(mask[0][0]).toBe(0);
  });

  test("maskToPolygon traces a square mask outline", () => {
    // 3x3 square filled in a 6x6 grid
    const grid = [
      [0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0]
    ];

    const poly = maskToPolygon(grid, 6, 6);

    // Should return non-empty polygon point list
    expect(poly.length).toBeGreaterThan(0);

    // Verify all returned points are on the boundary
    poly.forEach((pt) => {
      expect(grid[pt.y][pt.x]).toBe(1);
    });
  });
});
