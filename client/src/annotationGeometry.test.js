import {
  isAxisAlignedRectangle,
  isBoundingBoxAnnotation,
  resizeBoundingBoxPoints,
} from "./annotationGeometry";

const rectangle = [
  { x: 10, y: 20 },
  { x: 110, y: 20 },
  { x: 110, y: 80 },
  { x: 10, y: 80 },
];

test.each([
  [
    0,
    { x: 25, y: 30 },
    [
      { x: 25, y: 30 },
      { x: 110, y: 30 },
      { x: 110, y: 80 },
      { x: 25, y: 80 },
    ],
  ],
  [
    1,
    { x: 95, y: 35 },
    [
      { x: 10, y: 35 },
      { x: 95, y: 35 },
      { x: 95, y: 80 },
      { x: 10, y: 80 },
    ],
  ],
  [
    2,
    { x: 90, y: 70 },
    [
      { x: 10, y: 20 },
      { x: 90, y: 20 },
      { x: 90, y: 70 },
      { x: 10, y: 70 },
    ],
  ],
  [
    3,
    { x: 30, y: 65 },
    [
      { x: 30, y: 20 },
      { x: 110, y: 20 },
      { x: 110, y: 65 },
      { x: 30, y: 65 },
    ],
  ],
])("keeps a bounding box rectangular when corner %i moves", (index, point, expected) => {
  const resized = resizeBoundingBoxPoints(rectangle, index, point);

  expect(resized).toEqual(expected);
  expect(isAxisAlignedRectangle(resized)).toBe(true);
  expect(rectangle[0]).toEqual({ x: 10, y: 20 });
});

test("prevents a bounding box corner from crossing its opposite corner", () => {
  expect(resizeBoundingBoxPoints(rectangle, 0, { x: 150, y: 100 })).toEqual([
    { x: 105, y: 75 },
    { x: 110, y: 75 },
    { x: 110, y: 80 },
    { x: 105, y: 80 },
  ]);
});

test("recognizes explicit bounding-box metadata without changing ordinary polygons", () => {
  expect(isBoundingBoxAnnotation({ annotationKind: "rectangle" })).toBe(true);
  expect(isBoundingBoxAnnotation({ customType: "polygon" })).toBe(false);
});
