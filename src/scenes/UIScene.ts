import Phaser from 'phaser';
import { HUD } from '../ui/HUD';
import { ShopPanel } from '../ui/ShopPanel';
import { SynergyBar } from '../ui/SynergyBar';
import { ChampionTooltip } from '../ui/ChampionTooltip';
import { GameScene } from './GameScene';
import { BENCH_SIZE, COLORS } from '../utils/constants';
import { tileToScreen, screenToTileRounded } from '../utils/iso';
import { TileType } from '../map/IsometricMap';
import { Champion } from '../entities/Champion';

export class UIScene extends Phaser.Scene {
  private hud!: HUD;
  private shopPanel!: ShopPanel;
  private synergyBar!: SynergyBar;
  private tooltip!: ChampionTooltip;
  private benchSlots: Phaser.GameObjects.Container[] = [];
  private gameOverOverlay: Phaser.GameObjects.Container | null = null;

  // Drag state
  private dragSprite: Phaser.GameObjects.Sprite | null = null;
  private dragChampion: Champion | null = null;
  private dragFromBenchIndex: number = -1;
  private dragFromBoard: boolean = false;

  // Bench layout constants
  private benchY: number = 0;
  private benchStartX: number = 0;
  private slotSize: number = 34;
  private slotGap: number = 4;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const gameScene = this.scene.get('GameScene') as GameScene;

    this.hud = new HUD(this);
    this.shopPanel = new ShopPanel(this);
    this.synergyBar = new SynergyBar(this);
    this.tooltip = new ChampionTooltip(this);

    this.shopPanel.setupEvents(gameScene);
    this.createBenchUI();

    // Listen to game events
    gameScene.events.on('goldChanged', (gold: number) => this.hud.updateGold(gold));
    gameScene.events.on('livesChanged', (lives: number) => this.hud.updateLives(lives));
    gameScene.events.on('waveChanged', (wave: number) => this.hud.updateWave(wave));
    gameScene.events.on('phaseChanged', (phase: string) => {
      this.hud.updatePhase(phase);
      this.shopPanel.setVisible(phase === 'shopping');
    });
    gameScene.events.on('shopUpdated', (slots: any[]) => this.shopPanel.updateSlots(slots));
    gameScene.events.on('synergiesChanged', (synergies: any[]) => this.synergyBar.update(synergies));
    gameScene.events.on('championsChanged', () => {
      this.updateBenchUI(gameScene);
      this.hud.updateBoardCount(gameScene.getPlacedCount(), gameScene.economyManager.getMaxBoardSize());
    });
    gameScene.events.on('levelChanged', (level: number, xp: number, xpNeeded: number, maxBoard: number) => {
      this.hud.updateLevel(level, xp, xpNeeded, maxBoard);
      this.hud.updateBoardCount(gameScene.getPlacedCount(), maxBoard);
    });
    gameScene.events.on('gameOver', (wave: number) => this.showGameOver(wave));

    // Initial UI state (pull current values since events may have fired before we listened)
    this.hud.updateGold(gameScene.getGold());
    this.hud.updateLives(gameScene.lives);
    this.hud.updateWave(gameScene.waveNumber);
    this.hud.updatePhase(gameScene.phase);
    if (gameScene.shopManager.shopSlots.length > 0) {
      this.shopPanel.updateSlots(gameScene.shopManager.shopSlots);
    }
    this.updateBenchUI(gameScene);
    this.hud.updateLevel(gameScene.economyManager.level, gameScene.economyManager.xp, gameScene.economyManager.getXpToNextLevel(), gameScene.economyManager.getMaxBoardSize());
    this.hud.updateBoardCount(gameScene.getPlacedCount(), gameScene.economyManager.getMaxBoardSize());

    // Drag-and-drop input
    this.setupDragAndDrop(gameScene);

