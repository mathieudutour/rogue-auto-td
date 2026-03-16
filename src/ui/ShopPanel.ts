import Phaser from 'phaser';
import { COLORS, REROLL_COST, BUY_XP_COST, TRAIT_COLORS } from '../utils/constants';
import { ShopSlot } from '../systems/ShopManager';
import { GameScene } from '../scenes/GameScene';

/** Color per cost tier for card borders/accents */
const COST_COLORS: Record<number, number> = {
  1: 0x888888,  // gray
  2: 0x22aa44,  // green
  3: 0x3388dd,  // blue
  4: 0xaa44cc,  // purple
  5: 0xffaa00,  // gold
};

const COST_BG: Record<number, number> = {
  1: 0x1a1a28,
  2: 0x152218,
  3: 0x151a28,
  4: 0x1e1528,
  5: 0x28200a,
};

/** Attack type short labels */
function attackLabel(type?: string): string {
  switch (type) {
    case 'splash': return 'AoE';
    case 'slow': return 'Slow';
    case 'chain': return 'Chain';
    case 'dot': return 'DoT';
    default: return '';
  }
}

export class ShopPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private startButton!: Phaser.GameObjects.Container;
  private rerollButton!: Phaser.GameObjects.Container;
  private buyXpButton!: Phaser.GameObjects.Container;
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
    const panelH = 130;
    const panelY = h - panelH;

    // Background with gradient effect (two layered rects)
    const bgOuter = this.scene.add.rectangle(0, panelY, w, panelH, 0x0a0e1a, 0.95);
    bgOuter.setOrigin(0, 0);
    this.container.add(bgOuter);

    // Top accent line
    const accent = this.scene.add.rectangle(0, panelY, w, 2, 0x334466, 1);
    accent.setOrigin(0, 0);
    this.container.add(accent);

    // Shop slots
    const slotWidth = 140;
    const slotHeight = 100;
    const slotGap = 10;
    const totalSlotsWidth = 5 * slotWidth + 4 * slotGap;
    const startX = (w - totalSlotsWidth) / 2;

    for (let i = 0; i < 5; i++) {
      const slotX = startX + i * (slotWidth + slotGap);
      const slotY = panelY + 14;
      const slotContainer = this.createSlotContainer(slotX, slotY, slotWidth, slotHeight, i);
      this.slotContainers.push(slotContainer);
      this.container.add(slotContainer);
    }

    // Left side buttons
    const btnAreaX = startX - 110;

    this.buyXpButton = this.createActionButton(
      btnAreaX, panelY + 16, 90, 42,
      `BUY XP`, `${BUY_XP_COST}g`,
      0x6b2fa0, 0x8e44ad,
    );
    this.container.add(this.buyXpButton);

    this.rerollButton = this.createActionButton(
      btnAreaX, panelY + 68, 90, 42,
      `REROLL`, `${REROLL_COST}g`,
      0x1a6b9b, 0x2980b9,
    );
    this.container.add(this.rerollButton);

    // Start wave button — right side
    this.startButton = this.createStartButton(
      startX + totalSlotsWidth + 14, panelY + 30, 90, 68,
    );
    this.container.add(this.startButton);
  }

  private createSlotContainer(x: number, y: number, width: number, height: number, index: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Card background (will be tinted per cost)
    const card = this.scene.add.rectangle(0, 0, width, height, 0x1a1a28, 1);
    card.setOrigin(0, 0);
    card.setStrokeStyle(2, 0x333355, 0.8);
    card.setName('card');
    container.add(card);

    // Cost badge (top-left corner)
    const costBadge = this.scene.add.rectangle(0, 0, 24, 18, 0x888888, 1);
    costBadge.setOrigin(0, 0);
    costBadge.setName('costBadge');
    container.add(costBadge);

    const costText = this.scene.add.text(12, 9, '', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    costText.setOrigin(0.5, 0.5);
    costText.setName('costText');
    container.add(costText);

    // Champion portrait (small icon)
    const portrait = this.scene.add.sprite(26, 32, 'champion_default');
    portrait.setScale(1.2);
    portrait.setName('portrait');
    portrait.setVisible(false);
    container.add(portrait);

    // Name text
    const nameText = this.scene.add.text(44, 20, '', {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      wordWrap: { width: width - 50 },
    });
    nameText.setOrigin(0, 0);
    nameText.setName('nameText');
    container.add(nameText);

    // Traits text (colored pills)
    const traitText = this.scene.add.text(44, 36, '', {
      fontSize: '9px',
      color: '#aaaacc',
      fontFamily: 'monospace',
    });
    traitText.setOrigin(0, 0);
    traitText.setName('traitText');
    container.add(traitText);

    // Stats row
    const statsText = this.scene.add.text(8, 54, '', {
      fontSize: '9px',
      color: '#99aabb',
      fontFamily: 'monospace',
      lineSpacing: 2,
    });
    statsText.setOrigin(0, 0);
    statsText.setName('statsText');
    container.add(statsText);

    // Attack type badge (if any)
    const atkBadge = this.scene.add.text(width - 6, 54, '', {
      fontSize: '9px',
      color: '#ffcc44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    atkBadge.setOrigin(1, 0);
    atkBadge.setName('atkBadge');
    container.add(atkBadge);

    // Buy button area at bottom
    const buyBar = this.scene.add.rectangle(0, height - 22, width, 22, 0x224422, 0.8);
    buyBar.setOrigin(0, 0);
    buyBar.setName('buyBar');
    container.add(buyBar);

    const buyText = this.scene.add.text(width / 2, height - 11, 'BUY', {
      fontSize: '12px',
      color: '#66ff66',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    buyText.setOrigin(0.5, 0.5);
    buyText.setName('buyText');
    container.add(buyText);

    // Make the whole card clickable
    card.setInteractive({ useHandCursor: true });
    card.on('pointerdown', () => {
      const gameScene = this.scene.scene.get('GameScene') as GameScene;
      if (gameScene.phase !== 'shopping') return;
      gameScene.shopManager.buyChampion(index);
    });
    card.on('pointerover', () => {
      const currentFill = (card.getData('hoverFill') as number) || 0x2a2a4e;
      card.setFillStyle(currentFill, 1);
    });
    card.on('pointerout', () => {
      const currentFill = (card.getData('baseFill') as number) || 0x1a1a28;
      card.setFillStyle(currentFill, 1);
    });

    return container;
  }

  private createActionButton(x: number, y: number, w: number, h: number, label: string, costLabel: string, colorDark: number, colorLight: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.rectangle(0, 0, w, h, colorDark, 1);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(1, colorLight, 0.6);
    container.add(bg);

    const text = this.scene.add.text(w / 2, h / 2 - 6, label, {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      align: 'center',
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    const cost = this.scene.add.text(w / 2, h / 2 + 8, costLabel, {
      fontSize: '10px',
      color: '#ffd700',
      fontFamily: 'monospace',
      align: 'center',
    });
    cost.setOrigin(0.5, 0.5);
    container.add(cost);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(colorLight, 1));
    bg.on('pointerout', () => bg.setFillStyle(colorDark, 1));

    return container;
  }

  private createStartButton(x: number, y: number, w: number, h: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.rectangle(0, 0, w, h, 0x1a6b30, 1);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, 0x44dd66, 0.6);
    container.add(bg);

    // Arrow icon (simple triangle)
    const arrow = this.scene.add.triangle(w / 2, h / 2 - 8, 0, -8, 0, 8, 12, 0, 0x44ff66, 1);
    container.add(arrow);

    const text = this.scene.add.text(w / 2, h / 2 + 14, 'START', {
      fontSize: '12px',
      color: '#44ff66',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0x27ae60, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x1a6b30, 1));

    return container;
  }

  setupEvents(gameScene: GameScene): void {
    // Buy XP click
    const buyXpBg = this.buyXpButton.list[0] as Phaser.GameObjects.Rectangle;
    buyXpBg.on('pointerdown', () => {
      if (gameScene.phase !== 'shopping') return;
      gameScene.buyXp();
    });

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

      const card = container.getByName('card') as Phaser.GameObjects.Rectangle;
      const costBadge = container.getByName('costBadge') as Phaser.GameObjects.Rectangle;
      const costText = container.getByName('costText') as Phaser.GameObjects.Text;
      const portrait = container.getByName('portrait') as Phaser.GameObjects.Sprite;
      const nameText = container.getByName('nameText') as Phaser.GameObjects.Text;
      const traitText = container.getByName('traitText') as Phaser.GameObjects.Text;
      const statsText = container.getByName('statsText') as Phaser.GameObjects.Text;
      const atkBadge = container.getByName('atkBadge') as Phaser.GameObjects.Text;
      const buyBar = container.getByName('buyBar') as Phaser.GameObjects.Rectangle;
      const buyText = container.getByName('buyText') as Phaser.GameObjects.Text;

      if (slot && slot.available) {
        const d = slot.championData;
        const tierColor = COST_COLORS[d.cost] || 0x888888;
        const bgColor = COST_BG[d.cost] || 0x1a1a28;

        // Card styling based on cost tier
        card.setFillStyle(bgColor, 1);
        card.setStrokeStyle(2, tierColor, 0.7);
        card.setData('baseFill', bgColor);
        card.setData('hoverFill', Phaser.Display.Color.ValueToColor(bgColor).lighten(15).color);

        // Cost badge
        costBadge.setFillStyle(tierColor, 1);
        costBadge.setVisible(true);
        costText.setText(`${d.cost}`);

        // Portrait
        portrait.setTexture(d.textureKey);
        portrait.setVisible(true);

        // Name
        nameText.setText(d.name);
        nameText.setColor('#ffffff');

        // Traits with colored text
        const traitStr = d.traits.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' / ');
        traitText.setText(traitStr);

        // Stats
        const dmgStr = `DMG ${d.stats.damage}`;
        const rngStr = `RNG ${d.stats.range}`;
        const spdStr = `SPD ${d.stats.attackSpeed.toFixed(1)}`;
        statsText.setText(`${dmgStr}  ${rngStr}\n${spdStr}`);

        // Attack type badge
        const atk = attackLabel(d.attackType);
        atkBadge.setText(atk);
        atkBadge.setVisible(!!atk);

        // Buy bar
        buyBar.setFillStyle(0x224422, 0.8);
        buyBar.setVisible(true);
        buyText.setText(`BUY  ${d.cost}g`);
        buyText.setColor('#66ff66');
      } else {
        // Sold / empty slot
        card.setFillStyle(0x111118, 0.6);
        card.setStrokeStyle(1, 0x222233, 0.4);
        card.setData('baseFill', 0x111118);
        card.setData('hoverFill', 0x111118);
        costBadge.setVisible(false);
        costText.setText('');
        portrait.setVisible(false);
        nameText.setText('SOLD');
        nameText.setColor('#444455');
        traitText.setText('');
        statsText.setText('');
        atkBadge.setVisible(false);
        buyBar.setVisible(false);
        buyText.setText('');
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
