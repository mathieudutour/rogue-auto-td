import Phaser from 'phaser';
import { HUD } from '../ui/HUD';
import { ShopPanel } from '../ui/ShopPanel';
import { SynergyBar } from '../ui/SynergyBar';
import { ChampionTooltip } from '../ui/ChampionTooltip';
import { ItemPanel } from '../ui/ItemPanel';
import { GameScene } from './GameScene';
import { BENCH_SIZE, COLORS } from '../utils/constants';
import { tileToScreen, screenToTileRounded } from '../utils/iso';
import { TileType } from '../map/IsometricMap';
import { Champion } from '../entities/Champion';
import { getLayout, LayoutMetrics } from '../utils/responsive';
import { DamagePanel } from '../ui/DamagePanel';

export class UIScene extends Phaser.Scene {
  private hud!: HUD;
  private shopPanel!: ShopPanel;
  private synergyBar!: SynergyBar;
  private tooltip!: ChampionTooltip;
  private itemPanel!: ItemPanel;
  private benchSlots: Phaser.GameObjects.Container[] = [];
  private gameOverOverlay: Phaser.GameObjects.Container | null = null;
  private damagePanel!: DamagePanel;
  private layout!: LayoutMetrics;

  // Drag state
  private dragSprite: Phaser.GameObjects.Sprite | null = null;
  private dragChampion: Champion | null = null;
  private dragFromBenchIndex: number = -1;
  private dragFromBoard: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private isDragging: boolean = false;
  private static readonly DRAG_THRESHOLD = 6;

  // Sell bin
  private sellBin!: Phaser.GameObjects.Container;
  private sellBinBg!: Phaser.GameObjects.Rectangle;
  private sellBinText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this.layout = getLayout(this.scale.width, this.scale.height);
    const gameScene = this.scene.get('GameScene') as GameScene;

    this.hud = new HUD(this);
    this.shopPanel = new ShopPanel(this);
    this.synergyBar = new SynergyBar(this);
    this.tooltip = new ChampionTooltip(this);
    this.itemPanel = new ItemPanel(this);
    this.damagePanel = new DamagePanel(this);

    this.shopPanel.setupEvents(gameScene);
    this.itemPanel.setupEvents(gameScene);
    this.createBenchUI();
    this.createSellBin();

    // Listen to game events
    gameScene.events.on('goldChanged', (gold: number) => this.hud.updateGold(gold));
    gameScene.events.on('livesChanged', (lives: number) => this.hud.updateLives(lives));
    gameScene.events.on('waveChanged', (wave: number) => this.hud.updateWave(wave));
    gameScene.events.on('phaseChanged', (phase: string) => {
      this.hud.updatePhase(phase);
      this.shopPanel.updatePhase(phase);
      if (phase === 'shopping') this.damagePanel.hide();
    });
    gameScene.events.on('damageUpdate', (champions: Champion[]) => {
      this.damagePanel.update(champions);
    });
    gameScene.events.on('incomeBreakdown', (income: { base: number; interest: number; streak: number; total: number }) => {
      this.hud.updateGold(gameScene.economyManager.getGold());
      this.hud.updateStreak(gameScene.economyManager.winStreak);
      this.hud.showIncomeBreakdown(income);
    });
    gameScene.events.on('shopUpdated', (slots: any[]) => this.shopPanel.updateSlots(slots));
    gameScene.events.on('synergiesChanged', (synergies: any[]) => this.synergyBar.update(synergies, gameScene.champions));
    gameScene.events.on('championsChanged', () => {
      this.updateBenchUI(gameScene);
      this.hud.updateBoardCount(gameScene.getPlacedCount(), gameScene.economyManager.getMaxBoardSize());
    });
    gameScene.events.on('levelChanged', (level: number, xp: number, xpNeeded: number, maxBoard: number) => {
      this.hud.updateLevel(level, xp, xpNeeded, maxBoard);
      this.hud.updateBoardCount(gameScene.getPlacedCount(), maxBoard);
      this.shopPanel.updateLevel(level);
    });
    gameScene.events.on('gameOver', (wave: number, soulsEarned: number) => this.showGameOver(wave, soulsEarned));
    gameScene.events.on('itemInventoryChanged', (items: any[]) => this.itemPanel.update(items));

