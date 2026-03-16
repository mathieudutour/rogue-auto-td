import { TILE_WIDTH, TILE_HEIGHT, MAP_COLS, MAP_ROWS } from './constants';

/** Convert grid (col, row) to isometric screen coordinates (center of tile) */
export function tileToScreen(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_WIDTH / 2),
    y: (col + row) * (TILE_HEIGHT / 2),
  };
}

/** Convert screen coordinates to grid (col, row) — returns fractional values */
export function screenToTile(screenX: number, screenY: number): { col: number; row: number } {
  const col = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2;
  const row = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2;
  return { col, row };
}

/** Convert screen coordinates to the nearest valid tile (rounded + clamped) */
export function screenToTileRounded(screenX: number, screenY: number): { col: number; row: number } {
  const { col, row } = screenToTile(screenX, screenY);
  return {
    col: Math.max(0, Math.min(MAP_COLS - 1, Math.round(col))),
    row: Math.max(0, Math.min(MAP_ROWS - 1, Math.round(row))),
  };
}

/** Get the center of the entire map in screen coordinates */
export function getMapCenter(): { x: number; y: number } {
  const topLeft = tileToScreen(0, 0);
  const topRight = tileToScreen(MAP_COLS - 1, 0);
  const bottomLeft = tileToScreen(0, MAP_ROWS - 1);
  const bottomRight = tileToScreen(MAP_COLS - 1, MAP_ROWS - 1);

  return {
    x: (topLeft.x + topRight.x + bottomLeft.x + bottomRight.x) / 4,
    y: (topLeft.y + topRight.y + bottomLeft.y + bottomRight.y) / 4,
  };
}
