import Phaser from 'phaser';
import { COLORS, REROLL_COST, TRAIT_COLORS } from '../utils/constants';
import { ShopSlot } from '../systems/ShopManager';
import { GameScene } from '../scenes/GameScene';

export class ShopPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private startButton!: Phaser.GameObjects.Container;
  private rerollButton!: Phaser.GameObjects.Container;
  private visible: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    this.createPanel();
  }

  private createPanel(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const panelH = 110;
    const panelY = h - panelH;

    // Background
    const bg = this.scene.add.rectangle(0, panelY, w, panelH, COLORS.uiBg, 0.9);
    bg.setOrigin(0, 0);
    this.container.add(bg);

    // Border line
    const border = this.scene.add.rectangle(0, panelY, w, 2, COLORS.uiBorder, 1);
    border.setOrigin(0, 0);
    this.container.add(border);

    // Shop slots (5 champion cards)
    const slotWidth = 120;
    const slotGap = 8;
    const totalSlotsWidth = 5 * slotWidth + 4 * slotGap;
    const startX = (w - totalSlotsWidth) / 2;

    for (let i = 0; i < 5; i++) {
      const slotX = startX + i * (slotWidth + slotGap);
      const slotY = panelY + 8;
      const slotContainer = this.createSlotContainer(slotX, slotY, slotWidth, i);
      this.slotContainers.push(slotContainer);
      this.container.add(slotContainer);
    }

    // Reroll button
    this.rerollButton = this.createButton(
      startX - 90,
      panelY + 30,
      80,
      40,
      `Reroll\n(${REROLL_COST}g)`,
      0x2980b9,
    );
    this.container.add(this.rerollButton);

    // Start Wave button
    this.startButton = this.createButton(
      startX + totalSlotsWidth + 10,
      panelY + 30,
      90,
      40,
      'Start\nWave',
      0x27ae60,
    );
    this.container.add(this.startButton);
  }

  private createSlotContainer(x: number, y: number, width: number, index: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Card background
    const card = this.scene.add.rectangle(0, 0, width, 90, 0x1a1a3e, 1);
    card.setOrigin(0, 0);
    card.setStrokeStyle(1, 0x4444aa, 0.8);
    container.add(card);

    // Name text
    const nameText = this.scene.add.text(width / 2, 6, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      align: 'center',
    });
    nameText.setOrigin(0.5, 0);
    nameText.setName('nameText');
    container.add(nameText);

    // Cost text
    const costText = this.scene.add.text(width - 6, 6, '', {
      fontSize: '14px',
      color: '#ffd700',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    costText.setOrigin(1, 0);
    costText.setName('costText');
    container.add(costText);

    // Traits text
    const traitText = this.scene.add.text(width / 2, 26, '', {
      fontSize: '12px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
      align: 'center',
    });
    traitText.setOrigin(0.5, 0);
    traitText.setName('traitText');
    container.add(traitText);

    // Stats text
    const statsText = this.scene.add.text(width / 2, 44, '', {
      fontSize: '11px',
      color: '#cccccc',
      fontFamily: 'monospace',
      align: 'center',
    });
    statsText.setOrigin(0.5, 0);
    statsText.setName('statsText');
    container.add(statsText);

    // "BUY" text
    const buyText = this.scene.add.text(width / 2, 70, 'BUY', {
      fontSize: '14px',
      color: '#44ff44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    buyText.setOrigin(0.5, 0);
    buyText.setName('buyText');
    container.add(buyText);

    // Make clickable
    card.setInteractive({ useHandCursor: true });
    card.on('pointerdown', () => {
      const gameScene = this.scene.scene.get('GameScene') as GameScene;
      if (gameScene.phase !== 'shopping') return;
      gameScene.shopManager.buyChampion(index);
    });
    card.on('pointerover', () => card.setFillStyle(0x2a2a5e, 1));
    card.on('pointerout', () => card.setFillStyle(0x1a1a3e, 1));

    return container;
  }

  private createButton(x: number, y: number, w: number, h: number, label: string, color: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.rectangle(0, 0, w, h, color, 1);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(1, 0xffffff, 0.3);
    container.add(bg);

    const text = this.scene.add.text(w / 2, h / 2, label, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      align: 'center',
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setAlpha(0.8));
    bg.on('pointerout', () => bg.setAlpha(1));

    return container;
  }

  setupEvents(gameScene: GameScene): void {
    // Reroll click
    const rerollBg = this.rerollButton.list[0] as Phaser.GameObjects.Rectangle;
    rerollBg.on('pointerdown', () => {
      if (gameScene.phase !== 'shopping') return;
      gameScene.shopManager.reroll();
    });

    // Start Wave click
    const startBg = this.startButton.list[0] as Phaser.GameObjects.Rectangle;
    startBg.on('pointerdown', () => {
      if (gameScene.phase !== 'shopping') return;
      gameScene.startCombatPhase();
    });
  }

  updateSlots(slots: ShopSlot[]): void {
    for (let i = 0; i < this.slotContainers.length; i++) {
      const container = this.slotContainers[i];
      const slot = slots[i];

      const nameText = container.getByName('nameText') as Phaser.GameObjects.Text;
      const costText = container.getByName('costText') as Phaser.GameObjects.Text;
      const traitText = container.getByName('traitText') as Phaser.GameObjects.Text;
      const statsText = container.getByName('statsText') as Phaser.GameObjects.Text;
      const buyText = container.getByName('buyText') as Phaser.GameObjects.Text;

      if (slot && slot.available) {
        const d = slot.championData;
        nameText.setText(d.name);
        costText.setText(`${d.cost}g`);
        traitText.setText(d.traits.join(' / '));
        statsText.setText(`DMG:${d.stats.damage} RNG:${d.stats.range} SPD:${d.stats.attackSpeed.toFixed(1)}`);
        buyText.setText('BUY').setColor('#44ff44');
      } else {
        nameText.setText('SOLD');
        costText.setText('');
        traitText.setText('');
        statsText.setText('');
        buyText.setText('').setColor('#666666');
      }
    }
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.container.setVisible(visible);
  }

  isVisible(): boolean {
    return this.visible;
  }
}
