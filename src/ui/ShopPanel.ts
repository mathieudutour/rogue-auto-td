import Phaser from 'phaser';
import { REROLL_COST, BUY_XP_COST, MAX_LEVEL } from '../utils/constants';
import { ShopSlot } from '../systems/ShopManager';
import { GameScene } from '../scenes/GameScene';
import { getLayout, LayoutMetrics } from '../utils/responsive';

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


export class ShopPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private startButton!: Phaser.GameObjects.Container;
  private rerollButton!: Phaser.GameObjects.Container;
  private buyXpButton!: Phaser.GameObjects.Container;
  private visible: boolean = true;
  private layout: LayoutMetrics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.layout = getLayout(scene.scale.width, scene.scale.height);
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    this.createPanel();
  }

  private createPanel(): void {
    const w = this.layout.width;
    const h = this.layout.height;
    const m = this.layout;
    const panelH = m.shopPanelHeight;
    const panelY = h - panelH;

    // Background
    const bgOuter = this.scene.add.rectangle(0, panelY, w, panelH, 0x0a0e1a, 0.95);
    bgOuter.setOrigin(0, 0);
    this.container.add(bgOuter);

    // Top accent line
    const accent = this.scene.add.rectangle(0, panelY, w, 2, 0x334466, 1);
    accent.setOrigin(0, 0);
    this.container.add(accent);

    const slotWidth = m.shopCardWidth;
    const slotHeight = m.shopCardHeight;
    const slotGap = m.shopCardGap;
    const totalSlotsWidth = 5 * slotWidth + 4 * slotGap;

    if (m.isMobile) {
      // Mobile layout: buttons in a row above cards, cards fill width
      const btnY = panelY + 4;
      const btnW = m.shopButtonWidth;
      const btnH = m.shopButtonHeight;
      const btnGap = 4;

      // Buttons row: [BUY XP] [REROLL] ... [START] right-aligned
      this.buyXpButton = this.createActionButton(
        4, btnY, btnW, btnH - 4,
        'XP', `${BUY_XP_COST}g`,
        0x6b2fa0, 0x8e44ad,
      );
      this.container.add(this.buyXpButton);

      this.rerollButton = this.createActionButton(
        4 + btnW + btnGap, btnY, btnW, btnH - 4,
        'ROLL', `${REROLL_COST}g`,
        0x1a6b9b, 0x2980b9,
      );
      this.container.add(this.rerollButton);

      this.startButton = this.createStartButton(
        w - btnW - 4, btnY, btnW, btnH - 4,
      );
      this.container.add(this.startButton);

      // Cards row below buttons
      const cardsY = btnY + btnH + 2;
      const availW = w - 8;
      const cardW = Math.floor((availW - 4 * slotGap) / 5);
      const startX = 4;

      for (let i = 0; i < 5; i++) {
        const slotX = startX + i * (cardW + slotGap);
        const cardH = panelH - (btnH + 8);
        const slotContainer = this.createSlotContainer(slotX, cardsY, cardW, cardH, i);
        this.slotContainers.push(slotContainer);
        this.container.add(slotContainer);
      }
    } else {
      // Desktop layout: buttons left/right of cards
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
        'BUY XP', `${BUY_XP_COST}g`,
        0x6b2fa0, 0x8e44ad,
      );
      this.container.add(this.buyXpButton);

      this.rerollButton = this.createActionButton(
        btnAreaX, panelY + 68, 90, 42,
        'REROLL', `${REROLL_COST}g`,
        0x1a6b9b, 0x2980b9,
      );
      this.container.add(this.rerollButton);

      // Start wave button — right side
      this.startButton = this.createStartButton(
        startX + totalSlotsWidth + 14, panelY + 30, 90, 68,
      );
      this.container.add(this.startButton);
    }
  }

  private createSlotContainer(x: number, y: number, width: number, height: number, index: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const m = this.layout;

    // Card background — full card is the portrait area
    const card = this.scene.add.rectangle(0, 0, width, height, 0x1a1a28, 1);
    card.setOrigin(0, 0);
    card.setStrokeStyle(m.isMobile ? 1 : 2, 0x333355, 0.8);
    card.setName('card');
    container.add(card);

    // Champion portrait — centered and scaled to fill the card
    const portrait = this.scene.add.sprite(width / 2, height * 0.4, 'champion_default');
    const portraitScale = m.isMobile ? Math.min(width / 28, height / 36) * 0.7 : Math.min(width / 28, height / 36) * 0.8;
    portrait.setScale(portraitScale);
    portrait.setName('portrait');
    portrait.setVisible(false);
    container.add(portrait);

    // Cost badge (top-left corner, on top of portrait)
    const badgeSize = m.isMobile ? 16 : 20;
    const costBadge = this.scene.add.rectangle(0, 0, badgeSize, badgeSize, 0x888888, 1);
    costBadge.setOrigin(0, 0);
    costBadge.setName('costBadge');
    container.add(costBadge);

    const costText = this.scene.add.text(badgeSize / 2, badgeSize / 2, '', {
      fontSize: `${m.isMobile ? 10 : 12}px`,
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    costText.setOrigin(0.5, 0.5);
    costText.setName('costText');
    container.add(costText);

    // Name banner at bottom — dark overlay strip
    const bannerH = m.isMobile ? 26 : 32;
    const banner = this.scene.add.rectangle(0, height - bannerH, width, bannerH, 0x000000, 0.7);
    banner.setOrigin(0, 0);
    banner.setName('banner');
    container.add(banner);

    // Name text — centered in banner
    const nameText = this.scene.add.text(width / 2, height - bannerH + (m.isMobile ? 5 : 6), '', {
      fontSize: `${m.isMobile ? 10 : 11}px`,
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      align: 'center',
    });
    nameText.setOrigin(0.5, 0);
    nameText.setName('nameText');
    container.add(nameText);

    // Traits text — below name in the banner
    const traitText = this.scene.add.text(width / 2, height - bannerH + (m.isMobile ? 16 : 19), '', {
      fontSize: `${m.isMobile ? 8 : 9}px`,
      color: '#aaaacc',
      fontFamily: 'monospace',
      align: 'center',
    });
    traitText.setOrigin(0.5, 0);
    traitText.setName('traitText');
    container.add(traitText);

    // Owned indicator (top-right) — shows how many copies you have
    const ownedText = this.scene.add.text(width - 3, 2, '', {
      fontSize: `${m.isMobile ? 9 : 10}px`,
      color: '#44ff88',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    ownedText.setOrigin(1, 0);
    ownedText.setName('ownedText');
    container.add(ownedText);

    // Make the whole card clickable
    card.setInteractive({ useHandCursor: true });
    card.on('pointerdown', () => {
      const gameScene = this.scene.scene.get('GameScene') as GameScene;
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
    const fs = this.layout.shopFontSize;

    const bg = this.scene.add.rectangle(0, 0, w, h, colorDark, 1);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(1, colorLight, 0.6);
    container.add(bg);

    if (this.layout.isMobile) {
      // Single line on mobile: "XP 4g"
      const text = this.scene.add.text(w / 2, h / 2, `${label} ${costLabel}`, {
        fontSize: `${fs}px`,
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        align: 'center',
      });
      text.setOrigin(0.5, 0.5);
      container.add(text);
    } else {
      const text = this.scene.add.text(w / 2, h / 2 - 6, label, {
        fontSize: `${fs}px`,
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        align: 'center',
      });
      text.setOrigin(0.5, 0.5);
      container.add(text);

      const cost = this.scene.add.text(w / 2, h / 2 + 8, costLabel, {
        fontSize: `${Math.max(fs - 1, 8)}px`,
        color: '#ffd700',
        fontFamily: 'monospace',
        align: 'center',
      });
      cost.setOrigin(0.5, 0.5);
      container.add(cost);
    }

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(colorLight, 1));
    bg.on('pointerout', () => bg.setFillStyle(colorDark, 1));

    return container;
  }

  private createStartButton(x: number, y: number, w: number, h: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const m = this.layout;

    const bg = this.scene.add.rectangle(0, 0, w, h, 0x1a6b30, 1);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, 0x44dd66, 0.6);
    container.add(bg);

    if (m.isMobile) {
      // Just a play triangle on mobile
      const arrow = this.scene.add.triangle(w / 2, h / 2, 0, -8, 0, 8, 12, 0, 0x44ff66, 1);
      container.add(arrow);
    } else {
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
    }

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0x27ae60, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x1a6b30, 1));

    return container;
  }

  setupEvents(gameScene: GameScene): void {
    // Buy XP click
    const buyXpBg = this.buyXpButton.list[0] as Phaser.GameObjects.Rectangle;
    buyXpBg.on('pointerdown', () => {
      gameScene.buyXp();
    });

    // Reroll click
    const rerollBg = this.rerollButton.list[0] as Phaser.GameObjects.Rectangle;
    rerollBg.on('pointerdown', () => {
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
    const m = this.layout;

    // Count owned copies of each champion (board + bench)
    const ownedCounts = new Map<string, number>();
    const gameScene = this.scene.scene.get('GameScene') as GameScene;
    if (gameScene) {
      for (const champ of gameScene.champions) {
        const id = champ.championId;
        ownedCounts.set(id, (ownedCounts.get(id) || 0) + 1);
      }
      for (const champ of gameScene.bench) {
        if (champ) {
          const id = champ.championId;
          ownedCounts.set(id, (ownedCounts.get(id) || 0) + 1);
        }
      }
    }

    for (let i = 0; i < this.slotContainers.length; i++) {
      const container = this.slotContainers[i];
      const slot = slots[i];

      const card = container.getByName('card') as Phaser.GameObjects.Rectangle;
      const costBadge = container.getByName('costBadge') as Phaser.GameObjects.Rectangle;
      const costText = container.getByName('costText') as Phaser.GameObjects.Text;
      const portrait = container.getByName('portrait') as Phaser.GameObjects.Sprite;
      const nameText = container.getByName('nameText') as Phaser.GameObjects.Text;
      const traitText = container.getByName('traitText') as Phaser.GameObjects.Text;
      const banner = container.getByName('banner') as Phaser.GameObjects.Rectangle;
      const ownedText = container.getByName('ownedText') as Phaser.GameObjects.Text;

      if (slot && slot.available) {
        const d = slot.championData;
        const tierColor = COST_COLORS[d.cost] || 0x888888;
        const bgColor = COST_BG[d.cost] || 0x1a1a28;
        const owned = ownedCounts.get(d.id) || 0;

        card.setFillStyle(bgColor, 1);
        card.setStrokeStyle(m.isMobile ? 1 : 2, owned > 0 ? 0x44ff88 : tierColor, owned > 0 ? 0.9 : 0.7);
        card.setData('baseFill', bgColor);
        card.setData('hoverFill', Phaser.Display.Color.ValueToColor(bgColor).lighten(15).color);

        costBadge.setFillStyle(tierColor, 1);
        costBadge.setVisible(true);
        costText.setText(`${d.cost}`);

        portrait.setTexture(d.textureKey);
        portrait.setVisible(true);

        nameText.setText(d.name);
        nameText.setColor('#ffffff');

        const traitStr = d.traits.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join('/');
        traitText.setText(traitStr);

        banner.setVisible(true);

        // Show owned count indicator
        if (owned > 0) {
          ownedText.setText('\u2605'.repeat(owned));
          ownedText.setVisible(true);
        } else {
          ownedText.setVisible(false);
        }
      } else {
        card.setFillStyle(0x111118, 0.6);
        card.setStrokeStyle(1, 0x222233, 0.4);
        card.setData('baseFill', 0x111118);
        card.setData('hoverFill', 0x111118);
        costBadge.setVisible(false);
        costText.setText('');
        portrait.setVisible(false);
        nameText.setText(m.isMobile ? '' : 'SOLD');
        nameText.setColor('#444455');
        traitText.setText('');
        banner.setVisible(false);
        ownedText.setVisible(false);
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

  updateLevel(level: number): void {
    this.buyXpButton.setVisible(level < MAX_LEVEL);
  }

  updatePhase(phase: string): void {
    this.startButton.setVisible(phase === 'shopping');
  }
}
