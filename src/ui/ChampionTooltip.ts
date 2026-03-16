import Phaser from 'phaser';
import { Champion } from '../entities/Champion';
import { COLORS, TRAIT_COLORS } from '../utils/constants';
import { GameScene } from '../scenes/GameScene';

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
    this.bonusStatsText = scene.add.text(10, 130, '', { ...style, fontSize: '11px', color: '#88ff88' });
    this.container.add(this.bonusStatsText);

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
      if (gameScene.phase !== 'shopping') return;
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

    // Attack type label
    const attackTypeLabel = this.getAttackTypeLabel(champion);

    // Base stats
    this.baseStatsText.setText(
      `DMG: ${champion.baseDamage}    Range: ${champion.baseRange}\n` +
      `ATK Spd: ${champion.baseAttackSpeed.toFixed(2)}    HP: ${champion.baseHealth}` +
      (attackTypeLabel ? `\n${attackTypeLabel}` : '')
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
    if (champion.synergyBonuses.armor > 0) {
      bonuses.push(`Armor: +${champion.synergyBonuses.armor}`);
    }
    if (bonuses.length > 0) {
      this.bonusStatsText.setText('Synergy bonuses:\n' + bonuses.join('\n'));
      this.bonusStatsText.setVisible(true);
    } else {
      this.bonusStatsText.setVisible(false);
    }

    // Sell button text with gold value — hide during combat
    const gameScene = this.scene.scene.get('GameScene') as GameScene;
    const isShopping = gameScene.phase === 'shopping';
    this.sellButton.setVisible(isShopping);
    const sellText = this.sellButton.getByName('sellText') as Phaser.GameObjects.Text;
    const sellPrice = champion.cost * Math.pow(3, champion.starLevel - 1);
    sellText.setText(`SELL ${sellPrice}g`);

    // Resize panel based on content
    const neededH = bonuses.length > 0 ? 200 : (isShopping ? 170 : 140);
    this.bg.setSize(PANEL_W, neededH);
    this.border.setSize(PANEL_W, neededH);
    this.sellButton.setPosition(PANEL_W - 80, neededH - 34);

    // Position: prefer right side of champion, avoid edges
    let x = screenX + 20;
    let y = screenY - neededH / 2;
    if (x + PANEL_W > this.scene.scale.width) x = screenX - PANEL_W - 20;
    if (y < 40) y = 40;
    if (y + neededH > this.scene.scale.height - 120) y = this.scene.scale.height - 120 - neededH;

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

  private getAttackTypeLabel(champion: Champion): string {
    const p = champion.attackTypeParams;
    switch (champion.attackType) {
      case 'splash': {
        const pct = Math.round((p.splashDamageFrac ?? 0.5) * 100);
        return `Splash: ${pct}% dmg in ${p.splashRadius ?? 50}px`;
      }
      case 'slow': {
        const pct = Math.round((1 - (p.slowAmount ?? 0.5)) * 100);
        return `Slow: ${pct}% for ${p.slowDuration ?? 1.5}s`;
      }
      case 'chain': {
        return `Chain: ${p.chainCount ?? 3} bounces`;
      }
      case 'dot': {
        const total = Math.round((p.dotDamage ?? 5) * (p.dotDuration ?? 3) * (p.dotTickRate ?? 2));
        return `Poison: ${total} dmg over ${p.dotDuration ?? 3}s`;
      }
      default:
        return '';
    }
  }
}
