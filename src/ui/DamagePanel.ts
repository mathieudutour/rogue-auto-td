import Phaser from 'phaser';
import { Champion } from '../entities/Champion';
import { getLayout } from '../utils/responsive';
import { TRAIT_COLORS } from '../utils/constants';

/** Displays per-champion damage dealt during combat, top-right of screen. */
export class DamagePanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private entries: Phaser.GameObjects.Container[] = [];
  private dpr: number;
  private isMobile: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const layout = getLayout(scene.scale.width, scene.scale.height);
    this.dpr = layout.dpr;
    this.isMobile = layout.isMobile;

    const s = (v: number) => Math.round(v * this.dpr);
    this.container = scene.add.container(
      scene.scale.width - s(this.isMobile ? 110 : 150),
      layout.hudHeight + s(6),
    );
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);
    this.container.setVisible(false);
  }

  update(champions: Champion[]): void {
    // Destroy old entries
    for (const e of this.entries) e.destroy();
    this.entries = [];

    // Collect placed champions with damage, sort by damage desc
    const ranked = champions
      .filter(c => c.placed && c.waveDamage > 0)
      .sort((a, b) => b.waveDamage - a.waveDamage)
      .slice(0, this.isMobile ? 5 : 8);

    if (ranked.length === 0) {
      this.container.setVisible(false);
      return;
    }

    this.container.setVisible(true);
    const s = (v: number) => Math.round(v * this.dpr);
    const rowH = s(this.isMobile ? 16 : 18);
    const barMaxW = s(this.isMobile ? 60 : 80);
    const maxDmg = ranked[0].waveDamage;

    let y = 0;
    for (const champ of ranked) {
      const entry = this.scene.add.container(0, y);

      // Damage bar
      const barW = Math.max(2, (champ.waveDamage / maxDmg) * barMaxW);
      const traitColor = TRAIT_COLORS[champ.traits[0]] || 0x88aacc;
      const bar = this.scene.add.rectangle(0, 0, barW, rowH - s(3), traitColor, 0.35);
      bar.setOrigin(0, 0);
      entry.add(bar);

      // Name + damage text
      const shortName = champ.name.length > (this.isMobile ? 8 : 12)
        ? champ.name.slice(0, this.isMobile ? 7 : 11) + '..'
        : champ.name;
      const dmgStr = champ.waveDamage >= 1000
        ? `${(champ.waveDamage / 1000).toFixed(1)}k`
        : `${champ.waveDamage}`;
      const text = this.scene.add.text(s(3), s(1), `${shortName} ${dmgStr}`, {
        fontSize: `${s(this.isMobile ? 8 : 9)}px`,
        color: '#ccddee',
        fontFamily: 'monospace',
      });
      entry.add(text);

      this.container.add(entry);
      this.entries.push(entry);
      y += rowH;
    }
  }

  show(): void {
    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
    // Clear entries
    for (const e of this.entries) e.destroy();
    this.entries = [];
  }
}
