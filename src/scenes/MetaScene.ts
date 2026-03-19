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
    const m = layout.isMobile;

    // Background (must be added before content so it's behind)
    const bgH = m ? Math.max(h, 850) : h;
    this.add.rectangle(0, 0, w, bgH, 0x0a0a1a).setOrigin(0, 0);

    // Scrollable content container
    const content = this.add.container(0, 0);

    // Title
    const titleText = this.add.text(w / 2, m ? 28 : 30, 'THE SOUL FORGE', {
      fontSize: `${m ? 28 : 32}px`,
      color: '#cc88ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    content.add(titleText);

    // Flavor text
    const flavor = this.add.text(w / 2, m ? 58 : 62, 'Temper your power between rifts', {
      fontSize: `${m ? 12 : 12}px`,
      color: '#776699',
      fontFamily: 'monospace',
      fontStyle: 'italic',
    }).setOrigin(0.5, 0);
    content.add(flavor);

    // Souls display
    this.soulsText = this.add.text(w / 2, m ? 74 : 80, '', {
      fontSize: `${m ? 22 : 22}px`,
      color: '#ffcc44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    content.add(this.soulsText);

    // Stats
    this.statsText = this.add.text(w / 2, m ? 102 : 108, '', {
      fontSize: `${m ? 13 : 13}px`,
      color: '#667788',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
    content.add(this.statsText);

    // Upgrades list
    const startY = m ? 130 : 140;
    const rowH = m ? 62 : 56;
    const panelW = Math.min(w - 20, 600);
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
      const icon = this.add.text(10, (rowH - 4) / 2, upgrade.icon, {
        fontSize: `${m ? 20 : 20}px`,
        color: '#cc88ff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      container.add(icon);

      // Name + level dots on same line
      const name = this.add.text(m ? 36 : 40, 8, upgrade.name, {
        fontSize: `${m ? 15 : 14}px`,
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      });
      container.add(name);

      // Level dots — right of name
      const dotsText = this.add.text(m ? 36 : 40, m ? 28 : 26, '', {
        fontSize: `${m ? 12 : 11}px`,
        color: '#ffcc44',
        fontFamily: 'monospace',
      });
      dotsText.setName('dots');
      container.add(dotsText);

      // Description
      const desc = this.add.text(m ? 36 : 40, m ? 42 : 42, '', {
        fontSize: `${m ? 12 : 11}px`,
        color: '#88aacc',
        fontFamily: 'monospace',
      });
      desc.setName('desc');
      container.add(desc);

      // Buy button — right side
      const btnW = m ? 70 : 75;
      const btnH = m ? 32 : 28;
      const btnX = panelW - btnW - 8;
      const btnY = (rowH - 4) / 2 - btnH / 2;

      const btnBg = this.add.rectangle(btnX, btnY, btnW, btnH, 0x335533, 0.9);
      btnBg.setOrigin(0, 0);
      btnBg.setStrokeStyle(1, 0x55aa55, 0.8);
      btnBg.setName('btnBg');
      container.add(btnBg);

      const btnText = this.add.text(btnX + btnW / 2, btnY + btnH / 2, '', {
        fontSize: `${m ? 12 : 11}px`,
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

      content.add(container);
      this.upgradeRows.push(container);
    }

    // Start Run button
    const startBtnY = startY + META_UPGRADES.length * rowH + (m ? 14 : 20);
    const startBtnW = m ? 220 : 220;
    const startBtnH = m ? 52 : 50;
    const startBtn = this.add.rectangle(w / 2, startBtnY, startBtnW, startBtnH, 0x224488, 0.95);
    startBtn.setStrokeStyle(2, 0x4488ff, 0.8);
    startBtn.setInteractive({ useHandCursor: true });
    content.add(startBtn);

    const startText = this.add.text(w / 2, startBtnY, 'START RUN', {
      fontSize: `${m ? 22 : 22}px`,
      color: '#88ccff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    content.add(startText);

    startBtn.on('pointerdown', () => {
      this.scene.start('RunStartScene', { meta: this.meta });
    });

    startBtn.on('pointerover', () => startBtn.setFillStyle(0x3366aa, 1));
    startBtn.on('pointerout', () => startBtn.setFillStyle(0x224488, 0.95));

    // Mobile scroll support
    if (m) {
      const totalContentH = startBtnY + startBtnH / 2 + 30;
      if (totalContentH > h) {
        let dragStartY = 0;
        let contentStartY = 0;
        const maxScroll = -(totalContentH - h + 20);

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          dragStartY = pointer.y;
          contentStartY = content.y;
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
          if (pointer.isDown) {
            const dy = pointer.y - dragStartY;
            content.y = Phaser.Math.Clamp(contentStartY + dy, maxScroll, 0);
          }
        });
      }
    }

    this.refreshUI();
  }

  private refreshUI(): void {
    this.soulsText.setText(`Souls: ${this.meta.getSouls()}`);
    this.statsText.setText(`Runs: ${this.meta.getTotalRuns()}  |  Best Wave: ${this.meta.getBestWave()}`);

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
