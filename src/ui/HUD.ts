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
    const w = scene.scale.width;

    // Top bar background
    const bg = scene.add.rectangle(0, 0, w, 40, 0x0a0e1a, 0.92);
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0);
    bg.setDepth(1000);

    // Bottom accent line
    const line = scene.add.rectangle(0, 40, w, 1, 0x334466, 0.6);
    line.setOrigin(0, 0);
    line.setScrollFactor(0);
    line.setDepth(1000);

    const baseStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    };

    // Gold — left side with icon
    this.goldText = scene.add.text(14, 12, '', {
      ...baseStyle, fontSize: '15px', color: '#ffd700', fontStyle: 'bold',
    });
    this.goldText.setScrollFactor(0).setDepth(1001);

    // Win streak indicator
    this.streakText = scene.add.text(120, 14, '', {
      ...baseStyle, fontSize: '12px', color: '#ff9944',
    });
    this.streakText.setScrollFactor(0).setDepth(1001);

    // Lives with heart-like color
    this.livesText = scene.add.text(190, 12, '', {
      ...baseStyle, color: '#ff6666',
    });
    this.livesText.setScrollFactor(0).setDepth(1001);

    // Wave counter — center
    this.waveText = scene.add.text(w / 2, 12, '', {
      ...baseStyle, fontSize: '15px', fontStyle: 'bold',
    });
    this.waveText.setOrigin(0.5, 0).setScrollFactor(0).setDepth(1001);

    // Level / XP
    this.levelText = scene.add.text(w / 2 + 100, 12, '', {
      ...baseStyle, color: '#88bbee',
    });
    this.levelText.setScrollFactor(0).setDepth(1001);

    // Board count
    this.boardLimitText = scene.add.text(w / 2 + 250, 12, '', {
      ...baseStyle, color: '#aabbcc', fontSize: '12px',
    });
    this.boardLimitText.setScrollFactor(0).setDepth(1001);

    // Phase indicator — right side
    this.phaseText = scene.add.text(w - 14, 12, '', {
      ...baseStyle, color: '#88ff88', fontStyle: 'bold',
    });
    this.phaseText.setOrigin(1, 0).setScrollFactor(0).setDepth(1001);

    // Income popup
    this.incomePopup = scene.add.text(14, 36, '', {
      fontSize: '11px',
      color: '#ffd700',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.incomePopup.setScrollFactor(0).setDepth(1001);
    this.incomePopup.setVisible(false);
  }

  updateGold(gold: number): void {
    this.goldText.setText(`${gold}g`);
  }

  updateLives(lives: number): void {
    this.livesText.setText(`${lives} HP`);
  }

  updateWave(wave: number): void {
    this.waveText.setText(`Wave ${wave}`);
  }

  updatePhase(phase: string): void {
    this.phaseText.setText(phase === 'shopping' ? 'SHOP' : 'COMBAT');
    this.phaseText.setColor(phase === 'shopping' ? '#88ff88' : '#ff8888');
  }

  updateLevel(level: number, xp: number, xpNeeded: number, maxBoard: number): void {
    if (level >= MAX_LEVEL) {
      this.levelText.setText(`Lv${level} MAX`);
    } else {
      this.levelText.setText(`Lv${level} ${xp}/${xpNeeded}xp`);
    }
  }

  updateBoardCount(placed: number, max: number): void {
    this.boardLimitText.setText(`${placed}/${max}`);
    this.boardLimitText.setColor(placed >= max ? '#ff6666' : '#aabbcc');
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
    const parts = [`+${income.base}`];
    if (income.interest > 0) parts.push(`+${income.interest} int`);
    if (income.streak > 0) parts.push(`+${income.streak} streak`);
    this.incomePopup.setText(parts.join(' ') + ` = +${income.total}g`);
    this.incomePopup.setVisible(true);

    if (this.incomeTimer) this.incomeTimer.destroy();
    this.incomeTimer = this.scene.time.delayedCall(3000, () => {
      this.incomePopup.setVisible(false);
    });
  }
}
