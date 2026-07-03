export const MIN_BOUNDING_BOX_SIZE = 5;

const isFinitePoint = (point) =>
  point && Number.isFinite(point.x) && Number.isFinite(point.y);

export const isAxisAlignedRectangle = (points, tolerance = 0.01) => {
  if (!Array.isArray(points) || points.length !== 4 || !points.every(isFinitePoint)) {
    return false;
  }

  const [first, second, third, fourth] = points;
  const close = (left, right) => Math.abs(left - right) <= tolerance;
  const horizontalFirst =
    close(first.y, second.y) &&
    close(second.x, third.x) &&
    close(third.y, fourth.y) &&
    close(fourth.x, first.x);
  const verticalFirst =
    close(first.x, second.x) &&
    close(second.y, third.y) &&
    close(third.x, fourth.x) &&
    close(fourth.y, first.y);
  const width = Math.max(...points.map(({ x }) => x)) - Math.min(...points.map(({ x }) => x));
  const height = Math.max(...points.map(({ y }) => y)) - Math.min(...points.map(({ y }) => y));

  return (horizontalFirst || verticalFirst) && width > tolerance && height > tolerance;
};

export const isBoundingBoxAnnotation = (shape) =>
  shape?.annotationKind === "rectangle" ||
  shape?.standardGeometry?.type === "rectangle";

export const resizeBoundingBoxPoints = (
  points,
  movedIndex,
  proposedPoint,
  minimumSize = MIN_BOUNDING_BOX_SIZE
) => {
  if (
    !isAxisAlignedRectangle(points) ||
    !Number.isInteger(movedIndex) ||
    movedIndex < 0 ||
    movedIndex > 3 ||
    !isFinitePoint(proposedPoint)
  ) {
    return points;
  }

  const resized = points.map((point) => ({ ...point }));
  const movedBefore = points[movedIndex];
  const oppositeIndex = (movedIndex + 2) % 4;
  const opposite = points[oppositeIndex];
  const previousIndex = (movedIndex + 3) % 4;
  const nextIndex = (movedIndex + 1) % 4;
  const xNeighborIndex =
    Math.abs(points[previousIndex].x - movedBefore.x) <=
    Math.abs(points[nextIndex].x - movedBefore.x)
      ? previousIndex
      : nextIndex;
  const yNeighborIndex = xNeighborIndex === previousIndex ? nextIndex : previousIndex;
  const safeMinimum = Math.max(0, Number(minimumSize) || 0);
  const xDirection = movedBefore.x < opposite.x ? -1 : 1;
  const yDirection = movedBefore.y < opposite.y ? -1 : 1;
  const x =
    xDirection < 0
      ? Math.min(proposedPoint.x, opposite.x - safeMinimum)
      : Math.max(proposedPoint.x, opposite.x + safeMinimum);
  const y =
    yDirection < 0
      ? Math.min(proposedPoint.y, opposite.y - safeMinimum)
      : Math.max(proposedPoint.y, opposite.y + safeMinimum);

  resized[movedIndex] = { x, y };
  resized[xNeighborIndex].x = x;
  resized[yNeighborIndex].y = y;

  return resized;
};
