import Phaser from 'phaser';
import { HUD } from '../ui/HUD';
import { ShopPanel } from '../ui/ShopPanel';
import { SynergyBar } from '../ui/SynergyBar';
import { ChampionTooltip } from '../ui/ChampionTooltip';
import { GameScene } from './GameScene';
import { BENCH_SIZE, COLORS } from '../utils/constants';
import { tileToScreen } from '../utils/iso';
import { TileType } from '../map/IsometricMap';

export class UIScene extends Phaser.Scene {
  private hud!: HUD;
  private shopPanel!: ShopPanel;
  private synergyBar!: SynergyBar;
  private tooltip!: ChampionTooltip;
  private benchSlots: Phaser.GameObjects.Container[] = [];
  private gameOverOverlay: Phaser.GameObjects.Container | null = null;

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
    gameScene.events.on('championsChanged', () => this.updateBenchUI(gameScene));
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

    // Click handling for champion placement
    this.setupPlacementInput(gameScene);
  }

  private createBenchUI(): void {
    const w = this.scale.width;
    const benchY = this.scale.height - 130;
    const slotSize = 34;
    const gap = 4;
    const totalWidth = BENCH_SIZE * (slotSize + gap) - gap;
    const startX = (w - totalWidth) / 2;

    for (let i = 0; i < BENCH_SIZE; i++) {
      const x = startX + i * (slotSize + gap);
      const container = this.add.container(x, benchY);
      container.setScrollFactor(0);
      container.setDepth(1000);

      const bg = this.add.rectangle(0, 0, slotSize, slotSize, 0x222244, 0.8);
      bg.setOrigin(0, 0);
      bg.setStrokeStyle(1, 0x4444aa, 0.5);
      container.add(bg);

      // Champion icon placeholder
      const icon = this.add.sprite(slotSize / 2, slotSize / 2, 'champion_default');
      icon.setVisible(false);
      icon.setName('icon');
      container.add(icon);

      // Star text
      const starText = this.add.text(slotSize / 2, 2, '', {
        fontSize: '8px',
        color: '#ffd700',
        fontFamily: 'monospace',
      });
      starText.setOrigin(0.5, 0);
      starText.setName('starText');
      container.add(starText);

      // Make interactive
      bg.setInteractive({ useHandCursor: true });
      const slotIndex = i;
      bg.on('pointerdown', () => this.onBenchSlotClick(slotIndex));
      bg.on('pointerover', () => this.onBenchSlotHover(slotIndex, true));
      bg.on('pointerout', () => this.onBenchSlotHover(slotIndex, false));

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

  private onBenchSlotClick(index: number): void {
    const gameScene = this.scene.get('GameScene') as GameScene;
    if (gameScene.phase !== 'shopping') return;

    const champion = gameScene.bench[index];
    if (!champion) return;

    if (gameScene.placingChampion === champion) {
      // Cancel placement
      gameScene.placingChampion = null;
    } else {
      // Start placing this champion
      gameScene.placingChampion = champion;
    }
  }

  private onBenchSlotHover(index: number, over: boolean): void {
    const gameScene = this.scene.get('GameScene') as GameScene;
    const champion = gameScene.bench[index];

    if (over && champion) {
      const container = this.benchSlots[index];
      this.tooltip.show(champion, container.x, container.y);
    } else {
      this.tooltip.hide();
    }
  }

  private setupPlacementInput(gameScene: GameScene): void {
    // Listen for clicks on the game scene to place champions
    gameScene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 0) return;
      if (gameScene.phase !== 'shopping') return;

      const selectedTile = gameScene.isoMap.getSelectedTile();
      if (!selectedTile) return;

      const { col, row } = selectedTile;

      if (gameScene.placingChampion) {
        // Place the champion
        const success = gameScene.placeChampion(gameScene.placingChampion, col, row);
        if (success) {
          gameScene.placingChampion = null;
          gameScene.isoMap.clearSelection();
        }
      } else {
        // Check if there's a champion on this tile to pick up
        const champOnTile = gameScene.champions.find(
          c => c.placed && c.gridCol === col && c.gridRow === row
        );
        if (champOnTile) {
          gameScene.removeChampionFromBoard(champOnTile);
        }
      }
    });

    // Right-click to sell
    gameScene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button !== 2) return;
      if (gameScene.phase !== 'shopping') return;

      const selectedTile = gameScene.isoMap.getSelectedTile();
      if (!selectedTile) return;

      const champOnTile = gameScene.champions.find(
        c => c.placed && c.gridCol === selectedTile.col && c.gridRow === selectedTile.row
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
