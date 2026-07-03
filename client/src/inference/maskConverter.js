export function polygonToMask(points, width, height) {
  const mask = Array(height).fill(null).map(() => Array(width).fill(0));

  if (!points || points.length < 3) return mask;

  for (let y = 0; y < height; y++) {
    const intersections = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      if (p1.y === p2.y) continue;

      if ((y >= p1.y && y < p2.y) || (y >= p2.y && y < p1.y)) {
        const t = (y - p1.y) / (p2.y - p1.y);
        const x = p1.x + t * (p2.x - p1.x);
        intersections.push(x);
      }
    }

    intersections.sort((a, b) => a - b);

    for (let i = 0; i < intersections.length; i += 2) {
      if (i + 1 >= intersections.length) break;
      const xStart = Math.max(0, Math.ceil(intersections[i]));
      const xEnd = Math.min(width - 1, Math.floor(intersections[i + 1]));
      for (let x = xStart; x <= xEnd; x++) {
        mask[y][x] = 1;
      }
    }
  }

  return mask;
}

export function maskToPolygon(mask, width, height) {
  let startX = -1;
  let startY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x] === 1) {
        startX = x;
        startY = y;
        break;
      }
    }
    if (startX !== -1) break;
  }

  if (startX === -1) return [];

  const points = [];
  let cx = startX;
  let cy = startY;

  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];

  let backtraceDir = 6;
  const maxIterations = width * height * 4;
  let iterations = 0;

  while (iterations < maxIterations) {
    points.push({ x: cx, y: cy });

    let foundNext = false;
    let checkDir = (backtraceDir + 1) % 8;

    for (let i = 0; i < 8; i++) {
      const nx = cx + dx[checkDir];
      const ny = cy + dy[checkDir];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height && mask[ny][nx] === 1) {
        cx = nx;
        cy = ny;
        backtraceDir = (checkDir + 4) % 8;
        foundNext = true;
        break;
      }
      checkDir = (checkDir + 1) % 8;
    }

    if (!foundNext || (cx === startX && cy === startY)) {
      break;
    }
    iterations++;
  }

  return points;
}
