import Phaser from 'phaser';
import { TRAIT_COLORS } from '../utils/constants';
import { ActiveSynergy } from '../systems/SynergyManager';
import { SynergyData } from '../data/synergies';
import { getLayout } from '../utils/responsive';

export class SynergyBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private entryContainers: Phaser.GameObjects.Container[] = [];
  private isMobile: boolean;
  private fontSize: number;
  private pillWidth: number;
  private spacing: number;

  // Tooltip
  private tooltipContainer: Phaser.GameObjects.Container;
  private tooltipBg: Phaser.GameObjects.Rectangle;
  private tooltipBorder: Phaser.GameObjects.Rectangle;
  private tooltipTexts: Phaser.GameObjects.Text[] = [];
  private pinnedSynergy: SynergyData | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const layout = getLayout(scene.scale.width, scene.scale.height);
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

    this.tooltipBg = scene.add.rectangle(0, 0, 240, 100, 0x111133, 0.95);
    this.tooltipBg.setOrigin(0, 0);
    this.tooltipContainer.add(this.tooltipBg);

    this.tooltipBorder = scene.add.rectangle(0, 0, 240, 100);
    this.tooltipBorder.setOrigin(0, 0);
    this.tooltipBorder.setStrokeStyle(2, 0x4444aa, 1);
    this.tooltipBorder.setFillStyle(0x000000, 0);
    this.tooltipContainer.add(this.tooltipBorder);
  }

  update(synergies: ActiveSynergy[]): void {
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
    // Clear old texts
    for (const t of this.tooltipTexts) t.destroy();
    this.tooltipTexts = [];

    const data = synergy.synergy;
    const color = TRAIT_COLORS[data.id] || 0xcccccc;
    const colorHex = '#' + color.toString(16).padStart(6, '0');

    const padX = 10;
    let cy = 8;

    // Title
    const title = this.scene.add.text(padX, cy, data.name, {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: colorHex,
    });
    this.tooltipContainer.add(title);
    this.tooltipTexts.push(title);
    cy += 18;

    // Description
    const desc = this.scene.add.text(padX, cy, data.description, {
      fontSize: '10px', fontFamily: 'monospace', color: '#aaaacc',
      wordWrap: { width: 220 },
    });
    this.tooltipContainer.add(desc);
    this.tooltipTexts.push(desc);
    cy += desc.height + 8;

    // Tiers
    for (const tier of data.tiers) {
      const isThisActive = synergy.activeTier === tier;
      const hasEnough = synergy.count >= tier.count;

      const tierLabel = this.scene.add.text(padX, cy, `(${tier.count})`, {
        fontSize: '10px', fontFamily: 'monospace',
        color: isThisActive ? '#ffdd44' : hasEnough ? '#88ff88' : '#667788',
        fontStyle: isThisActive ? 'bold' : 'normal',
      });
      this.tooltipContainer.add(tierLabel);
      this.tooltipTexts.push(tierLabel);

      const tierDesc = this.scene.add.text(padX + 28, cy, tier.description, {
        fontSize: '10px', fontFamily: 'monospace',
        color: isThisActive ? '#ffffff' : hasEnough ? '#cccccc' : '#556677',
        wordWrap: { width: 192 },
      });
      this.tooltipContainer.add(tierDesc);
      this.tooltipTexts.push(tierDesc);
      cy += Math.max(tierDesc.height, 14) + 4;
    }

    cy += 4;

    // Resize tooltip
    const tooltipW = 240;
    this.tooltipBg.setSize(tooltipW, cy);
    this.tooltipBorder.setSize(tooltipW, cy);
    this.tooltipBorder.setStrokeStyle(2, color, 0.6);

    // Position tooltip to the right of the synergy bar
    const barX = this.container.x;
    const barY = this.container.y;
    const tooltipX = barX + this.pillWidth + 6;
    let tooltipY = barY + entryY;

    // Ensure it stays on screen
    const maxY = this.scene.scale.height - cy - 10;
    if (tooltipY > maxY) tooltipY = maxY;
    if (tooltipY < 4) tooltipY = 4;

    this.tooltipContainer.setPosition(tooltipX, tooltipY);
    this.tooltipContainer.setVisible(true);
  }
}
