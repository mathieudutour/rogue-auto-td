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

    // Background — oversized to cover scroll (must be before content)
    const bgH = m ? Math.max(h, 900) : h;
    this.add.rectangle(0, 0, w, bgH, 0x0a0a1a).setOrigin(0, 0);

    // Scrollable container for mobile
    const content = this.add.container(0, 0);

    // ── Blessings Section ──────────────────────────

    const titleY = m ? 24 : 25;
    const title = this.add.text(w / 2, titleY, 'ECHOES OF THE SPIRE', {
      fontSize: `${m ? 24 : 26}px`,
      color: '#88ff88',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    content.add(title);

    const subtitle = this.add.text(w / 2, titleY + (m ? 30 : 32), 'Choose a blessing for this rift', {
      fontSize: `${m ? 13 : 12}px`,
      color: '#557755',
      fontFamily: 'monospace',
      fontStyle: 'italic',
    }).setOrigin(0.5, 0);
    content.add(subtitle);

    // Roll 3 random blessings
    this.blessingChoices = this.rollBlessings(3);

    // Mobile: vertical stack; Desktop: horizontal
    const cardW = m ? Math.min(w - 40, 340) : Math.min((w - 60) / 3, 200);
    const cardH = m ? 80 : 140;
    const cardStartY = titleY + (m ? 56 : 50);

    this.blessingCards = [];
    for (let i = 0; i < 3; i++) {
      const blessing = this.blessingChoices[i];

      let x: number, y: number;
      if (m) {
        // Vertical stack centered
        x = (w - cardW) / 2;
        y = cardStartY + i * (cardH + 10);
      } else {
        const totalW = cardW * 3 + 20;
        x = (w - totalW) / 2 + i * (cardW + 10);
        y = cardStartY;
      }

      const container = this.add.container(x, y);

      const rarityColor = blessing.rarity === 'epic' ? 0x9944ff :
                           blessing.rarity === 'rare' ? 0x4488ff : 0x44aa44;
      const bg = this.add.rectangle(0, 0, cardW, cardH, 0x151530, 0.95);
      bg.setOrigin(0, 0);
      bg.setStrokeStyle(2, rarityColor, 0.8);
      bg.setName('bg');
      container.add(bg);

      // Rarity label
      const rarityLabel = this.add.text(m ? 12 : cardW / 2, m ? 8 : 8, blessing.rarity.toUpperCase(), {
        fontSize: `${m ? 11 : 10}px`,
        color: `#${rarityColor.toString(16).padStart(6, '0')}`,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(m ? 0 : 0.5, 0);
      container.add(rarityLabel);

      // Name
      const nameText = this.add.text(m ? 12 : cardW / 2, m ? 26 : 30, blessing.name, {
        fontSize: `${m ? 16 : 14}px`,
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        wordWrap: { width: cardW - 24 },
        align: m ? 'left' : 'center',
      }).setOrigin(m ? 0 : 0.5, 0);
      container.add(nameText);

      // Description
      const descText = this.add.text(m ? 12 : cardW / 2, m ? 50 : 55, blessing.description, {
        fontSize: `${m ? 14 : 11}px`,
        color: '#aaccaa',
        fontFamily: 'monospace',
        wordWrap: { width: cardW - 24 },
        align: m ? 'left' : 'center',
      }).setOrigin(m ? 0 : 0.5, 0);
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

      content.add(container);
      this.blessingCards.push(container);
    }

    // ── Curses Section ─────────────────────────────

    const cardsEndY = m ? cardStartY + 3 * (cardH + 10) : cardStartY + cardH;
    const curseY = cardsEndY + (m ? 10 : 35);
    const curseTitle = this.add.text(w / 2, curseY, m ? 'RIFT SCARS (bonus souls)' : 'RIFT SCARS (embrace the void for more souls)', {
      fontSize: `${m ? 18 : 16}px`,
      color: '#ff6666',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    content.add(curseTitle);

    const curseRowH = m ? 44 : 40;
    const curseW = Math.min(w - 24, 500);
    const curseX = (w - curseW) / 2;
    const curseStartY = curseY + (m ? 32 : 30);

    this.curseToggles = [];
    for (let i = 0; i < CURSES.length; i++) {
      const curse = CURSES[i];
      const y = curseStartY + i * curseRowH;
      const container = this.add.container(curseX, y);

      const bg = this.add.rectangle(0, 0, curseW, curseRowH - 4, 0x201010, 0.9);
      bg.setOrigin(0, 0);
      bg.setStrokeStyle(1, 0x553333, 0.6);
      bg.setName('bg');
      container.add(bg);

      // Toggle box
      const boxSize = m ? 20 : 18;
      const box = this.add.rectangle(10, (curseRowH - 4) / 2, boxSize, boxSize, 0x331111);
      box.setOrigin(0, 0.5);
      box.setStrokeStyle(1, 0x664444, 0.8);
      box.setName('box');
      container.add(box);

      // Name & desc
      const text = this.add.text(m ? 38 : 34, (curseRowH - 4) / 2, `${curse.name}: ${curse.description}`, {
        fontSize: `${m ? 13 : 12}px`,
        color: '#cc8888',
        fontFamily: 'monospace',
        wordWrap: { width: curseW - (m ? 120 : 140) },
      }).setOrigin(0, 0.5);
      container.add(text);

      // Multiplier
      const multText = this.add.text(curseW - 10, (curseRowH - 4) / 2,
        `+${Math.round((curse.soulMultiplier - 1) * 100)}%`, {
        fontSize: `${m ? 14 : 12}px`,
        color: '#ffaa44',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      container.add(multText);

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.toggleCurse(i));

      content.add(container);
      this.curseToggles.push(container);
    }

    // Soul multiplier display
    const multY = curseStartY + CURSES.length * curseRowH + (m ? 8 : 12);
    this.multiplierText = this.add.text(w / 2, multY, '', {
      fontSize: `${m ? 16 : 14}px`,
      color: '#ffcc44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    content.add(this.multiplierText);

    // Begin Run button
    const beginY = multY + (m ? 36 : 45);
    const beginW = m ? 220 : 220;
    const beginH = m ? 52 : 50;
    const beginBtn = this.add.rectangle(w / 2, beginY, beginW, beginH, 0x224488, 0.95);
    beginBtn.setStrokeStyle(2, 0x4488ff, 0.8);
    beginBtn.setInteractive({ useHandCursor: true });
    content.add(beginBtn);

    const beginText = this.add.text(w / 2, beginY, 'BEGIN RUN', {
      fontSize: `${m ? 22 : 22}px`,
      color: '#88ccff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    content.add(beginText);

    beginBtn.on('pointerdown', () => this.startRun());
    beginBtn.on('pointerover', () => beginBtn.setFillStyle(0x3366aa, 1));
    beginBtn.on('pointerout', () => beginBtn.setFillStyle(0x224488, 0.95));

    // Skip blessing button
    const skipY = beginY + beginH / 2 + (m ? 18 : 20);
    const skipText = this.add.text(w / 2, skipY, 'Skip (no blessing)', {
      fontSize: `${m ? 14 : 12}px`,
      color: '#556677',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
    skipText.setInteractive({ useHandCursor: true });
    skipText.on('pointerdown', () => {
      this.selectedBlessing = null;
      this.startRun();
    });
    content.add(skipText);

    // Mobile scroll support — drag to scroll the content container
    if (m) {
      const totalContentH = skipY + 40;
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

    this.updateMultiplier();
  }

  private rollBlessings(count: number): Blessing[] {
    const pool = [...BLESSINGS];
    const weighted = pool.map(b => ({
      blessing: b,
      weight: Math.random() * (b.rarity === 'common' ? 3 : b.rarity === 'rare' ? 1.5 : 0.5),
    }));
    weighted.sort((a, b) => b.weight - a.weight);

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
