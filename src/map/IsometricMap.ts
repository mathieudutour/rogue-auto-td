import Phaser from 'phaser';
import { TILE_WIDTH, TILE_HEIGHT, COLORS } from '../utils/constants';
import { tileToScreen, screenToTileRounded } from '../utils/iso';
import { MapData } from '../data/maps';

export enum TileType {
  Blocked = 0,
  Placeable = 1,
  Path = 2,
}

interface TileState {
  type: TileType;
  occupied: boolean;
  graphic: Phaser.GameObjects.Polygon;
}

export class IsometricMap {
  private scene: Phaser.Scene;
  private tiles: TileState[][] = [];
  private hoverTile: { col: number; row: number } | null = null;
  private selectedTile: { col: number; row: number } | null = null;
  private dragHighlightTile: { col: number; row: number } | null = null;
  private mapData: MapData;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, mapData: MapData) {
    this.scene = scene;
    this.mapData = mapData;
    this.container = scene.add.container(0, 0);
    this.buildMap();
    this.setupInput();
  }

  private buildMap(): void {
    const grid = this.mapData.grid;

    for (let row = 0; row < grid.length; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < grid[row].length; col++) {
        const type = grid[row][col] as TileType;
        const { x, y } = tileToScreen(col, row);

        // Diamond polygon points (relative to center)
        const hw = TILE_WIDTH / 2;
        const hh = TILE_HEIGHT / 2;
        const points = [
          { x: 0, y: -hh },   // top
          { x: hw, y: 0 },    // right
          { x: 0, y: hh },    // bottom
          { x: -hw, y: 0 },   // left
        ];

        const { fill, stroke } = this.getTileColors(type);
        const polygon = this.scene.add.polygon(x, y, points, fill, 0.9);
        polygon.setStrokeStyle(1, stroke, 0.8);
        polygon.setOrigin(0.5, 0.5);
        polygon.setDepth(y);
        this.container.add(polygon);

        this.tiles[row][col] = {
          type,
          occupied: false,
          graphic: polygon,
        };
      }
    }
  }

  private getTileColors(type: TileType): { fill: number; stroke: number } {
    switch (type) {
      case TileType.Path:
        return { fill: COLORS.path, stroke: COLORS.pathStroke };
      case TileType.Placeable:
        return { fill: COLORS.placeable, stroke: COLORS.placeableStroke };
      case TileType.Blocked:
      default:
        return { fill: COLORS.blocked, stroke: COLORS.blockedStroke };
    }
  }

  private setupInput(): void {
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);

      // Clear previous hover
      if (this.hoverTile) {
        this.resetTileVisual(this.hoverTile.col, this.hoverTile.row);
      }

      if (this.isValidTile(col, row) && this.tiles[row][col].type !== TileType.Blocked) {
        this.hoverTile = { col, row };
        const tile = this.tiles[row][col];
        tile.graphic.setStrokeStyle(2, COLORS.hover, 1);
      } else {
        this.hoverTile = null;
      }
    });

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return;
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);

      // Clear previous selection
      if (this.selectedTile) {
        this.resetTileVisual(this.selectedTile.col, this.selectedTile.row);
      }

      if (this.isValidTile(col, row) && this.tiles[row][col].type === TileType.Placeable) {
        this.selectedTile = { col, row };
        const tile = this.tiles[row][col];
        tile.graphic.setStrokeStyle(2, COLORS.selected, 1);
      } else {
        this.selectedTile = null;
      }
    });
  }

  private resetTileVisual(col: number, row: number): void {
    if (!this.isValidTile(col, row)) return;
    const tile = this.tiles[row][col];
    const { stroke } = this.getTileColors(tile.type);

    // Keep selected highlight if this is the selected tile
    if (this.selectedTile && this.selectedTile.col === col && this.selectedTile.row === row) {
      tile.graphic.setStrokeStyle(2, COLORS.selected, 1);
    } else {
      tile.graphic.setStrokeStyle(1, stroke, 0.8);
    }
  }

  isValidTile(col: number, row: number): boolean {
    return row >= 0 && row < this.tiles.length && col >= 0 && col < this.tiles[row].length;
  }

  getTileType(col: number, row: number): TileType | null {
    if (!this.isValidTile(col, row)) return null;
    return this.tiles[row][col].type;
  }

  isOccupied(col: number, row: number): boolean {
    if (!this.isValidTile(col, row)) return true;
    return this.tiles[row][col].occupied;
  }

  setOccupied(col: number, row: number, occupied: boolean): void {
    if (this.isValidTile(col, row)) {
      this.tiles[row][col].occupied = occupied;
    }
  }

  getSelectedTile(): { col: number; row: number } | null {
    return this.selectedTile;
  }

  clearSelection(): void {
    if (this.selectedTile) {
      this.resetTileVisual(this.selectedTile.col, this.selectedTile.row);
      this.selectedTile = null;
    }
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  /** Highlight a tile during drag-and-drop. Green if valid, red if invalid. */
  setDragHighlight(col: number, row: number, isValid: boolean): void {
    // Clear previous drag highlight
    this.clearDragHighlight();

    if (!this.isValidTile(col, row)) return;
    if (this.tiles[row][col].type === TileType.Blocked) return;

    this.dragHighlightTile = { col, row };
    const tile = this.tiles[row][col];
    const color = isValid ? 0x00ff00 : 0xff0000;
    tile.graphic.setStrokeStyle(3, color, 1);
    tile.graphic.setFillStyle(isValid ? 0x225522 : 0x552222, 0.9);
  }

  /** Remove the drag highlight and restore the tile's original appearance. */
  clearDragHighlight(): void {
    if (this.dragHighlightTile) {
      const { col, row } = this.dragHighlightTile;
      if (this.isValidTile(col, row)) {
        const tile = this.tiles[row][col];
        const { fill, stroke } = this.getTileColors(tile.type);
        tile.graphic.setFillStyle(fill, 0.9);
        tile.graphic.setStrokeStyle(1, stroke, 0.8);
      }
      this.dragHighlightTile = null;
    }
  }
}
