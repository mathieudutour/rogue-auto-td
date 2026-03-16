import Phaser from 'phaser';
import { TRAIT_COLORS } from '../utils/constants';
import { ActiveSynergy } from '../systems/SynergyManager';

export class SynergyBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private entryContainers: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(8, 48);
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
      y += 22;
    }
  }

  private createEntry(x: number, y: number, synergy: ActiveSynergy): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const isActive = synergy.activeTier !== null;
    const color = TRAIT_COLORS[synergy.synergy.id] || 0xcccccc;

    // Compact background pill for active synergies
    if (isActive) {
      const pillBg = this.scene.add.rectangle(0, 2, 130, 18, color, 0.12);
      pillBg.setOrigin(0, 0);
      container.add(pillBg);
    }

    // Color dot
    const dot = this.scene.add.circle(8, 11, 4, color, isActive ? 1 : 0.3);
    container.add(dot);

    // Count
    const tierInfo = synergy.activeTier
      ? `${synergy.count}/${synergy.activeTier.count}`
      : synergy.nextTier
        ? `${synergy.count}/${synergy.nextTier.count}`
        : `${synergy.count}`;

    const text = this.scene.add.text(16, 3, `${synergy.synergy.name} ${tierInfo}`, {
      fontSize: '10px',
      color: isActive ? '#ffffff' : '#667788',
      fontFamily: 'monospace',
      fontStyle: isActive ? 'bold' : 'normal',
    });
    container.add(text);

    return container;
  }
}
