import Phaser from 'phaser';
import { TRAIT_COLORS } from '../utils/constants';
import { ActiveSynergy } from '../systems/SynergyManager';
import { getLayout } from '../utils/responsive';

export class SynergyBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private entryContainers: Phaser.GameObjects.Container[] = [];
  private isMobile: boolean;
  private fontSize: number;
  private pillWidth: number;
  private spacing: number;

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
  }

  private createEntry(x: number, y: number, synergy: ActiveSynergy): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const isActive = synergy.activeTier !== null;
    const color = TRAIT_COLORS[synergy.synergy.id] || 0xcccccc;

    if (isActive) {
      const pillBg = this.scene.add.rectangle(0, 1, this.pillWidth, this.spacing - 2, color, 0.12);
      pillBg.setOrigin(0, 0);
      container.add(pillBg);
    }

    const dotR = this.isMobile ? 3 : 4;
    const dot = this.scene.add.circle(dotR + 2, Math.floor(this.spacing / 2), dotR, color, isActive ? 1 : 0.3);
    container.add(dot);

    const tierInfo = synergy.activeTier
      ? `${synergy.count}/${synergy.activeTier.count}`
      : synergy.nextTier
        ? `${synergy.count}/${synergy.nextTier.count}`
        : `${synergy.count}`;

    // On mobile use shorter names
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

    return container;
  }
}
