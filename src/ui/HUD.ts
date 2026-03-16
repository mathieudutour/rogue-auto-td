import Phaser from 'phaser';
import { COLORS } from '../utils/constants';

export class HUD {
  private scene: Phaser.Scene;
  private goldText: Phaser.GameObjects.Text;
  private livesText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 3,
    };

    // Top bar background
    const bg = scene.add.rectangle(0, 0, scene.scale.width, 36, COLORS.uiBg, 0.85);
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0);
    bg.setDepth(1000);

    this.goldText = scene.add.text(12, 8, '', { ...style, color: '#ffd700' });
    this.goldText.setScrollFactor(0).setDepth(1001);

    this.livesText = scene.add.text(160, 8, '', { ...style, color: '#ff6666' });
    this.livesText.setScrollFactor(0).setDepth(1001);

    this.waveText = scene.add.text(320, 8, '', style);
    this.waveText.setScrollFactor(0).setDepth(1001);

    this.phaseText = scene.add.text(scene.scale.width - 12, 8, '', { ...style, color: '#88ff88' });
    this.phaseText.setOrigin(1, 0).setScrollFactor(0).setDepth(1001);
  }

  updateGold(gold: number): void {
    this.goldText.setText(`Gold: ${gold}`);
  }

  updateLives(lives: number): void {
    this.livesText.setText(`Lives: ${lives}`);
  }

  updateWave(wave: number): void {
    this.waveText.setText(`Wave: ${wave}`);
  }

  updatePhase(phase: string): void {
    this.phaseText.setText(phase === 'shopping' ? 'SHOP PHASE' : 'COMBAT');
    this.phaseText.setColor(phase === 'shopping' ? '#88ff88' : '#ff8888');
  }
}
