import Phaser from 'phaser';
import { TRAIT_COLORS } from '../utils/constants';
import { ActiveSynergy } from '../systems/SynergyManager';
import { SynergyData } from '../data/synergies';
import { CHAMPIONS, ChampionData } from '../data/champions';
import { Champion } from '../entities/Champion';
import { getLayout, getDpr } from '../utils/responsive';

export class SynergyBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private entryContainers: Phaser.GameObjects.Container[] = [];
  private isMobile: boolean;
  private fontSize: number;
  private pillWidth: number;
  private spacing: number;
  private dpr: number;

  // Tooltip
  private tooltipContainer: Phaser.GameObjects.Container;
  private tooltipBg: Phaser.GameObjects.Rectangle;
  private tooltipBorder: Phaser.GameObjects.Rectangle;
  private tooltipTexts: Phaser.GameObjects.Text[] = [];
  private tooltipSprites: Phaser.GameObjects.Sprite[] = [];
  private pinnedSynergy: SynergyData | null = null;
  private placedChampions: Champion[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const layout = getLayout(scene.scale.width, scene.scale.height);
    this.dpr = layout.dpr;
    this.isMobile = layout.isMobile;
    this.fontSize = layout.synergyFontSize;
    this.pillWidth = layout.synergyPillWidth;
    this.spacing = layout.synergySpacing;

    const topY = layout.hudHeight + 4;
    this.container = scene.add.container(4, topY);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    // Create tooltip container
    this.tooltipContainer = scene.add.container(0, 0);
    this.tooltipContainer.setScrollFactor(0);
    this.tooltipContainer.setDepth(1200);
    this.tooltipContainer.setVisible(false);

    const s = (v: number) => Math.round(v * this.dpr);
    this.tooltipBg = scene.add.rectangle(0, 0, s(240), s(100), 0x111133, 0.95);
    this.tooltipBg.setOrigin(0, 0);
    this.tooltipContainer.add(this.tooltipBg);

    this.tooltipBorder = scene.add.rectangle(0, 0, s(240), s(100));
    this.tooltipBorder.setOrigin(0, 0);
    this.tooltipBorder.setStrokeStyle(s(2), 0x4444aa, 1);
    this.tooltipBorder.setFillStyle(0x000000, 0);
    this.tooltipContainer.add(this.tooltipBorder);
  }

  update(synergies: ActiveSynergy[], champions?: Champion[]): void {
    if (champions) {
      this.placedChampions = champions.filter(c => c.placed);
    }
    for (const c of this.entryContainers) {
      c.destroy();
    }
    this.entryContainers = [];

    let y = 0;
    for (const syn of synergies) {
      const entry = this.createEntry(0, y, syn);
      this.container.add(entry);
      this.entryContainers.push(entry);
      y += this.spacing;
    }

    // If pinned synergy is no longer present, hide tooltip
    if (this.pinnedSynergy) {
      const stillPresent = synergies.some(s => s.synergy.id === this.pinnedSynergy!.id);
      if (!stillPresent) {
        this.pinnedSynergy = null;
        this.tooltipContainer.setVisible(false);
      }
    }
  }

  private createEntry(x: number, y: number, synergy: ActiveSynergy): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const isActive = synergy.activeTier !== null;
    const color = TRAIT_COLORS[synergy.synergy.id] || 0xcccccc;

    // Background pill (also serves as hit area)
    const pillBg = this.scene.add.rectangle(0, 1, this.pillWidth, this.spacing - 2, color, isActive ? 0.12 : 0);
    pillBg.setOrigin(0, 0);
    container.add(pillBg);

    const dotR = this.isMobile ? 3 : 4;
    const dot = this.scene.add.circle(dotR + 2, Math.floor(this.spacing / 2), dotR, color, isActive ? 1 : 0.3);
    container.add(dot);

    const tierInfo = synergy.activeTier
      ? `${synergy.count}/${synergy.activeTier.count}`
      : synergy.nextTier
        ? `${synergy.count}/${synergy.nextTier.count}`
        : `${synergy.count}`;

    const name = this.isMobile
      ? synergy.synergy.name.slice(0, 6)
      : synergy.synergy.name;

    const text = this.scene.add.text(dotR * 2 + 6, 2, `${name} ${tierInfo}`, {
      fontSize: `${this.fontSize}px`,
      color: isActive ? '#ffffff' : '#667788',
      fontFamily: 'monospace',
      fontStyle: isActive ? 'bold' : 'normal',
    });
    container.add(text);

    // Make interactive for tooltip
    pillBg.setInteractive({ useHandCursor: true });
    pillBg.on('pointerover', () => {
      if (!this.pinnedSynergy) {
        this.showTooltip(synergy, y);
      }
    });
    pillBg.on('pointerout', () => {
      if (!this.pinnedSynergy) {
        this.tooltipContainer.setVisible(false);
      }
    });
    pillBg.on('pointerdown', () => {
      if (this.pinnedSynergy === synergy.synergy) {
        // Unpin
        this.pinnedSynergy = null;
        this.tooltipContainer.setVisible(false);
      } else {
        this.pinnedSynergy = synergy.synergy;
        this.showTooltip(synergy, y);
      }
    });

    return container;
  }

  private showTooltip(synergy: ActiveSynergy, entryY: number): void {
    // Clear old texts and sprites
    for (const t of this.tooltipTexts) t.destroy();
    this.tooltipTexts = [];
    for (const sp of this.tooltipSprites) sp.destroy();
    this.tooltipSprites = [];

    const d = this.dpr;
    const s = (v: number) => Math.round(v * d);
    const data = synergy.synergy;
    const color = TRAIT_COLORS[data.id] || 0xcccccc;
    const colorHex = '#' + color.toString(16).padStart(6, '0');

    const padX = s(10);
    let cy = s(8);

    // Title
    const title = this.scene.add.text(padX, cy, data.name, {
      fontSize: `${s(14)}px`, fontFamily: 'monospace', fontStyle: 'bold', color: colorHex,
    });
    this.tooltipContainer.add(title);
    this.tooltipTexts.push(title);
    cy += s(18);

    // Description
    const desc = this.scene.add.text(padX, cy, data.description, {
      fontSize: `${s(10)}px`, fontFamily: 'monospace', color: '#aaaacc',
      wordWrap: { width: s(220) },
    });
    this.tooltipContainer.add(desc);
    this.tooltipTexts.push(desc);
    cy += desc.height + s(8);

    // Tiers
    for (const tier of data.tiers) {
      const isThisActive = synergy.activeTier === tier;
      const hasEnough = synergy.count >= tier.count;

      const tierLabel = this.scene.add.text(padX, cy, `(${tier.count})`, {
        fontSize: `${s(10)}px`, fontFamily: 'monospace',
        color: isThisActive ? '#ffdd44' : hasEnough ? '#88ff88' : '#667788',
        fontStyle: isThisActive ? 'bold' : 'normal',
      });
      this.tooltipContainer.add(tierLabel);
      this.tooltipTexts.push(tierLabel);

      const tierDesc = this.scene.add.text(padX + s(28), cy, tier.description, {
        fontSize: `${s(10)}px`, fontFamily: 'monospace',
        color: isThisActive ? '#ffffff' : hasEnough ? '#cccccc' : '#556677',
        wordWrap: { width: s(192) },
      });
      this.tooltipContainer.add(tierDesc);
      this.tooltipTexts.push(tierDesc);
      cy += Math.max(tierDesc.height, s(14)) + s(4);
    }

    cy += s(4);

    // Champion portraits — show ALL champions with this trait, owned ones bright, unowned dimmed
    const allTraitChamps = CHAMPIONS.filter(c => c.traits.includes(data.id))
      .sort((a, b) => a.cost - b.cost);

    if (allTraitChamps.length > 0) {
      // Build set of owned champion IDs (placed on board)
      const ownedIds = new Set<string>();
      for (const c of this.placedChampions) {
        if (c.traits.includes(data.id)) ownedIds.add(c.championId);
      }

      const iconSize = s(20);
      const iconGap = s(4);
      const tooltipInnerW = s(220);
      let cx = padX;

      for (const champData of allTraitChamps) {
        const owned = ownedIds.has(champData.id);

        // Wrap to next row if needed
        if (cx + iconSize > padX + tooltipInnerW) {
          cx = padX;
          cy += iconSize + s(14);
        }

        const sprite = this.scene.add.sprite(cx + iconSize / 2, cy + iconSize / 2, champData.textureKey);
        sprite.setDisplaySize(iconSize, iconSize);
        if (!owned) {
          sprite.setAlpha(0.3);
          sprite.setTint(0x556677);
        }
        this.tooltipContainer.add(sprite);
        this.tooltipSprites.push(sprite);

        // Cost indicator (small colored dot)
        const costColors = [0xcccccc, 0x44cc44, 0x4488ff, 0xcc44cc, 0xffaa22];
        const costDot = this.scene.add.circle(cx + iconSize - s(2), cy + s(2), s(3), costColors[champData.cost - 1] || 0xcccccc, owned ? 0.9 : 0.3);
        this.tooltipContainer.add(costDot);
        this.tooltipSprites.push(costDot as any);

        // Champion name label below portrait
        const shortName = champData.name.split(' ').pop() || '';
        const nameLabel = this.scene.add.text(cx + iconSize / 2, cy + iconSize + s(1), shortName, {
          fontSize: `${s(7)}px`, fontFamily: 'monospace', color: owned ? '#ccddee' : '#445566',
        });
        nameLabel.setOrigin(0.5, 0);
        this.tooltipContainer.add(nameLabel);
        this.tooltipTexts.push(nameLabel);

        cx += iconSize + iconGap;
      }

      cy += iconSize + s(14);
    }

    cy += s(4);

    // Resize tooltip
    const tooltipW = s(240);
    this.tooltipBg.setSize(tooltipW, cy);
    this.tooltipBorder.setSize(tooltipW, cy);
    this.tooltipBorder.setStrokeStyle(s(2), color, 0.6);

    // Position tooltip to the right of the synergy bar
    const barX = this.container.x;
    const barY = this.container.y;
    const tooltipX = barX + this.pillWidth + s(6);
    let tooltipY = barY + entryY;

    // Ensure it stays on screen
    const maxY = this.scene.scale.height - cy - s(10);
    if (tooltipY > maxY) tooltipY = maxY;
    if (tooltipY < s(4)) tooltipY = s(4);

    this.tooltipContainer.setPosition(tooltipX, tooltipY);
    this.tooltipContainer.setVisible(true);
  }
}
