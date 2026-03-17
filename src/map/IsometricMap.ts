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
  image: Phaser.GameObjects.Image;
}

const TILE_VARIANTS = 4;

/** Simple deterministic hash for variant picking */
function tileVariant(col: number, row: number): number {
  return Math.abs((col * 7 + row * 13 + col * row * 3) % TILE_VARIANTS);
}

function getTextureKey(type: TileType, variant: number): string {
  switch (type) {
    case TileType.Path:
      return `tile_path_${variant}`;
    case TileType.Placeable:
      return `tile_placeable_${variant}`;
    case TileType.Blocked:
    default:
      return `tile_blocked_${variant}`;
  }
}

export class IsometricMap {
  private scene: Phaser.Scene;
  private tiles: TileState[][] = [];
  private hoverTile: { col: number; row: number } | null = null;
  private selectedTile: { col: number; row: number } | null = null;
  private dragHighlightTile: { col: number; row: number } | null = null;
  private mapData: MapData;
  private container: Phaser.GameObjects.Container;

  // Overlay images for hover / selection / drag
  private hoverOverlay: Phaser.GameObjects.Image | null = null;
  private selectedOverlay: Phaser.GameObjects.Image | null = null;
  private dragOverlay: Phaser.GameObjects.Image | null = null;

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

        const variant = tileVariant(col, row);
        const textureKey = getTextureKey(type, variant);

        const image = this.scene.add.image(x, y, textureKey);
        image.setDepth(y);
        this.container.add(image);

        this.tiles[row][col] = {
          type,
          occupied: false,
          image,
        };
      }
    }
  }

  private setupInput(): void {
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);

      // Clear previous hover
      this.clearHoverOverlay();

      if (this.isValidTile(col, row) && this.tiles[row][col].type !== TileType.Blocked) {
        this.hoverTile = { col, row };
        const { x, y } = tileToScreen(col, row);
        this.hoverOverlay = this.scene.add.image(x, y, 'tile_hover');
        this.hoverOverlay.setDepth(y + 0.1);
        this.container.add(this.hoverOverlay);
      } else {
        this.hoverTile = null;
      }
    });

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return;
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);

      // Clear previous selection
      this.clearSelectedOverlay();

      if (this.isValidTile(col, row) && this.tiles[row][col].type === TileType.Placeable) {
        this.selectedTile = { col, row };
        const { x, y } = tileToScreen(col, row);
        this.selectedOverlay = this.scene.add.image(x, y, 'tile_selected');
        this.selectedOverlay.setDepth(y + 0.1);
        this.container.add(this.selectedOverlay);
      } else {
        this.selectedTile = null;
      }
    });
  }

  private clearHoverOverlay(): void {
    if (this.hoverOverlay) {
      this.hoverOverlay.destroy();
      this.hoverOverlay = null;
    }
  }

  private clearSelectedOverlay(): void {
    if (this.selectedOverlay) {
      this.selectedOverlay.destroy();
      this.selectedOverlay = null;
    }
  }

  private clearDragOverlayImage(): void {
    if (this.dragOverlay) {
      this.dragOverlay.destroy();
      this.dragOverlay = null;
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
    this.clearSelectedOverlay();
    this.selectedTile = null;
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  /** Highlight a tile during drag-and-drop. Green if valid, red if invalid. */
  setDragHighlight(col: number, row: number, isValid: boolean): void {
    this.clearDragHighlight();

    if (!this.isValidTile(col, row)) return;
    if (this.tiles[row][col].type === TileType.Blocked) return;

    this.dragHighlightTile = { col, row };
    const { x, y } = tileToScreen(col, row);
    const textureKey = isValid ? 'tile_drag_valid' : 'tile_drag_invalid';
    this.dragOverlay = this.scene.add.image(x, y, textureKey);
    this.dragOverlay.setDepth(y + 0.2);
    this.container.add(this.dragOverlay);
  }

  /** Remove the drag highlight. */
  clearDragHighlight(): void {
    this.clearDragOverlayImage();
    this.dragHighlightTile = null;
  }

  /** Rebuild the map with new data (destroys old tiles, creates new ones). */
  rebuild(mapData: MapData): void {
    // Destroy existing tile images
    for (const row of this.tiles) {
      for (const tile of row) {
        tile.image.destroy();
      }
    }
    this.tiles = [];

    // Clear overlays
    this.clearHoverOverlay();
    this.clearSelectedOverlay();
    this.clearDragOverlayImage();
    this.hoverTile = null;
    this.selectedTile = null;
    this.dragHighlightTile = null;

    this.mapData = mapData;
    this.buildMap();
  }

  /** Get all placeable tile positions. */
  getPlaceableTiles(): { col: number; row: number }[] {
    const result: { col: number; row: number }[] = [];
    for (let row = 0; row < this.tiles.length; row++) {
      for (let col = 0; col < this.tiles[row].length; col++) {
        if (this.tiles[row][col].type === TileType.Placeable) {
          result.push({ col, row });
        }
      }
    }
    return result;
  }
}
