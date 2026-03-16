import { MapData } from '../data/maps';
import { MAP_COLS, MAP_ROWS } from '../utils/constants';

/**
 * Procedural map generator.
 * Creates a valid MapData with a winding path, placeable tiles, and blocked zones.
 * Pure logic — no Phaser dependency.
 */

interface Cell { col: number; row: number }

/** Simple seeded random for reproducibility (optional seed) */
function makeRng(seed?: number) {
  let s = seed ?? (Math.random() * 2147483647) | 0;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generate a random map with valid path and tile layout.
 * Retries internally if validation fails (rare).
 */
export function generateMap(seed?: number): MapData {
  for (let attempt = 0; attempt < 50; attempt++) {
    const rng = makeRng(seed !== undefined ? seed + attempt : undefined);
    const result = tryGenerate(rng);
    if (result) return result;
  }
  // Fallback: shouldn't happen, but return a simple valid map
  return generateFallbackMap();
}

function tryGenerate(rng: () => number): MapData | null {
  const cols = MAP_COLS;
  const rows = MAP_ROWS;

  // 1. Generate path using constrained random walk
  const path = generatePath(rng, cols, rows);
  if (!path || path.length < 10) return null;

  // 2. Build grid
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = new Array(cols).fill(0); // Start all blocked
  }

  // Mark path cells
  const pathSet = new Set<string>();
  for (const cell of path) {
    grid[cell.row][cell.col] = 2;
    pathSet.add(`${cell.col},${cell.row}`);
  }

  // 3. Place placeable tiles adjacent to path
  let placeableCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== 0) continue;

      const distToPath = minManhattanToPath(c, r, path);
      if (distToPath === 1) {
        // Always placeable if directly adjacent to path
        grid[r][c] = 1;
        placeableCount++;
      } else if (distToPath === 2 && rng() < 0.65) {
        grid[r][c] = 1;
        placeableCount++;
      } else if (distToPath === 3 && rng() < 0.2) {
        grid[r][c] = 1;
        placeableCount++;
      }
    }
  }

  if (placeableCount < 20) return null;

  // 4. Extract waypoints (path start, direction changes, path end)
  const waypoints = extractWaypoints(path);

  // Pick a thematic name
  const names = [
    'Serpent Pass', 'Winding Vale', 'Crooked Path', 'Thunder Ridge',
    'Shadow Trail', 'Dragon Spine', 'Frost Canyon', 'Ember Route',
    'Thorn Maze', 'Crystal Ravine', 'Iron Crossing', 'Mist Hollow',
  ];
  const name = names[Math.floor(rng() * names.length)];

  return { name, grid, pathWaypoints: waypoints };
}

/**
 * Generate a path from one edge to the opposite edge using constrained random walk.
 * The path moves generally from one side to the other with random bends.
 */
function generatePath(rng: () => number, cols: number, rows: number): Cell[] | null {
  // Pick entry and exit edges
  // 0=left, 1=top, 2=right, 3=bottom
  const entryEdge = rng() < 0.5 ? 0 : 1; // left or top
  const exitEdge = entryEdge === 0 ? 2 : 3; // opposite

  const margin = 2; // Don't start in corners

  let start: Cell;
  let primaryDir: Cell; // Main movement direction
  let secondaryDirs: Cell[]; // Perpendicular movement options

  if (entryEdge === 0) {
    // Left edge → right edge
    const r = margin + Math.floor(rng() * (rows - margin * 2));
    start = { col: 0, row: r };
    primaryDir = { col: 1, row: 0 };
    secondaryDirs = [{ col: 0, row: -1 }, { col: 0, row: 1 }];
  } else {
    // Top edge → bottom edge
    const c = margin + Math.floor(rng() * (cols - margin * 2));
    start = { col: c, row: 0 };
    primaryDir = { col: 0, row: 1 };
    secondaryDirs = [{ col: -1, row: 0 }, { col: 1, row: 0 }];
  }

  const path: Cell[] = [start];
  const visited = new Set<string>();
  visited.add(`${start.col},${start.row}`);

  let current = { ...start };
  let consecutiveSideSteps = 0;
  const maxSideSteps = 3; // Max consecutive sideways moves before forcing forward

  for (let step = 0; step < 200; step++) {
    // Check if we've reached the exit edge
    if (entryEdge === 0 && current.col >= cols - 1) break;
    if (entryEdge === 1 && current.row >= rows - 1) break;

    // Choose next move
    let next: Cell | null = null;

    const roll = rng();
    if (roll < 0.50 || consecutiveSideSteps >= maxSideSteps) {
      // Move forward (primary direction)
      next = { col: current.col + primaryDir.col, row: current.row + primaryDir.row };
      consecutiveSideSteps = 0;
    } else if (roll < 0.70) {
      // Move forward + side (diagonal in grid, creates a bend)
      const side = secondaryDirs[rng() < 0.5 ? 0 : 1];
      next = { col: current.col + primaryDir.col + side.col, row: current.row + primaryDir.row + side.row };
      consecutiveSideSteps = 0;
    } else {
      // Move sideways only (creates more winding)
      const side = secondaryDirs[rng() < 0.5 ? 0 : 1];
      next = { col: current.col + side.col, row: current.row + side.row };
      consecutiveSideSteps++;
    }

    if (!next) continue;

    // Validate: in bounds, not visited, not touching path except previous cell
    if (next.col < 0 || next.col >= cols || next.row < 0 || next.row >= rows) {
      // Try just moving forward instead
      next = { col: current.col + primaryDir.col, row: current.row + primaryDir.row };
      if (next.col < 0 || next.col >= cols || next.row < 0 || next.row >= rows) continue;
    }

    const key = `${next.col},${next.row}`;
    if (visited.has(key)) {
      // Try forward
      next = { col: current.col + primaryDir.col, row: current.row + primaryDir.row };
      const fwdKey = `${next.col},${next.row}`;
      if (next.col < 0 || next.col >= cols || next.row < 0 || next.row >= rows) continue;
      if (visited.has(fwdKey)) continue;
    }

    // Check path doesn't touch itself (no adjacent visited cells except the previous one)
    const nKey = `${next.col},${next.row}`;
    if (visited.has(nKey)) continue;

    if (wouldCreateLoop(next, path, visited)) {
      // Fallback: try forward
      const fwd = { col: current.col + primaryDir.col, row: current.row + primaryDir.row };
      if (fwd.col >= 0 && fwd.col < cols && fwd.row >= 0 && fwd.row < rows &&
          !visited.has(`${fwd.col},${fwd.row}`) && !wouldCreateLoop(fwd, path, visited)) {
        next = fwd;
      } else {
        continue;
      }
    }

    path.push(next);
    visited.add(`${next.col},${next.row}`);
    current = next;
  }

  // Check we reached the exit
  if (entryEdge === 0 && current.col < cols - 2) return null;
  if (entryEdge === 1 && current.row < rows - 2) return null;

  return path;
}

