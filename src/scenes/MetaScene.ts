/**
 * Meta progression hub scene — shown between runs.
 * Players spend souls on permanent upgrades and start new runs.
 */

import Phaser from 'phaser';
import { MetaProgressionManager } from '../systems/MetaProgressionManager';
import { META_UPGRADES, getUpgradeValue } from '../data/meta';
import { getLayout } from '../utils/responsive';

export class MetaScene extends Phaser.Scene {
  private meta!: MetaProgressionManager;
  private soulsText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private upgradeRows: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'MetaScene' });
  }

  init(data: { meta: MetaProgressionManager }): void {
    this.meta = data.meta;
  }

  create(): void {
    const layout = getLayout(this.scale.width, this.scale.height);
    const w = layout.width;
    const h = layout.height;
    const isMobile = layout.isMobile;

    // Background
    this.add.rectangle(0, 0, w, h, 0x0a0a1a).setOrigin(0, 0);

    // Title
    this.add.text(w / 2, isMobile ? 20 : 30, 'SOUL FORGE', {
      fontSize: `${isMobile ? 22 : 32}px`,
      color: '#cc88ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Souls display
    this.soulsText = this.add.text(w / 2, isMobile ? 50 : 70, '', {
      fontSize: `${isMobile ? 16 : 22}px`,
      color: '#ffcc44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Stats
    this.statsText = this.add.text(w / 2, isMobile ? 72 : 98, '', {
      fontSize: `${isMobile ? 10 : 13}px`,
      color: '#667788',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    // Upgrades list
    const startY = isMobile ? 100 : 135;
    const rowH = isMobile ? 46 : 56;
    const panelW = Math.min(w - 40, 600);
    const panelX = (w - panelW) / 2;

    this.upgradeRows = [];
    for (let i = 0; i < META_UPGRADES.length; i++) {
      const upgrade = META_UPGRADES[i];
      const y = startY + i * rowH;

      const container = this.add.container(panelX, y);

      // Row background
      const bg = this.add.rectangle(0, 0, panelW, rowH - 4, 0x151530, 0.9);
      bg.setOrigin(0, 0);
      bg.setStrokeStyle(1, 0x334466, 0.5);
      container.add(bg);

      // Icon
      const icon = this.add.text(8, (rowH - 4) / 2, upgrade.icon, {
        fontSize: `${isMobile ? 16 : 20}px`,
        color: '#cc88ff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      container.add(icon);

      // Name
      const name = this.add.text(isMobile ? 30 : 40, 6, upgrade.name, {
        fontSize: `${isMobile ? 11 : 14}px`,
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      });
      container.add(name);

      // Description (updated dynamically)
      const desc = this.add.text(isMobile ? 30 : 40, isMobile ? 22 : 26, '', {
        fontSize: `${isMobile ? 9 : 11}px`,
        color: '#88aacc',
        fontFamily: 'monospace',
      });
      desc.setName('desc');
      container.add(desc);

      // Level dots
      const dotsText = this.add.text(panelW - (isMobile ? 70 : 90), 6, '', {
        fontSize: `${isMobile ? 9 : 11}px`,
        color: '#ffcc44',
        fontFamily: 'monospace',
      });
      dotsText.setName('dots');
      container.add(dotsText);

      // Buy button
      const btnW = isMobile ? 60 : 75;
      const btnH = isMobile ? 22 : 28;
      const btnX = panelW - btnW - 6;
      const btnY = (rowH - 4) / 2 - btnH / 2 + 4;

      const btnBg = this.add.rectangle(btnX, btnY, btnW, btnH, 0x335533, 0.9);
      btnBg.setOrigin(0, 0);
      btnBg.setStrokeStyle(1, 0x55aa55, 0.8);
      btnBg.setName('btnBg');
      container.add(btnBg);

      const btnText = this.add.text(btnX + btnW / 2, btnY + btnH / 2, '', {
        fontSize: `${isMobile ? 9 : 11}px`,
        color: '#88ff88',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);
      btnText.setName('btnText');
      container.add(btnText);

      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerdown', () => {
        if (this.meta.buyUpgrade(upgrade.id)) {
          this.refreshUI();
        }
      });

      this.upgradeRows.push(container);
    }

    // Start Run button
    const startBtnY = startY + META_UPGRADES.length * rowH + (isMobile ? 10 : 20);
    const startBtnW = isMobile ? 160 : 220;
    const startBtnH = isMobile ? 40 : 50;
    const startBtn = this.add.rectangle(w / 2, startBtnY, startBtnW, startBtnH, 0x224488, 0.95);
    startBtn.setStrokeStyle(2, 0x4488ff, 0.8);
    startBtn.setInteractive({ useHandCursor: true });

    this.add.text(w / 2, startBtnY, 'START RUN', {
      fontSize: `${isMobile ? 16 : 22}px`,
      color: '#88ccff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    startBtn.on('pointerdown', () => {
      this.scene.start('RunStartScene', { meta: this.meta });
    });

    startBtn.on('pointerover', () => startBtn.setFillStyle(0x3366aa, 1));
    startBtn.on('pointerout', () => startBtn.setFillStyle(0x224488, 0.95));

    this.refreshUI();
  }

  private refreshUI(): void {
    this.soulsText.setText(`Souls: ${this.meta.getSouls()}`);
    this.statsText.setText(`Runs: ${this.meta.getTotalRuns()}  |  Best Wave: ${this.meta.getBestWave()}`);

    const isMobile = getLayout(this.scale.width, this.scale.height).isMobile;

    for (let i = 0; i < META_UPGRADES.length; i++) {
      const upgrade = META_UPGRADES[i];
      const container = this.upgradeRows[i];
      const level = this.meta.getUpgradeLevel(upgrade.id);
      const maxed = level >= upgrade.maxLevel;

      // Description
      const desc = container.getByName('desc') as Phaser.GameObjects.Text;
      if (level > 0) {
        const val = getUpgradeValue(upgrade.id, level);
        desc.setText(upgrade.description.replace('{value}', String(val)));
        desc.setColor('#88aacc');
      } else {
        const nextVal = getUpgradeValue(upgrade.id, 1);
        desc.setText(upgrade.description.replace('{value}', String(nextVal)));
        desc.setColor('#556677');
      }

      // Level dots
      const dots = container.getByName('dots') as Phaser.GameObjects.Text;
      const filled = '\u25C9'.repeat(level);
      const empty = '\u25CB'.repeat(upgrade.maxLevel - level);
      dots.setText(filled + empty);

      // Buy button
      const btnBg = container.getByName('btnBg') as Phaser.GameObjects.Rectangle;
      const btnText = container.getByName('btnText') as Phaser.GameObjects.Text;
      if (maxed) {
        btnText.setText('MAX');
        btnText.setColor('#888888');
        btnBg.setFillStyle(0x222222, 0.6);
        btnBg.setStrokeStyle(1, 0x444444, 0.5);
        btnBg.disableInteractive();
      } else {
        const cost = this.meta.getNextCost(upgrade.id);
        const canAfford = this.meta.getSouls() >= cost;
        btnText.setText(`${cost} souls`);
        btnText.setColor(canAfford ? '#88ff88' : '#ff6666');
        btnBg.setFillStyle(canAfford ? 0x335533 : 0x332222, 0.9);
        btnBg.setStrokeStyle(1, canAfford ? 0x55aa55 : 0x993333, 0.8);
        btnBg.setInteractive({ useHandCursor: true });
      }
    }
  }
}
