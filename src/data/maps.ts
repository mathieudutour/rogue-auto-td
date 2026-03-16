/**
 * Map definitions.
 * Tile types: 0 = blocked, 1 = placeable, 2 = path
 * Path waypoints: ordered tile coordinates enemies follow.
 */

export interface MapData {
  name: string;
  grid: number[][];
  pathWaypoints: { col: number; row: number }[];
}

export const MAP_1: MapData = {
  name: 'The Crossroads',
  grid: [
    // 14x14 grid
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 1, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 0, 0],
  ],
  pathWaypoints: [
    { col: 0, row: 3 },
    { col: 3, row: 3 },
    { col: 3, row: 6 },
    { col: 7, row: 6 },
    { col: 7, row: 9 },
    { col: 10, row: 9 },
    { col: 10, row: 13 },
    { col: 11, row: 13 },
  ],
};

export const ALL_MAPS: MapData[] = [MAP_1];

export { generateMap } from '../map/MapGenerator';