/** Check if placing a cell would create a loop (touches >1 existing path cell that isn't the predecessor) */
function wouldCreateLoop(cell: Cell, path: Cell[], visited: Set<string>): boolean {
  const neighbors = [
    { col: cell.col - 1, row: cell.row },
    { col: cell.col + 1, row: cell.row },
    { col: cell.col, row: cell.row - 1 },
    { col: cell.col, row: cell.row + 1 },
  ];

  let adjacentPathCells = 0;
  const lastCell = path[path.length - 1];

  for (const n of neighbors) {
    const key = `${n.col},${n.row}`;
    if (visited.has(key)) {
      // It's OK if it's the last cell in the path (the one we're extending from)
      if (n.col === lastCell.col && n.row === lastCell.row) continue;
      adjacentPathCells++;
    }
  }

  return adjacentPathCells > 0;
}

/** Get minimum Manhattan distance from a cell to any path cell */
function minManhattanToPath(col: number, row: number, path: Cell[]): number {
  let min = Infinity;
  for (const cell of path) {
    const d = Math.abs(col - cell.col) + Math.abs(row - cell.row);
    if (d < min) min = d;
    if (d === 1) return 1; // Can't get closer (0 would be on the path)
  }
  return min;
}

/** Extract waypoints from a path — keep start, end, and every direction change */
function extractWaypoints(path: Cell[]): Cell[] {
  if (path.length <= 2) return [...path];

  const waypoints: Cell[] = [path[0]];

  for (let i = 1; i < path.length - 1; i++) {
    const prevDir = {
      col: path[i].col - path[i - 1].col,
      row: path[i].row - path[i - 1].row,
    };
    const nextDir = {
      col: path[i + 1].col - path[i].col,
      row: path[i + 1].row - path[i].row,
    };

    // Direction changed — this is a waypoint
    if (prevDir.col !== nextDir.col || prevDir.row !== nextDir.row) {
      waypoints.push(path[i]);
    }
  }

  waypoints.push(path[path.length - 1]);
  return waypoints;
}

/** Simple fallback map if generation fails repeatedly */
function generateFallbackMap(): MapData {
  const grid: number[][] = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < MAP_COLS; c++) {
      if (r === 3 && c <= 10) grid[r][c] = 2;
      else if (r === 7 && c >= 3) grid[r][c] = 2;
      else if (c === 10 && r >= 3 && r <= 7) grid[r][c] = 2;
      else if (c === 3 && r >= 3 && r <= 7) grid[r][c] = 2;
      else if (Math.abs(r - 3) <= 2 || Math.abs(r - 7) <= 2) grid[r][c] = 1;
      else grid[r][c] = 0;
    }
  }
  return {
    name: 'Fallback Path',
    grid,
    pathWaypoints: [
      { col: 0, row: 3 }, { col: 10, row: 3 },
      { col: 10, row: 7 }, { col: 3, row: 7 },
      { col: 3, row: 3 },
    ],
  };
}