    // Initial UI state
    this.hud.updateGold(gameScene.getGold());
    this.hud.updateLives(gameScene.lives);
    this.hud.updateWave(gameScene.waveNumber);
    this.hud.updatePhase(gameScene.phase);
    this.shopPanel.updatePhase(gameScene.phase);
    if (gameScene.shopManager.shopSlots.length > 0) {
      this.shopPanel.updateSlots(gameScene.shopManager.shopSlots);
    }
    this.updateBenchUI(gameScene);
    this.hud.updateLevel(gameScene.economyManager.level, gameScene.economyManager.xp, gameScene.economyManager.getXpToNextLevel(), gameScene.economyManager.getMaxBoardSize());
    this.hud.updateBoardCount(gameScene.getPlacedCount(), gameScene.economyManager.getMaxBoardSize());
    this.shopPanel.updateLevel(gameScene.economyManager.level);
    this.itemPanel.update(gameScene.itemInventory);

    // Drag-and-drop input
    this.setupDragAndDrop(gameScene);

    // Right-click to sell on GameScene
    this.setupSellInput(gameScene);
  }

  private createBenchUI(): void {
    const m = this.layout;
    const d = m.dpr;
    const s = (v: number) => Math.round(v * d);
    const totalWidth = BENCH_SIZE * (m.benchSlotSize + m.benchSlotGap) - m.benchSlotGap;
    const benchStartX = (m.width - totalWidth) / 2;

    // Bench label
    const label = this.add.text(benchStartX - s(2), m.benchY - s(m.isMobile ? 12 : 14), 'BENCH', {
      fontSize: `${s(9)}px`,
      color: '#556677',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    label.setScrollFactor(0).setDepth(1000);

    for (let i = 0; i < BENCH_SIZE; i++) {
      const x = benchStartX + i * (m.benchSlotSize + m.benchSlotGap);
      const container = this.add.container(x, m.benchY);
      container.setScrollFactor(0);
      container.setDepth(1000);

      const bg = this.add.rectangle(0, 0, m.benchSlotSize, m.benchSlotSize, 0x12162a, 0.85);
      bg.setOrigin(0, 0);
      bg.setStrokeStyle(1, 0x334466, 0.6);
      container.add(bg);

      const icon = this.add.sprite(m.benchSlotSize / 2, m.benchSlotSize / 2, 'champion_default');
      icon.setVisible(false);
      icon.setName('icon');
      container.add(icon);

      const starText = this.add.text(m.benchSlotSize / 2, s(2), '', {
        fontSize: `${s(8)}px`,
        color: '#ffd700',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      });
      starText.setOrigin(0.5, 0);
      starText.setName('starText');
      container.add(starText);

      this.benchSlots.push(container);
    }
  }

  private createSellBin(): void {
    const m = this.layout;
    const d = m.dpr;
    const s = (v: number) => Math.round(v * d);
    const binW = s(m.isMobile ? 120 : 180);
    const binH = s(m.isMobile ? 36 : 50);

    this.sellBin = this.add.container(m.width / 2 - binW / 2, m.height - binH - s(m.isMobile ? 10 : 20));
    this.sellBin.setScrollFactor(0);
    this.sellBin.setDepth(1500);
    this.sellBin.setVisible(false);

    this.sellBinBg = this.add.rectangle(0, 0, binW, binH, 0x661111, 0.92);
    this.sellBinBg.setOrigin(0, 0);
    this.sellBinBg.setStrokeStyle(s(2), 0xcc3333, 0.8);
    this.sellBin.add(this.sellBinBg);

    this.sellBinText = this.add.text(binW / 2, binH / 2, 'SELL', {
      fontSize: `${s(m.isMobile ? 12 : 16)}px`,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ff6666',
      align: 'center',
    });
    this.sellBinText.setOrigin(0.5, 0.5);
    this.sellBin.add(this.sellBinText);
  }

  private showSellBin(champion: Champion): void {
    this.sellBinText.setText(`SELL for ${champion.getSellPrice()}g`);
    this.sellBin.setVisible(true);
  }

  private hideSellBin(): void {
    this.sellBin.setVisible(false);
    this.sellBinBg.setFillStyle(0x881111, 0.9);
  }

  private isOverSellBin(x: number, y: number): boolean {
    if (!this.sellBin.visible) return false;
    const binX = this.sellBin.x;
    const binY = this.sellBin.y;
    const m = this.layout;
    const d = m.dpr;
    const s = (v: number) => Math.round(v * d);
    const binW = s((m.isMobile ? 120 : 180) + 20);
    const binH = s((m.isMobile ? 36 : 50) + 10);
    return x >= binX && x <= binX + binW && y >= binY && y <= binY + binH;
  }

  private updateSellBinHover(x: number, y: number): void {
    if (this.isOverSellBin(x, y)) {
      this.sellBinBg.setFillStyle(0xcc2222, 1);
      this.sellBinBg.setStrokeStyle(3, 0xff6666, 1);
    } else {
      this.sellBinBg.setFillStyle(0x881111, 0.9);
      this.sellBinBg.setStrokeStyle(2, 0xff4444, 0.8);
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
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return;

      let champion: Champion | null = null;
      let benchIndex = -1;
      let fromBoard = false;
      const isCombat = gameScene.phase === 'combat';

      // Check bench first
      const benchIdx = this.getBenchSlotAt(pointer.x, pointer.y);
      if (benchIdx >= 0) {
        champion = gameScene.bench[benchIdx] ?? null;
        benchIndex = benchIdx;
      } else {
        // Check board
        const worldPoint = gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);
        const champOnTile = gameScene.champions.find(
          c => c.placed && c.gridCol === col && c.gridRow === row
        );
        if (champOnTile) {
          if (isCombat) {
            // During combat, board champions can only be inspected (tooltip), not dragged
            if (this.tooltip.isVisible() && this.tooltip.getChampion() === champOnTile) {
              this.tooltip.hide();
            } else {
              this.tooltip.show(champOnTile, pointer.x, pointer.y);
            }
            return;
          }
          champion = champOnTile;
          fromBoard = true;
        }
      }

      if (champion && !this.itemPanel.isDragActive() && !this.itemPanel.isPointerOverItem(pointer.x, pointer.y, gameScene.itemInventory.length)) {
        this.dragChampion = champion;
        this.dragFromBenchIndex = benchIndex;
        this.dragFromBoard = fromBoard;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.isDragging = false;
        gameScene.uiDragActive = true;
      } else {
        this.tooltip.hide();
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragChampion) return;

      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!this.isDragging && dist >= UIScene.DRAG_THRESHOLD) {
        this.isDragging = true;
        this.tooltip.hide();
        this.startDrag(this.dragChampion, this.dragFromBenchIndex, this.dragFromBoard, pointer);
        this.showSellBin(this.dragChampion);
      }

      if (this.isDragging && this.dragSprite) {
        this.dragSprite.setPosition(pointer.x, pointer.y);
        this.updateSellBinHover(pointer.x, pointer.y);

        const worldPoint = gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);

        const tileType = gameScene.isoMap.getTileType(col, row);
        const isOccupied = gameScene.isoMap.isOccupied(col, row);
        // Valid if placeable and either empty or occupied by a different champion (swap)
        const occupiedByOther = isOccupied && gameScene.champions.some(
          c => c.placed && c.gridCol === col && c.gridRow === row && c !== this.dragChampion
        );
        const isValid = tileType === TileType.Placeable && (!isOccupied || occupiedByOther);

        gameScene.isoMap.setDragHighlight(col, row, isValid);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return;
      if (!this.dragChampion) return;

      if (!this.isDragging) {
        const champion = this.dragChampion;
        if (this.tooltip.isVisible() && this.tooltip.getChampion() === champion) {
          this.tooltip.hide();
        } else {
          this.tooltip.show(champion, pointer.x, pointer.y);
        }
        this.dragChampion = null;
        this.dragFromBenchIndex = -1;
        this.dragFromBoard = false;
        gameScene.uiDragActive = false;
        return;
      }

      gameScene.isoMap.clearDragHighlight();

      const isCombat = gameScene.phase === 'combat';
      const overSellBin = this.isOverSellBin(pointer.x, pointer.y);
      this.hideSellBin();

      if (overSellBin) {
        // During combat, only allow selling bench champions via drag
        if (isCombat && this.dragFromBoard) {
          this.cancelDrag(gameScene);
        } else {
          this.dropOnSellBin(gameScene);
        }
        this.endDrag();
        return;
      }

      const benchIndex = this.getBenchSlotAt(pointer.x, pointer.y);

      if (benchIndex >= 0) {
        this.dropOnBench(gameScene, benchIndex);
      } else if (isCombat) {
        // During combat, can't place champions on the board
        this.cancelDrag(gameScene);
      } else {
        const worldPoint = gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);
        const tileType = gameScene.isoMap.getTileType(col, row);
        const isOccupied = gameScene.isoMap.isOccupied(col, row);

        if (tileType === TileType.Placeable && !isOccupied) {
          this.dropOnMap(gameScene, col, row);
        } else if (tileType === TileType.Placeable && isOccupied) {
          this.dropOnOccupiedTile(gameScene, col, row);
        } else {
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

    this.dragSprite = this.add.sprite(pointer.x, pointer.y, champion.textureKey);
    this.dragSprite.setScale(1.4);
    this.dragSprite.setAlpha(0.8);
    this.dragSprite.setDepth(2000);

    if (fromBoard) {
      champion.sprite.setVisible(false);
      champion.starIndicator.setVisible(false);
    } else {
      const container = this.benchSlots[benchIndex];
      if (container) {
        const icon = container.getByName('icon') as Phaser.GameObjects.Sprite;
        icon.setVisible(false);
      }
    }
  }

  private dropOnSellBin(gameScene: GameScene): void {
    const champion = this.dragChampion!;
    if (this.dragFromBoard) {
      champion.sprite.setVisible(true);
      champion.starIndicator.setVisible(true);
    }
    gameScene.sellChampion(champion);
  }

  private dropOnMap(gameScene: GameScene, col: number, row: number): void {
    const champion = this.dragChampion!;

    if (this.dragFromBoard) {
      if (champion.gridCol !== undefined && champion.gridRow !== undefined) {
        gameScene.isoMap.setOccupied(champion.gridCol, champion.gridRow, false);
      }
      champion.removeFromBoard();
      gameScene.placeChampion(champion, col, row);
    } else {
      // Try placing from bench — only remove from bench if placement succeeds
      if (!gameScene.placeChampion(champion, col, row)) {
        // Board is full, cancel the drag and return champion to bench
        this.cancelDrag(gameScene);
        return;
      }
    }
  }

  /** Swap dragged champion with the champion occupying the target tile. */
  private dropOnOccupiedTile(gameScene: GameScene, col: number, row: number): void {
    const champion = this.dragChampion!;
    const targetChamp = gameScene.champions.find(
      c => c.placed && c.gridCol === col && c.gridRow === row
    );

    if (!targetChamp || targetChamp === champion) {
      this.cancelDrag(gameScene);
      return;
    }

    if (this.dragFromBoard) {
      // Board-to-board swap: swap positions
      const fromCol = champion.gridCol!;
      const fromRow = champion.gridRow!;

      // Remove both from their tiles
      gameScene.isoMap.setOccupied(fromCol, fromRow, false);
      gameScene.isoMap.setOccupied(col, row, false);
      champion.removeFromBoard();
      targetChamp.removeFromBoard();

      // Place each at the other's position
      gameScene.placeChampion(targetChamp, fromCol, fromRow);
      gameScene.placeChampion(champion, col, row);
    } else {
      // Bench-to-board swap: dragged champion takes board spot, target goes to bench
      const maxBoard = gameScene.economyManager.getMaxBoardSize();
      // Since we're swapping 1-for-1, board count stays the same — always valid

      const benchIdx = gameScene.bench.indexOf(champion);

      // Remove target from board to the bench slot the dragged champ came from
      gameScene.isoMap.setOccupied(col, row, false);
      targetChamp.removeFromBoard();
      if (benchIdx !== -1) {
        gameScene.bench[benchIdx] = targetChamp;
      } else {
        const emptySlot = gameScene.bench.indexOf(null);
        if (emptySlot !== -1) {
          gameScene.bench[emptySlot] = targetChamp;
        } else {
          gameScene.bench.push(targetChamp);
        }
      }

      // Place dragged champion on the board
      gameScene.placeChampion(champion, col, row);
    }
  }

  private dropOnBench(gameScene: GameScene, targetBenchIndex: number): void {
    const champion = this.dragChampion!;
    const targetSlotChamp = gameScene.bench[targetBenchIndex];

    if (this.dragFromBoard) {
      if (targetSlotChamp === null || targetSlotChamp === undefined) {
        gameScene.removeChampionFromBoard(champion);
        const autoIdx = gameScene.bench.indexOf(champion);
        if (autoIdx !== -1 && autoIdx !== targetBenchIndex) {
          gameScene.bench[autoIdx] = gameScene.bench[targetBenchIndex] ?? null;
          gameScene.bench[targetBenchIndex] = champion;
        }
      } else {
        champion.sprite.setVisible(true);
        champion.starIndicator.setVisible(true);
      }
    } else {
      if (this.dragFromBenchIndex !== targetBenchIndex) {
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
      champion.sprite.setVisible(true);
      champion.starIndicator.setVisible(true);
    }
    gameScene.events.emit('championsChanged');
  }

  private endDrag(): void {
    if (this.dragSprite) {
      this.dragSprite.destroy();
      this.dragSprite = null;
    }
    this.hideSellBin();
    this.dragChampion = null;
    this.dragFromBenchIndex = -1;
    this.dragFromBoard = false;
    this.isDragging = false;
    const gameScene = this.scene.get('GameScene') as GameScene;
    gameScene.uiDragActive = false;
  }

  private getBenchSlotAt(screenX: number, screenY: number): number {
    const m = this.layout;
    const totalWidth = BENCH_SIZE * (m.benchSlotSize + m.benchSlotGap) - m.benchSlotGap;
    const benchStartX = (m.width - totalWidth) / 2;

    for (let i = 0; i < BENCH_SIZE; i++) {
      const slotX = benchStartX + i * (m.benchSlotSize + m.benchSlotGap);
      if (
        screenX >= slotX &&
        screenX <= slotX + m.benchSlotSize &&
        screenY >= m.benchY &&
        screenY <= m.benchY + m.benchSlotSize
      ) {
        return i;
      }
    }
    return -1;
  }

  private setupSellInput(gameScene: GameScene): void {
    gameScene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 2) return;

      // Right-click on board champion to sell (only during shopping)
      const worldPoint = gameScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { col, row } = screenToTileRounded(worldPoint.x, worldPoint.y);

      const champOnTile = gameScene.champions.find(
        c => c.placed && c.gridCol === col && c.gridRow === row
      );
      if (champOnTile) {
        // Can't sell placed champions during combat
        if (gameScene.phase === 'combat') return;
        gameScene.sellChampion(champOnTile);
      }
    });
  }

  private showGameOver(wave: number, soulsEarned: number = 0): void {
    if (this.gameOverOverlay) return;
    const m = this.layout;
    const d = m.dpr;
    const s = (v: number) => Math.round(v * d);
    const gameScene = this.scene.get('GameScene') as GameScene;

    this.gameOverOverlay = this.add.container(0, 0);
    this.gameOverOverlay.setScrollFactor(0);
    this.gameOverOverlay.setDepth(2000);

    const bg = this.add.rectangle(0, 0, m.width, m.height, 0x000000, 0.7);
    bg.setOrigin(0, 0);
    this.gameOverOverlay.add(bg);

    const titleFs = s(m.isMobile ? 28 : 48);
    const title = this.add.text(m.width / 2, m.height / 2 - s(80), 'THE SHARD BREAKS', {
      fontSize: `${titleFs}px`,
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.gameOverOverlay.add(title);

    const flavor = this.add.text(m.width / 2, m.height / 2 - s(40), 'The rift overwhelms your defenses...', {
      fontSize: `${s(m.isMobile ? 12 : 14)}px`,
      color: '#886666',
      fontFamily: 'monospace',
      fontStyle: 'italic',
    });
    flavor.setOrigin(0.5);
    this.gameOverOverlay.add(flavor);

    const info = this.add.text(m.width / 2, m.height / 2 - s(10), `Defended for ${wave - 1} waves`, {
      fontSize: `${s(m.isMobile ? 16 : 24)}px`,
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    info.setOrigin(0.5);
    this.gameOverOverlay.add(info);

    // Souls earned
    if (soulsEarned > 0) {
      const soulsText = this.add.text(m.width / 2, m.height / 2 + s(25), `+${soulsEarned} souls absorbed`, {
        fontSize: `${s(m.isMobile ? 18 : 26)}px`,
        color: '#cc88ff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      });
      soulsText.setOrigin(0.5);
      this.gameOverOverlay.add(soulsText);
    }

    // Blessing/curse info
    const blessing = gameScene.runConfig?.blessing;
    const curses = gameScene.runConfig?.curses || [];
    let modText = '';
    if (blessing) modText += `Echo: ${blessing.name}`;
    if (curses.length > 0) {
      if (modText) modText += '  |  ';
      modText += `Scars: ${curses.map(c => c.name).join(', ')}`;
    }
    if (modText) {
      const modLabel = this.add.text(m.width / 2, m.height / 2 + s(soulsEarned > 0 ? 55 : 35), modText, {
        fontSize: `${s(m.isMobile ? 11 : 12)}px`,
        color: '#667788',
        fontFamily: 'monospace',
        wordWrap: { width: m.width - s(40) },
        align: 'center',
      });
      modLabel.setOrigin(0.5);
      this.gameOverOverlay.add(modLabel);
    }

    const restart = this.add.text(m.width / 2, m.height / 2 + s(90), 'Return to the Soul Forge', {
      fontSize: `${s(m.isMobile ? 14 : 18)}px`,
      color: '#88ff88',
      fontFamily: 'monospace',
    });
    restart.setOrigin(0.5);
    this.gameOverOverlay.add(restart);

    bg.setInteractive();
    bg.on('pointerdown', () => {
      this.gameOverOverlay?.destroy();
      this.gameOverOverlay = null;
      const meta = gameScene.meta;
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('MetaScene', { meta });
    });
  }
}
