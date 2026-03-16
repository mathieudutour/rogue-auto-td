import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { screenToTileRounded } from '../utils/iso';
import { BENCH_SIZE } from '../utils/constants';
import {
  HeldItem, getHeldItemName, getHeldItemColor, getHeldItemDescription,
} from '../data/items';

const SLOT_SIZE = 24;
const SLOT_GAP = 4;
const MAX_DISPLAY = 10;

export class ItemPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private label: Phaser.GameObjects.Text;
  private panelY: number;
  private panelStartX: number;

  // Drag state
  private dragSprite: Phaser.GameObjects.Sprite | null = null;
  private dragIndex: number = -1;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private static readonly DRAG_THRESHOLD = 4;

  // Tooltip
  private tooltipContainer: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = scene.scale.width;
    this.panelY = scene.scale.height - 180;
    this.panelStartX = w / 2 - (MAX_DISPLAY * (SLOT_SIZE + SLOT_GAP)) / 2;

    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    // Label
    this.label = scene.add.text(this.panelStartX - 2, this.panelY - 14, 'ITEMS', {
      fontSize: '9px',
      color: '#556677',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    this.label.setScrollFactor(0).setDepth(1000);
    this.container.add(this.label);

    // Pre-create slot backgrounds
    for (let i = 0; i < MAX_DISPLAY; i++) {
      const x = this.panelStartX + i * (SLOT_SIZE + SLOT_GAP);
      const slotContainer = scene.add.container(x, this.panelY);
      slotContainer.setScrollFactor(0).setDepth(1000);

      const bg = scene.add.rectangle(0, 0, SLOT_SIZE, SLOT_SIZE, 0x12162a, 0.6);
      bg.setOrigin(0, 0);
      bg.setStrokeStyle(1, 0x334466, 0.4);
      bg.setName('bg');
      slotContainer.add(bg);

      const icon = scene.add.sprite(SLOT_SIZE / 2, SLOT_SIZE / 2, 'champion_default');
      icon.setVisible(false);
      icon.setName('icon');
      slotContainer.add(icon);

      slotContainer.setVisible(false);
      this.slotContainers.push(slotContainer);
      this.container.add(slotContainer);
    }
  }

  setupEvents(gameScene: GameScene): void {
    // We use priority-based pointer events on UIScene
    // Item drag detection is handled here; champion drag is handled by UIScene
    // Since items are above the bench, we check items first
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return;
      if (gameScene.phase !== 'shopping') return;

      const slotIdx = this.getSlotAt(pointer.x, pointer.y);
      if (slotIdx >= 0 && slotIdx < gameScene.itemInventory.length) {
        this.dragIndex = slotIdx;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.isDragging = false;
        this.hideTooltip();
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Hover tooltip (only when not dragging)
      if (this.dragIndex === -1 && !this.isDragging) {
        const slotIdx = this.getSlotAt(pointer.x, pointer.y);
        if (slotIdx >= 0 && slotIdx < gameScene.itemInventory.length) {
          this.showTooltip(gameScene.itemInventory[slotIdx], pointer.x, pointer.y);
        } else {
          this.hideTooltip();
        }
      }

      if (this.dragIndex === -1) return;

      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      if (!this.isDragging && Math.sqrt(dx * dx + dy * dy) >= ItemPanel.DRAG_THRESHOLD) {
        this.isDragging = true;
        this.startDragItem(gameScene, pointer);
      }
      if (this.isDragging && this.dragSprite) {
        this.dragSprite.setPosition(pointer.x, pointer.y);
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0 || this.dragIndex === -1) return;

      if (this.isDragging) {
        this.dropItem(gameScene, pointer);
      }
      this.endDrag(gameScene);
    });
  }

  update(items: HeldItem[]): void {
    for (let i = 0; i < MAX_DISPLAY; i++) {
      const slotContainer = this.slotContainers[i];
      const icon = slotContainer.getByName('icon') as Phaser.GameObjects.Sprite;
      const bg = slotContainer.getByName('bg') as Phaser.GameObjects.Rectangle;

      if (i < items.length) {
        const item = items[i];
        const texKey = item.isComponent ? `item_${item.componentId}` : `item_${item.combinedId}`;
        icon.setTexture(texKey);
        icon.setVisible(true);
        const color = getHeldItemColor(item);
        bg.setStrokeStyle(1, color, 0.6);
        slotContainer.setVisible(true);
      } else {
        icon.setVisible(false);
        bg.setStrokeStyle(1, 0x334466, 0.4);
        slotContainer.setVisible(false);
      }
    }

    this.label.setVisible(items.length > 0);
  }

  /** Check if pointer is over an item slot (to prevent champion drag underneath) */
  isPointerOverItem(x: number, y: number, itemCount: number): boolean {
    const slotIdx = this.getSlotAt(x, y);
    return slotIdx >= 0 && slotIdx < itemCount;
  }

  isDragActive(): boolean {
    return this.isDragging;
  }

  private getSlotAt(screenX: number, screenY: number): number {
    for (let i = 0; i < MAX_DISPLAY; i++) {
      const x = this.panelStartX + i * (SLOT_SIZE + SLOT_GAP);
      if (
        screenX >= x && screenX <= x + SLOT_SIZE &&
        screenY >= this.panelY && screenY <= this.panelY + SLOT_SIZE
      ) {
        return i;
      }
    }
    return -1;
  }

  private startDragItem(gameScene: GameScene, pointer: Phaser.Input.Pointer): void {
    const item = gameScene.itemInventory[this.dragIndex];
    if (!item) return;

    const texKey = item.isComponent ? `item_${item.componentId}` : `item_${item.combinedId}`;
    this.dragSprite = this.scene.add.sprite(pointer.x, pointer.y, texKey);
    this.dragSprite.setScale(1.5);
    this.dragSprite.setAlpha(0.85);
    this.dragSprite.setDepth(2000);

    // Hide the slot icon while dragging
    const icon = this.slotContainers[this.dragIndex]?.getByName('icon') as Phaser.GameObjects.Sprite;
    if (icon) icon.setVisible(false);
  }

  private dropItem(gameScene: GameScene, pointer: Phaser.Input.Pointer): void {
    // Check if dropped on a bench champion
    const benchIdx = this.getBenchSlotAt(pointer.x, pointer.y);
    if (benchIdx >= 0) {
      const champ = gameScene.bench[benchIdx];
      if (champ) {
        gameScene.giveItemToChampion(this.dragIndex, champ);
        return;
      }
    }

    // Check if dropped on a board champion
    const worldPoint = gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);
    const champOnTile = gameScene.champions.find(
      c => c.placed && c.gridCol === col && c.gridRow === row,
    );
    if (champOnTile) {
      gameScene.giveItemToChampion(this.dragIndex, champOnTile);
    }
    // If dropped on nothing, item stays in inventory (no-op)
  }

  private endDrag(gameScene: GameScene): void {
    if (this.dragSprite) {
      this.dragSprite.destroy();
      this.dragSprite = null;
    }
    this.dragIndex = -1;
    this.isDragging = false;
    this.update(gameScene.itemInventory);
  }

  private showTooltip(item: HeldItem, x: number, y: number): void {
    this.hideTooltip();
    const name = getHeldItemName(item);
    const desc = getHeldItemDescription(item);
    const color = getHeldItemColor(item);

    this.tooltipContainer = this.scene.add.container(x + 10, y - 44);
    this.tooltipContainer.setScrollFactor(0).setDepth(1200);

    const bg = this.scene.add.rectangle(0, 0, 170, 38, 0x111133, 0.95);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(1, color, 0.6);
    this.tooltipContainer.add(bg);

    const nameText = this.scene.add.text(6, 4, name, {
      fontSize: '10px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    });
    this.tooltipContainer.add(nameText);

    const descText = this.scene.add.text(6, 18, desc, {
      fontSize: '9px', color: '#aabbcc', fontFamily: 'monospace',
    });
    this.tooltipContainer.add(descText);
  }

  private hideTooltip(): void {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy();
      this.tooltipContainer = null;
    }
  }

  private getBenchSlotAt(screenX: number, screenY: number): number {
    const w = this.scene.scale.width;
    const benchY = this.scene.scale.height - 148;
    const slotSize = 36;
    const slotGap = 5;
    const totalWidth = BENCH_SIZE * (slotSize + slotGap) - slotGap;
    const benchStartX = (w - totalWidth) / 2;

    for (let i = 0; i < BENCH_SIZE; i++) {
      const slotX = benchStartX + i * (slotSize + slotGap);
      if (
        screenX >= slotX && screenX <= slotX + slotSize &&
        screenY >= benchY && screenY <= benchY + slotSize
      ) {
        return i;
      }
    }
    return -1;
  }
}
