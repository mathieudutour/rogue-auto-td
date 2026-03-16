import Phaser from 'phaser';
import { Champion } from '../entities/Champion';

export class ChampionTooltip {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private statsText: Phaser.GameObjects.Text;
  private traitsText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1100);
    this.container.setVisible(false);

    this.bg = scene.add.rectangle(0, 0, 160, 80, 0x111133, 0.95);
    this.bg.setOrigin(0, 0);
    this.bg.setStrokeStyle(1, 0x4444aa);
    this.container.add(this.bg);

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#ffffff',
    };

    this.nameText = scene.add.text(8, 6, '', { ...style, fontStyle: 'bold', color: '#ffd700' });
    this.container.add(this.nameText);

    this.traitsText = scene.add.text(8, 22, '', { ...style, fontSize: '9px', color: '#aaaaaa' });
    this.container.add(this.traitsText);

    this.statsText = scene.add.text(8, 38, '', { ...style, fontSize: '10px' });
    this.container.add(this.statsText);
  }

  show(champion: Champion, screenX: number, screenY: number): void {
    const stars = '\u2605'.repeat(champion.starLevel);
    this.nameText.setText(`${champion.name} ${stars}`);
    this.traitsText.setText(champion.traits.join(' / '));
    this.statsText.setText(
      `DMG: ${champion.damage}  RNG: ${champion.range}\n` +
      `SPD: ${champion.attackSpeed.toFixed(1)}  Cost: ${champion.cost}g`
    );

    // Position tooltip avoiding screen edges
    let x = screenX + 16;
    let y = screenY - 40;
    if (x + 160 > this.scene.scale.width) x = screenX - 176;
    if (y < 0) y = screenY + 16;

    this.container.setPosition(x, y);
    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
  }
}
