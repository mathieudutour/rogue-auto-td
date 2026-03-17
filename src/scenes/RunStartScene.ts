/**
 * Run start scene: pick a blessing (1 of 3) and optionally toggle curses.
 * Then launches the actual game.
 */

import Phaser from 'phaser';
import { MetaProgressionManager } from '../systems/MetaProgressionManager';
import { BLESSINGS, CURSES, Blessing, Curse, RunConfig } from '../data/meta';
import { getLayout } from '../utils/responsive';

export class RunStartScene extends Phaser.Scene {
  private meta!: MetaProgressionManager;
  private selectedBlessing: Blessing | null = null;
  private activeCurses: Set<string> = new Set();
  private blessingChoices: Blessing[] = [];
  private blessingCards: Phaser.GameObjects.Container[] = [];
  private curseToggles: Phaser.GameObjects.Container[] = [];
  private multiplierText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'RunStartScene' });
  }

  init(data: { meta: MetaProgressionManager }): void {
    this.meta = data.meta;
    this.selectedBlessing = null;
    this.activeCurses.clear();
  }

  create(): void {
    const layout = getLayout(this.scale.width, this.scale.height);
    const w = layout.width;
    const h = layout.height;
    const m = layout.isMobile;

    this.add.rectangle(0, 0, w, h, 0x0a0a1a).setOrigin(0, 0);

    // ── Blessings Section ──────────────────────────

    this.add.text(w / 2, m ? 16 : 25, 'CHOOSE A BLESSING', {
      fontSize: `${m ? 18 : 26}px`,
      color: '#88ff88',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Roll 3 random blessings (weighted: 60% common, 30% rare, 10% epic)
    this.blessingChoices = this.rollBlessings(3);
    const cardW = Math.min((w - 60) / 3, m ? 150 : 200);
    const cardH = m ? 100 : 140;
    const cardY = m ? 50 : 70;
    const totalCardW = cardW * 3 + 20;
    const cardStartX = (w - totalCardW) / 2;

    this.blessingCards = [];
    for (let i = 0; i < 3; i++) {
      const blessing = this.blessingChoices[i];
      const x = cardStartX + i * (cardW + 10);
      const container = this.add.container(x, cardY);

      const rarityColor = blessing.rarity === 'epic' ? 0x9944ff :
                           blessing.rarity === 'rare' ? 0x4488ff : 0x44aa44;
      const bg = this.add.rectangle(0, 0, cardW, cardH, 0x151530, 0.95);
      bg.setOrigin(0, 0);
      bg.setStrokeStyle(2, rarityColor, 0.8);
      bg.setName('bg');
      container.add(bg);

      // Rarity label
      this.add.text(cardW / 2, 8, blessing.rarity.toUpperCase(), {
        fontSize: `${m ? 8 : 10}px`,
        color: `#${rarityColor.toString(16).padStart(6, '0')}`,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0).setName(`rarity_${i}`);
      container.add(container.last!);

      // Name
      const nameText = this.add.text(cardW / 2, m ? 24 : 30, blessing.name, {
        fontSize: `${m ? 11 : 14}px`,
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        wordWrap: { width: cardW - 16 },
        align: 'center',
      }).setOrigin(0.5, 0);
      container.add(nameText);

      // Description
      const descText = this.add.text(cardW / 2, m ? 44 : 55, blessing.description, {
        fontSize: `${m ? 9 : 11}px`,
        color: '#aaccaa',
        fontFamily: 'monospace',
        wordWrap: { width: cardW - 16 },
        align: 'center',
      }).setOrigin(0.5, 0);
      container.add(descText);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.selectBlessing(i));
      bg.on('pointerover', () => {
        if (this.selectedBlessing !== blessing) {
          bg.setFillStyle(0x1a2040, 1);
        }
      });
      bg.on('pointerout', () => {
        if (this.selectedBlessing !== blessing) {
          bg.setFillStyle(0x151530, 0.95);
        }
      });

      this.blessingCards.push(container);
    }

    // ── Curses Section ─────────────────────────────

    const curseY = cardY + cardH + (m ? 20 : 35);
    this.add.text(w / 2, curseY, 'CURSES (optional — earn more souls)', {
      fontSize: `${m ? 12 : 16}px`,
      color: '#ff6666',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    const curseRowH = m ? 32 : 40;
    const curseW = Math.min(w - 40, 500);
    const curseX = (w - curseW) / 2;
    const curseStartY = curseY + (m ? 22 : 30);

    this.curseToggles = [];
    for (let i = 0; i < CURSES.length; i++) {
      const curse = CURSES[i];
      const y = curseStartY + i * curseRowH;
      const container = this.add.container(curseX, y);

      const bg = this.add.rectangle(0, 0, curseW, curseRowH - 3, 0x201010, 0.9);
      bg.setOrigin(0, 0);
      bg.setStrokeStyle(1, 0x553333, 0.6);
      bg.setName('bg');
      container.add(bg);

      // Toggle box
      const box = this.add.rectangle(8, (curseRowH - 3) / 2, m ? 14 : 18, m ? 14 : 18, 0x331111);
      box.setOrigin(0, 0.5);
      box.setStrokeStyle(1, 0x664444, 0.8);
      box.setName('box');
      container.add(box);

      // Name & desc
      const text = this.add.text(m ? 28 : 34, (curseRowH - 3) / 2, `${curse.name}: ${curse.description}`, {
        fontSize: `${m ? 9 : 12}px`,
        color: '#cc8888',
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5);
      container.add(text);

      // Multiplier
      const multText = this.add.text(curseW - 8, (curseRowH - 3) / 2,
        `+${Math.round((curse.soulMultiplier - 1) * 100)}% souls`, {
        fontSize: `${m ? 8 : 10}px`,
        color: '#ffaa44',
        fontFamily: 'monospace',
      }).setOrigin(1, 0.5);
      container.add(multText);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.toggleCurse(i));

      this.curseToggles.push(container);
    }

    // Soul multiplier display
    const multY = curseStartY + CURSES.length * curseRowH + (m ? 8 : 12);
    this.multiplierText = this.add.text(w / 2, multY, '', {
      fontSize: `${m ? 11 : 14}px`,
      color: '#ffcc44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Begin Run button
    const beginY = multY + (m ? 30 : 45);
    const beginW = m ? 160 : 220;
    const beginH = m ? 40 : 50;
    const beginBtn = this.add.rectangle(w / 2, beginY, beginW, beginH, 0x224488, 0.95);
    beginBtn.setStrokeStyle(2, 0x4488ff, 0.8);
    beginBtn.setInteractive({ useHandCursor: true });

    this.add.text(w / 2, beginY, 'BEGIN RUN', {
      fontSize: `${m ? 16 : 22}px`,
      color: '#88ccff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    beginBtn.on('pointerdown', () => this.startRun());
    beginBtn.on('pointerover', () => beginBtn.setFillStyle(0x3366aa, 1));
    beginBtn.on('pointerout', () => beginBtn.setFillStyle(0x224488, 0.95));

    // Skip blessing button
    const skipY = beginY + beginH / 2 + (m ? 14 : 20);
    const skipText = this.add.text(w / 2, skipY, 'Skip (no blessing)', {
      fontSize: `${m ? 10 : 12}px`,
      color: '#556677',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
    skipText.setInteractive({ useHandCursor: true });
    skipText.on('pointerdown', () => {
      this.selectedBlessing = null;
      this.startRun();
    });

    this.updateMultiplier();
  }

  private rollBlessings(count: number): Blessing[] {
    const pool = [...BLESSINGS];
    // Weighted shuffle: assign random weight with rarity bias
    const weighted = pool.map(b => ({
      blessing: b,
      weight: Math.random() * (b.rarity === 'common' ? 3 : b.rarity === 'rare' ? 1.5 : 0.5),
    }));
    weighted.sort((a, b) => b.weight - a.weight);

    // Ensure variety: at least one non-common if possible
    const result: Blessing[] = [];
    const used = new Set<string>();

    for (const w of weighted) {
      if (result.length >= count) break;
      if (!used.has(w.blessing.id)) {
        result.push(w.blessing);
        used.add(w.blessing.id);
      }
    }
    return result;
  }

  private selectBlessing(index: number): void {
    this.selectedBlessing = this.blessingChoices[index];

    // Update card visuals
    for (let i = 0; i < this.blessingCards.length; i++) {
      const container = this.blessingCards[i];
      const bg = container.getByName('bg') as Phaser.GameObjects.Rectangle;
      if (i === index) {
        bg.setFillStyle(0x224422, 1);
        bg.setStrokeStyle(3, 0x88ff88, 1);
      } else {
        bg.setFillStyle(0x151530, 0.6);
        const blessing = this.blessingChoices[i];
        const rarityColor = blessing.rarity === 'epic' ? 0x9944ff :
                             blessing.rarity === 'rare' ? 0x4488ff : 0x44aa44;
        bg.setStrokeStyle(1, rarityColor, 0.4);
      }
    }
  }

  private toggleCurse(index: number): void {
    const curse = CURSES[index];
    if (this.activeCurses.has(curse.id)) {
      this.activeCurses.delete(curse.id);
    } else {
      this.activeCurses.add(curse.id);
    }

    // Update toggle visuals
    const container = this.curseToggles[index];
    const box = container.getByName('box') as Phaser.GameObjects.Rectangle;
    const active = this.activeCurses.has(curse.id);
    box.setFillStyle(active ? 0xcc3333 : 0x331111);
    const bg = container.getByName('bg') as Phaser.GameObjects.Rectangle;
    bg.setStrokeStyle(1, active ? 0xcc4444 : 0x553333, active ? 0.9 : 0.6);

    this.updateMultiplier();
  }

  private updateMultiplier(): void {
    const curses = CURSES.filter(c => this.activeCurses.has(c.id));
    const mult = curses.reduce((m, c) => m * c.soulMultiplier, 1);
    if (mult > 1) {
      this.multiplierText.setText(`Soul multiplier: x${mult.toFixed(2)}`);
    } else {
      this.multiplierText.setText('');
    }
  }

  private startRun(): void {
    const curses = CURSES.filter(c => this.activeCurses.has(c.id));
    const config: RunConfig = {
      blessing: this.selectedBlessing,
      curses,
    };

    this.scene.start('GameScene', { meta: this.meta, runConfig: config });
  }
}
