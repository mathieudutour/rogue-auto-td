import Phaser from 'phaser';
import { COLORS, MAX_LEVEL } from '../utils/constants';

export class HUD {
  private scene: Phaser.Scene;
  private goldText: Phaser.GameObjects.Text;
  private livesText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private boardLimitText: Phaser.GameObjects.Text;
  private streakText: Phaser.GameObjects.Text;
  private incomePopup: Phaser.GameObjects.Text;
  private incomeTimer: Phaser.Time.TimerEvent | null = null;

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

    this.streakText = scene.add.text(120, 8, '', { ...style, color: '#ff9944', fontSize: '13px' });
    this.streakText.setScrollFactor(0).setDepth(1001);

    this.livesText = scene.add.text(200, 8, '', { ...style, color: '#ff6666' });
    this.livesText.setScrollFactor(0).setDepth(1001);

    this.waveText = scene.add.text(340, 8, '', style);
    this.waveText.setScrollFactor(0).setDepth(1001);

    this.levelText = scene.add.text(480, 8, '', { ...style, color: '#88ccff' });
    this.levelText.setScrollFactor(0).setDepth(1001);

    this.boardLimitText = scene.add.text(640, 8, '', { ...style, color: '#cccccc', fontSize: '13px' });
    this.boardLimitText.setScrollFactor(0).setDepth(1001);

    this.phaseText = scene.add.text(scene.scale.width - 12, 8, '', { ...style, color: '#88ff88' });
    this.phaseText.setOrigin(1, 0).setScrollFactor(0).setDepth(1001);

    // Income popup (shown briefly when gold is awarded)
    this.incomePopup = scene.add.text(12, 32, '', {
      fontSize: '12px',
      color: '#ffd700',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.incomePopup.setScrollFactor(0).setDepth(1001);
    this.incomePopup.setVisible(false);
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

  updateLevel(level: number, xp: number, xpNeeded: number, maxBoard: number): void {
    if (level >= MAX_LEVEL) {
      this.levelText.setText(`Lv ${level} (MAX)`);
    } else {
      this.levelText.setText(`Lv ${level} (${xp}/${xpNeeded} XP)`);
    }
  }

  updateBoardCount(placed: number, max: number): void {
    this.boardLimitText.setText(`Board: ${placed}/${max}`);
    this.boardLimitText.setColor(placed >= max ? '#ff6666' : '#cccccc');
  }

  updateStreak(streak: number): void {
    if (streak > 0) {
      this.streakText.setText(`W${streak}`);
      this.streakText.setColor('#ff9944');
    } else {
      this.streakText.setText('');
    }
  }

  showIncomeBreakdown(income: { base: number; interest: number; streak: number; total: number }): void {
    const parts = [`+${income.base} base`];
    if (income.interest > 0) parts.push(`+${income.interest} interest`);
    if (income.streak > 0) parts.push(`+${income.streak} streak`);
    this.incomePopup.setText(parts.join('  ') + `  = +${income.total}g`);
    this.incomePopup.setVisible(true);

    if (this.incomeTimer) this.incomeTimer.destroy();
    this.incomeTimer = this.scene.time.delayedCall(3000, () => {
      this.incomePopup.setVisible(false);
    });
  }
}
