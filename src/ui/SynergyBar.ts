import Phaser from 'phaser';
import { COLORS, TRAIT_COLORS } from '../utils/constants';
import { ActiveSynergy } from '../systems/SynergyManager';

export class SynergyBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private entryContainers: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(8, 44);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);
  }

  update(synergies: ActiveSynergy[]): void {
    // Clear old entries
    for (const c of this.entryContainers) {
      c.destroy();
    }
    this.entryContainers = [];

    let y = 0;
    for (const syn of synergies) {
      const entry = this.createEntry(0, y, syn);
      this.container.add(entry);
      this.entryContainers.push(entry);
      y += 24;
    }
  }

  private createEntry(x: number, y: number, synergy: ActiveSynergy): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const isActive = synergy.activeTier !== null;
    const color = TRAIT_COLORS[synergy.synergy.id] || 0xcccccc;

    // Color indicator dot
    const dot = this.scene.add.circle(6, 8, 5, color, isActive ? 1 : 0.3);
    container.add(dot);

    // Synergy name + count
    const tierInfo = synergy.activeTier
      ? `${synergy.count}/${synergy.activeTier.count}`
      : synergy.nextTier
        ? `${synergy.count}/${synergy.nextTier.count}`
        : `${synergy.count}`;

    const text = this.scene.add.text(16, 0, `${synergy.synergy.name} (${tierInfo})`, {
      fontSize: '11px',
      color: isActive ? '#ffffff' : '#888888',
      fontFamily: 'monospace',
    });
    container.add(text);

    // Bonus description
    if (isActive && synergy.activeTier) {
      const bonusText = this.scene.add.text(16, 12, synergy.activeTier.description, {
        fontSize: '9px',
        color: '#aaffaa',
        fontFamily: 'monospace',
      });
      container.add(bonusText);
    }

    return container;
  }
}