    // Right-click to sell on GameScene
    this.setupSellInput(gameScene);
  }

  private createBenchUI(): void {
    const w = this.scale.width;
    this.benchY = this.scale.height - 130;
    this.slotSize = 34;
    this.slotGap = 4;
    const totalWidth = BENCH_SIZE * (this.slotSize + this.slotGap) - this.slotGap;
    this.benchStartX = (w - totalWidth) / 2;

    for (let i = 0; i < BENCH_SIZE; i++) {
      const x = this.benchStartX + i * (this.slotSize + this.slotGap);
      const container = this.add.container(x, this.benchY);
      container.setScrollFactor(0);
      container.setDepth(1000);

      const bg = this.add.rectangle(0, 0, this.slotSize, this.slotSize, 0x222244, 0.8);
      bg.setOrigin(0, 0);
      bg.setStrokeStyle(1, 0x4444aa, 0.5);
      container.add(bg);

      // Champion icon placeholder
      const icon = this.add.sprite(this.slotSize / 2, this.slotSize / 2, 'champion_default');
      icon.setVisible(false);
      icon.setName('icon');
      container.add(icon);

      // Star text
      const starText = this.add.text(this.slotSize / 2, 2, '', {
        fontSize: '8px',
        color: '#ffd700',
        fontFamily: 'monospace',
      });
      starText.setOrigin(0.5, 0);
      starText.setName('starText');
      container.add(starText);

      this.benchSlots.push(container);
    }
  }

  private updateBenchUI(gameScene: GameScene): void {
    for (let i = 0; i < BENCH_SIZE; i++) {
      const container = this.benchSlots[i];
      if (!container) continue;

      const champion = gameScene.bench[i];
      const icon = container.getByName('icon') as Phaser.GameObjects.Sprite;
      const starText = container.getByName('starText') as Phaser.GameObjects.Text;

      if (champion) {
        icon.setTexture(champion.textureKey);
        icon.setVisible(true);
        starText.setText('\u2605'.repeat(champion.starLevel));
      } else {
        icon.setVisible(false);
        starText.setText('');
      }
    }
  }

  private setupDragAndDrop(gameScene: GameScene): void {
    // We listen on this (UIScene) for all pointer events since it's the top scene
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return;
      if (gameScene.phase !== 'shopping') return;

      // Check if clicking a bench slot
      const benchIndex = this.getBenchSlotAt(pointer.x, pointer.y);
      if (benchIndex >= 0) {
        const champion = gameScene.bench[benchIndex];
        if (champion) {
          this.startDrag(champion, benchIndex, false, pointer);
          return;
        }
      }

      // Check if clicking a champion on the board (convert screen to game world coords)
      const worldPoint = gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);
      const champOnTile = gameScene.champions.find(
        c => c.placed && c.gridCol === col && c.gridRow === row
      );
      if (champOnTile) {
        this.startDrag(champOnTile, -1, true, pointer);
        return;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragSprite) return;

      // Move drag sprite to follow cursor
      this.dragSprite.setPosition(pointer.x, pointer.y);

      // Highlight the tile under cursor on the game map
      const worldPoint = gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);

      // Check if over a valid placement tile
      const tileType = gameScene.isoMap.getTileType(col, row);
      const isOccupied = gameScene.isoMap.isOccupied(col, row);
      const isValid = tileType === TileType.Placeable && !isOccupied;

      gameScene.isoMap.setDragHighlight(col, row, isValid);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return;
      if (!this.dragChampion) return;

      gameScene.isoMap.clearDragHighlight();

      // Check drop target: bench slot or map tile
      const benchIndex = this.getBenchSlotAt(pointer.x, pointer.y);

      if (benchIndex >= 0) {
        // Dropped on bench
        this.dropOnBench(gameScene, benchIndex);
      } else {
        // Check if dropped on the map
        const worldPoint = gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);
        const tileType = gameScene.isoMap.getTileType(col, row);
        const isOccupied = gameScene.isoMap.isOccupied(col, row);

        if (tileType === TileType.Placeable && !isOccupied) {
          this.dropOnMap(gameScene, col, row);
        } else {
          // Invalid drop — cancel, return to original position
          this.cancelDrag(gameScene);
        }
      }

      this.endDrag();
    });
  }

  private startDrag(champion: Champion, benchIndex: number, fromBoard: boolean, pointer: Phaser.Input.Pointer): void {
    this.dragChampion = champion;
    this.dragFromBenchIndex = benchIndex;
    this.dragFromBoard = fromBoard;
    this.tooltip.hide();

    // Create a sprite that follows the cursor (in UIScene, screen coords)
    this.dragSprite = this.add.sprite(pointer.x, pointer.y, champion.textureKey);
    this.dragSprite.setScale(1.4);
    this.dragSprite.setAlpha(0.8);
    this.dragSprite.setDepth(2000);

    // Hide the original from bench/board while dragging
    if (fromBoard) {
      champion.sprite.setVisible(false);
      champion.starIndicator.setVisible(false);
    } else {
      // Hide bench icon
      const container = this.benchSlots[benchIndex];
      if (container) {
        const icon = container.getByName('icon') as Phaser.GameObjects.Sprite;
        icon.setVisible(false);
      }
    }
  }

  private dropOnMap(gameScene: GameScene, col: number, row: number): void {
    const champion = this.dragChampion!;

    if (this.dragFromBoard) {
      // Moving from one tile to another
      if (champion.gridCol !== undefined && champion.gridRow !== undefined) {
        gameScene.isoMap.setOccupied(champion.gridCol, champion.gridRow, false);
      }
      champion.removeFromBoard();
    } else {
      // Moving from bench to map — remove from bench
      const benchIdx = gameScene.bench.indexOf(champion);
      if (benchIdx !== -1) {
        gameScene.bench[benchIdx] = null;
      }
    }

    gameScene.placeChampion(champion, col, row);
  }

  private dropOnBench(gameScene: GameScene, targetBenchIndex: number): void {
    const champion = this.dragChampion!;
    const targetSlotChamp = gameScene.bench[targetBenchIndex];

    if (this.dragFromBoard) {
      // Board → bench
      if (targetSlotChamp === null || targetSlotChamp === undefined) {
        gameScene.removeChampionFromBoard(champion);
        // removeChampionFromBoard puts it in first empty slot, but we want it at targetBenchIndex
        // Find where it was placed and swap
        const autoIdx = gameScene.bench.indexOf(champion);
        if (autoIdx !== -1 && autoIdx !== targetBenchIndex) {
          gameScene.bench[autoIdx] = gameScene.bench[targetBenchIndex] ?? null;
          gameScene.bench[targetBenchIndex] = champion;
        }
      } else {
        // Target bench slot occupied — just return to board
        champion.sprite.setVisible(true);
        champion.starIndicator.setVisible(true);
      }
    } else {
      // Bench → bench (reorder)
      if (this.dragFromBenchIndex !== targetBenchIndex) {
        // Swap the two bench slots
        gameScene.bench[this.dragFromBenchIndex] = targetSlotChamp ?? null;
        gameScene.bench[targetBenchIndex] = champion;
      }
    }

    gameScene.events.emit('championsChanged');
  }

  private cancelDrag(gameScene: GameScene): void {
    const champion = this.dragChampion;
    if (!champion) return;

    if (this.dragFromBoard) {
      // Return to board — just show again
      champion.sprite.setVisible(true);
      champion.starIndicator.setVisible(true);
    }
    // Bench items: updateBenchUI will restore the icon
    gameScene.events.emit('championsChanged');
  }

  private endDrag(): void {
    if (this.dragSprite) {
      this.dragSprite.destroy();
      this.dragSprite = null;
    }
    this.dragChampion = null;
    this.dragFromBenchIndex = -1;
    this.dragFromBoard = false;
  }

  private getBenchSlotAt(screenX: number, screenY: number): number {
    for (let i = 0; i < BENCH_SIZE; i++) {
      const slotX = this.benchStartX + i * (this.slotSize + this.slotGap);
      if (
        screenX >= slotX &&
        screenX <= slotX + this.slotSize &&
        screenY >= this.benchY &&
        screenY <= this.benchY + this.slotSize
      ) {
        return i;
      }
    }
    return -1;
  }

  private setupSellInput(gameScene: GameScene): void {
    // Right-click to sell from board
    gameScene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 2) return;
      if (gameScene.phase !== 'shopping') return;

      const worldPoint = gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);

      const champOnTile = gameScene.champions.find(
        c => c.placed && c.gridCol === col && c.gridRow === row
      );
      if (champOnTile) {
        gameScene.sellChampion(champOnTile);
      }
    });
  }

  private showGameOver(wave: number): void {
    if (this.gameOverOverlay) return;

    this.gameOverOverlay = this.add.container(0, 0);
    this.gameOverOverlay.setScrollFactor(0);
    this.gameOverOverlay.setDepth(2000);

    const bg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7);
    bg.setOrigin(0, 0);
    this.gameOverOverlay.add(bg);

    const title = this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.gameOverOverlay.add(title);

    const info = this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, `You survived ${wave - 1} waves!`, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    info.setOrigin(0.5);
    this.gameOverOverlay.add(info);

    const restart = this.add.text(this.scale.width / 2, this.scale.height / 2 + 70, 'Click to restart', {
      fontSize: '18px',
      color: '#88ff88',
      fontFamily: 'monospace',
    });
    restart.setOrigin(0.5);
    this.gameOverOverlay.add(restart);

    bg.setInteractive();
    bg.on('pointerdown', () => {
      this.gameOverOverlay?.destroy();
      this.gameOverOverlay = null;
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
  }
}
