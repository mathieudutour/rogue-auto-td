import Phaser from 'phaser';
import { Champion } from '../entities/Champion';
import { COLORS, TRAIT_COLORS } from '../utils/constants';
import { GameScene } from '../scenes/GameScene';
import { getHeldItemName, getHeldItemColor, getHeldItemDescription, MAX_ITEMS_PER_CHAMPION } from '../data/items';
import { getLayout, getDpr } from '../utils/responsive';

export class ChampionTooltip {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private champion: Champion | null = null;
  private panelW: number;
  private panelH: number;
  private dpr: number;

  // Elements
  private bg: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private portrait: Phaser.GameObjects.Sprite;
  private nameText: Phaser.GameObjects.Text;
  private starText: Phaser.GameObjects.Text;
  private costText: Phaser.GameObjects.Text;
  private traitsText: Phaser.GameObjects.Text;
  private baseStatsText: Phaser.GameObjects.Text;
  private bonusStatsText: Phaser.GameObjects.Text;
  private itemsContainer: Phaser.GameObjects.Container;
  private sellButton: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.dpr = getDpr();
    const d = this.dpr;
    const s = (v: number) => Math.round(v * d);
    this.panelW = s(220);
    this.panelH = s(200);
    const PW = this.panelW;
    const PH = this.panelH;

    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1100);
    this.container.setVisible(false);

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${s(13)}px`,
      fontFamily: 'monospace',
      color: '#ffffff',
    };

    // Background
    this.bg = scene.add.rectangle(0, 0, PW, PH, 0x111133, 0.95);
    this.bg.setOrigin(0, 0);
    this.container.add(this.bg);

    this.border = scene.add.rectangle(0, 0, PW, PH);
    this.border.setOrigin(0, 0);
    this.border.setStrokeStyle(s(2), 0x4444aa, 1);
    this.border.setFillStyle(0x000000, 0);
    this.container.add(this.border);

    // Portrait
    this.portrait = scene.add.sprite(s(24), s(28), 'champion_default');
    this.portrait.setScale(1.6 * d);
    this.container.add(this.portrait);

    // Name
    this.nameText = scene.add.text(s(46), s(10), '', { ...style, fontSize: `${s(15)}px`, fontStyle: 'bold', color: '#ffffff' });
    this.container.add(this.nameText);

    // Stars
    this.starText = scene.add.text(s(46), s(30), '', { ...style, fontSize: `${s(14)}px`, color: '#ffd700' });
    this.container.add(this.starText);

    // Cost
    this.costText = scene.add.text(PW - s(10), s(10), '', { ...style, fontSize: `${s(14)}px`, color: '#ffd700' });
    this.costText.setOrigin(1, 0);
    this.container.add(this.costText);

    // Divider line
    const divider = scene.add.rectangle(s(10), s(48), PW - s(20), s(1), 0x4444aa, 0.6);
    divider.setOrigin(0, 0);
    this.container.add(divider);

    // Traits
    this.traitsText = scene.add.text(s(10), s(56), '', { ...style, fontSize: `${s(12)}px`, color: '#aaaacc' });
    this.container.add(this.traitsText);

    // Base stats
    this.baseStatsText = scene.add.text(s(10), s(78), '', { ...style, fontSize: `${s(12)}px`, color: '#cccccc' });
    this.container.add(this.baseStatsText);

    // Synergy bonus stats
    this.bonusStatsText = scene.add.text(s(10), s(120), '', { ...style, fontSize: `${s(11)}px`, color: '#88ff88' });
    this.container.add(this.bonusStatsText);

    // Items container (dynamically populated)
    this.itemsContainer = scene.add.container(s(10), s(160));
    this.container.add(this.itemsContainer);

    // Sell button
    this.sellButton = this.createSellButton();
    this.container.add(this.sellButton);
  }

  private createSellButton(): Phaser.GameObjects.Container {
    const d = this.dpr;
    const s = (v: number) => Math.round(v * d);
    const btnW = s(70);
    const btnH = s(26);
    const container = this.scene.add.container(this.panelW - btnW - s(10), this.panelH - btnH - s(8));

    const bg = this.scene.add.rectangle(0, 0, btnW, btnH, 0xaa3333, 1);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(s(1), 0xff4444, 0.5);
    container.add(bg);

    const text = this.scene.add.text(btnW / 2, btnH / 2, 'SELL', {
      fontSize: `${s(12)}px`,
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5, 0.5);
    text.setName('sellText');
    container.add(text);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setFillStyle(0xcc4444, 1));
    bg.on('pointerout', () => bg.setFillStyle(0xaa3333, 1));
    bg.on('pointerdown', () => {
      if (!this.champion) return;
      const gameScene = this.scene.scene.get('GameScene') as GameScene;
      if (gameScene.phase === 'combat' && this.champion.placed) return;
      gameScene.sellChampion(this.champion);
      this.hide();
    });

    return container;
  }

  show(champion: Champion, screenX: number, screenY: number): void {
    this.champion = champion;

    // Portrait
    this.portrait.setTexture(champion.textureKey);

    // Name and stars
    this.nameText.setText(champion.name);
    this.starText.setText('\u2605'.repeat(champion.starLevel));

    // Cost
    this.costText.setText(`${champion.cost}g`);

    // Traits with colors
    const traitStr = champion.traits.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' / ');
    this.traitsText.setText(traitStr);

    // Base stats
    this.baseStatsText.setText(
      `DMG: ${champion.baseDamage}    Range: ${champion.baseRange}\n` +
      `ATK Spd: ${champion.baseAttackSpeed.toFixed(2)}    Mana: ${champion.manaMax}`
    );

    // Synergy bonuses (show effective stats if different from base)
    const bonuses: string[] = [];
    if (champion.damage !== champion.baseDamage) {
      bonuses.push(`DMG: ${champion.baseDamage} \u2192 ${champion.damage}`);
    }
    if (champion.range !== champion.baseRange) {
      bonuses.push(`Range: ${champion.baseRange} \u2192 ${champion.range}`);
    }
    if (Math.abs(champion.attackSpeed - champion.baseAttackSpeed) > 0.01) {
      bonuses.push(`ATK Spd: ${champion.baseAttackSpeed.toFixed(2)} \u2192 ${champion.attackSpeed.toFixed(2)}`);
    }

    // Show active effects from synergies
    const effects = this.getActiveEffects(champion);
    if (effects.length > 0) {
      bonuses.push('');
      bonuses.push(...effects);
    }

    // Ultimate info
    const ult = champion.ultimate;
    bonuses.push('');
    bonuses.push(`ULT: ${ult.name} (${ult.manaCost} mana)`);
    bonuses.push(`  ${ult.description}`);

    this.bonusStatsText.setText(bonuses.join('\n'));
    this.bonusStatsText.setVisible(true);

    // Items display
    const d = this.dpr;
    const s = (v: number) => Math.round(v * d);
    this.itemsContainer.removeAll(true);
    let itemsY = bonuses.length > 0 ? s(125) + bonuses.length * s(12) : s(110);
    this.itemsContainer.setPosition(s(10), itemsY);

    const hasItems = champion.items.length > 0;
    if (hasItems) {
      const itemLabel = this.scene.add.text(0, 0, `Items (${champion.items.length}/${MAX_ITEMS_PER_CHAMPION}):`, {
        fontSize: `${s(10)}px`, color: '#ccaa44', fontFamily: 'monospace', fontStyle: 'bold',
      });
      this.itemsContainer.add(itemLabel);

      for (let i = 0; i < champion.items.length; i++) {
        const item = champion.items[i];
        const name = getHeldItemName(item);
        const itemText = this.scene.add.text(0, s(14) + i * s(12), `  ${name}`, {
          fontSize: `${s(9)}px`, color: '#dddddd', fontFamily: 'monospace',
        });
        this.itemsContainer.add(itemText);
      }
    }

    const itemsHeight = hasItems ? s(14) + champion.items.length * s(12) + s(4) : 0;

    // Sell button
    const gameScene = this.scene.scene.get('GameScene') as GameScene;
    const isShopping = gameScene.phase === 'shopping';
    const canSell = isShopping || !champion.placed;
    this.sellButton.setVisible(canSell);
    const sellText = this.sellButton.getByName('sellText') as Phaser.GameObjects.Text;
    sellText.setText(`SELL ${champion.getSellPrice()}g`);

    // Resize panel based on content
    let neededH = itemsY + itemsHeight;
    if (canSell) neededH += s(36);
    neededH = Math.max(neededH, s(120));
    this.bg.setSize(this.panelW, neededH);
    this.border.setSize(this.panelW, neededH);
    this.sellButton.setPosition(this.panelW - s(80), neededH - s(34));

    // Position: prefer right side of champion, avoid edges
    const layout = getLayout(this.scene.scale.width, this.scene.scale.height);
    const margin = s(layout.isMobile ? 10 : 20);
    let x = screenX + margin;
    let y = screenY - neededH / 2;
    if (x + this.panelW > this.scene.scale.width) x = screenX - this.panelW - margin;
    if (x < s(4)) x = s(4);
    const topBound = layout.hudHeight + s(4);
    if (y < topBound) y = topBound;
    if (y + neededH > this.scene.scale.height - layout.shopPanelHeight - s(40)) {
      y = this.scene.scale.height - layout.shopPanelHeight - s(40) - neededH;
    }

    this.container.setPosition(x, y);
    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
    this.champion = null;
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  getChampion(): Champion | null {
    return this.champion;
  }

  private getActiveEffects(champion: Champion): string[] {
    const s = champion.synergyBonuses;
    const effects: string[] = [];
    if (s.slowAmount > 0 && s.slowAmount < 1) {
      const pct = Math.round((1 - s.slowAmount) * 100);
      effects.push(`Slow: ${pct}% for ${s.slowDuration.toFixed(1)}s`);
    }
    if (s.burnOnHit > 0) {
      effects.push(`Burn: ${s.burnOnHit} dmg/tick (${s.burnRadius}px)`);
    }
    if (s.splashOnHit) {
      const pct = Math.round(s.splashFrac * 100);
      effects.push(`Splash: ${pct}% dmg (${s.splashRadius}px)`);
    }
    if (s.chainOnHit > 0) {
      effects.push(`Chain: ${s.chainOnHit} bounces`);
    }
    if (s.dotOnHit > 0) {
      const total = Math.round(s.dotOnHit * s.dotDuration * s.dotTickRate);
      effects.push(`Poison: ${total} dmg over ${s.dotDuration}s`);
    }
    if (s.critChance > 0) {
      effects.push(`Crit: ${Math.round(s.critChance * 100)}% (${s.critMult.toFixed(1)}x)`);
    }
    if (s.freezeChance > 0) {
      effects.push(`Freeze: ${Math.round(s.freezeChance * 100)}% for ${s.freezeDuration.toFixed(1)}s`);
    }
    if (s.executeThreshold > 0) {
      effects.push(`Execute below ${Math.round(s.executeThreshold * 100)}% HP`);
    }
    if (s.multishot > 0) {
      effects.push(`Multishot: +${s.multishot} projectiles`);
    }
    if (s.bonusGoldOnKill > 0) {
      effects.push(`+${s.bonusGoldOnKill} gold/kill`);
    }
    return effects;
  }
}
