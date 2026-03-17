import Phaser from 'phaser';
import { Champion } from '../entities/Champion';
import { COLORS, TRAIT_COLORS } from '../utils/constants';
import { GameScene } from '../scenes/GameScene';
import { getHeldItemName, getHeldItemColor, getHeldItemDescription, MAX_ITEMS_PER_CHAMPION } from '../data/items';
import { getLayout } from '../utils/responsive';

const PANEL_W = 220;
const PANEL_H = 200;

export class ChampionTooltip {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private champion: Champion | null = null;

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
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1100);
    this.container.setVisible(false);

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#ffffff',
    };

    // Background
    this.bg = scene.add.rectangle(0, 0, PANEL_W, PANEL_H, 0x111133, 0.95);
    this.bg.setOrigin(0, 0);
    this.container.add(this.bg);

    this.border = scene.add.rectangle(0, 0, PANEL_W, PANEL_H);
    this.border.setOrigin(0, 0);
    this.border.setStrokeStyle(2, 0x4444aa, 1);
    this.border.setFillStyle(0x000000, 0);
    this.container.add(this.border);

    // Portrait
    this.portrait = scene.add.sprite(24, 28, 'champion_default');
    this.portrait.setScale(1.6);
    this.container.add(this.portrait);

    // Name
    this.nameText = scene.add.text(46, 10, '', { ...style, fontSize: '15px', fontStyle: 'bold', color: '#ffffff' });
    this.container.add(this.nameText);

    // Stars
    this.starText = scene.add.text(46, 30, '', { ...style, fontSize: '14px', color: '#ffd700' });
    this.container.add(this.starText);

    // Cost
    this.costText = scene.add.text(PANEL_W - 10, 10, '', { ...style, fontSize: '14px', color: '#ffd700' });
    this.costText.setOrigin(1, 0);
    this.container.add(this.costText);

    // Divider line
    const divider = scene.add.rectangle(10, 48, PANEL_W - 20, 1, 0x4444aa, 0.6);
    divider.setOrigin(0, 0);
    this.container.add(divider);

    // Traits
    this.traitsText = scene.add.text(10, 56, '', { ...style, fontSize: '12px', color: '#aaaacc' });
    this.container.add(this.traitsText);

    // Base stats
    this.baseStatsText = scene.add.text(10, 78, '', { ...style, fontSize: '12px', color: '#cccccc' });
    this.container.add(this.baseStatsText);

    // Synergy bonus stats
    this.bonusStatsText = scene.add.text(10, 120, '', { ...style, fontSize: '11px', color: '#88ff88' });
    this.container.add(this.bonusStatsText);

    // Items container (dynamically populated)
    this.itemsContainer = scene.add.container(10, 160);
    this.container.add(this.itemsContainer);

    // Sell button
    this.sellButton = this.createSellButton();
    this.container.add(this.sellButton);
  }

  private createSellButton(): Phaser.GameObjects.Container {
    const btnW = 70;
    const btnH = 26;
    const container = this.scene.add.container(PANEL_W - btnW - 10, PANEL_H - btnH - 8);

    const bg = this.scene.add.rectangle(0, 0, btnW, btnH, 0xaa3333, 1);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(1, 0xff4444, 0.5);
    container.add(bg);

    const text = this.scene.add.text(btnW / 2, btnH / 2, 'SELL', {
      fontSize: '12px',
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

    // Base stats (no health)
    this.baseStatsText.setText(
      `DMG: ${champion.baseDamage}    Range: ${champion.baseRange}\n` +
      `ATK Spd: ${champion.baseAttackSpeed.toFixed(2)}`
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

    if (bonuses.length > 0) {
      this.bonusStatsText.setText('Synergy bonuses:\n' + bonuses.join('\n'));
      this.bonusStatsText.setVisible(true);
    } else {
      this.bonusStatsText.setVisible(false);
    }

    // Items display
    this.itemsContainer.removeAll(true);
    let itemsY = bonuses.length > 0 ? 125 + bonuses.length * 12 : 110;
    this.itemsContainer.setPosition(10, itemsY);

    const hasItems = champion.items.length > 0;
    if (hasItems) {
      const itemLabel = this.scene.add.text(0, 0, `Items (${champion.items.length}/${MAX_ITEMS_PER_CHAMPION}):`, {
        fontSize: '10px', color: '#ccaa44', fontFamily: 'monospace', fontStyle: 'bold',
      });
      this.itemsContainer.add(itemLabel);

      for (let i = 0; i < champion.items.length; i++) {
        const item = champion.items[i];
        const name = getHeldItemName(item);
        const itemText = this.scene.add.text(0, 14 + i * 12, `  ${name}`, {
          fontSize: '9px', color: '#dddddd', fontFamily: 'monospace',
        });
        this.itemsContainer.add(itemText);
      }
    }

    const itemsHeight = hasItems ? 14 + champion.items.length * 12 + 4 : 0;

    // Sell button
    const gameScene = this.scene.scene.get('GameScene') as GameScene;
    const isShopping = gameScene.phase === 'shopping';
    const canSell = isShopping || !champion.placed;
    this.sellButton.setVisible(canSell);
    const sellText = this.sellButton.getByName('sellText') as Phaser.GameObjects.Text;
    sellText.setText(`SELL ${champion.getSellPrice()}g`);

    // Resize panel based on content
    let neededH = itemsY + itemsHeight;
    if (canSell) neededH += 36;
    neededH = Math.max(neededH, 120);
    this.bg.setSize(PANEL_W, neededH);
    this.border.setSize(PANEL_W, neededH);
    this.sellButton.setPosition(PANEL_W - 80, neededH - 34);

    // Position: prefer right side of champion, avoid edges
    const layout = getLayout(this.scene.scale.width, this.scene.scale.height);
    const margin = layout.isMobile ? 10 : 20;
    let x = screenX + margin;
    let y = screenY - neededH / 2;
    if (x + PANEL_W > this.scene.scale.width) x = screenX - PANEL_W - margin;
    if (x < 4) x = 4;
    const topBound = layout.hudHeight + 4;
    if (y < topBound) y = topBound;
    if (y + neededH > this.scene.scale.height - layout.shopPanelHeight - 40) {
      y = this.scene.scale.height - layout.shopPanelHeight - 40 - neededH;
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
