import Phaser from 'phaser';
import { COLORS } from '../utils/constants';

/**
 * BootScene: generates all placeholder textures programmatically.
 * No external assets needed.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.generateChampionTextures();
    this.generateEnemyTextures();
    this.generateProjectileTexture();
    this.generateUITextures();

    this.scene.start('GameScene');
  }

  private generateChampionTextures(): void {
    // Generate a colored circle for each champion type
    const champions = [
      // Cost 1
      { key: 'champion_fire_warrior', color: 0xff4444, letter: 'W' },
      { key: 'champion_ice_ranger', color: 0x44aaff, letter: 'R' },
      { key: 'champion_nature_warrior', color: 0x44ff44, letter: 'W' },
      { key: 'champion_arcane_guardian', color: 0xffaa22, letter: 'G' },
      { key: 'champion_shadow_ranger', color: 0xbb66ff, letter: 'R' },
      // Cost 2
      { key: 'champion_fire_mage', color: 0xff6644, letter: 'M' },
      { key: 'champion_ice_mage', color: 0x4488ff, letter: 'M' },
      { key: 'champion_nature_ranger', color: 0x44cc44, letter: 'R' },
      { key: 'champion_arcane_mage', color: 0xddaa00, letter: 'M' },
      { key: 'champion_fire_guardian', color: 0xff6633, letter: 'G' },
      // Cost 3
      { key: 'champion_shadow_assassin', color: 0x9944ff, letter: 'A' },
      { key: 'champion_shadow_mage', color: 0x7744dd, letter: 'M' },
      { key: 'champion_arcane_warrior', color: 0xcc8800, letter: 'W' },
      { key: 'champion_nature_guardian', color: 0x33bb33, letter: 'G' },
      { key: 'champion_ice_assassin', color: 0x44ccff, letter: 'A' },
      // Cost 4
      { key: 'champion_fire_assassin', color: 0xff4488, letter: 'A' },
      { key: 'champion_ice_warrior', color: 0x44ddff, letter: 'W' },
      { key: 'champion_nature_assassin', color: 0x22dd22, letter: 'A' },
      { key: 'champion_arcane_ranger', color: 0xeeaa44, letter: 'R' },
      // Cost 5 (legendary — diamond shape)
      { key: 'champion_fire_legendary', color: 0xff2200, letter: 'L' },
      { key: 'champion_shadow_legendary', color: 0x6622cc, letter: 'L' },
      { key: 'champion_ice_legendary', color: 0x2266ff, letter: 'L' },
      { key: 'champion_nature_legendary', color: 0x118811, letter: 'L' },
    ];

    for (const champ of champions) {
      const g = this.make.graphics({ x: 0, y: 0 });
      // Body circle
      g.fillStyle(champ.color, 1);
      g.fillCircle(16, 16, 14);
      // Dark outline
      g.lineStyle(2, 0x000000, 0.5);
      g.strokeCircle(16, 16, 14);
      g.generateTexture(champ.key, 32, 32);
      g.destroy();
    }

    // Generic champion placeholder
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(16, 16, 14);
    g.lineStyle(2, 0x000000, 0.5);
    g.strokeCircle(16, 16, 14);
    g.generateTexture('champion_default', 32, 32);
    g.destroy();
  }

  private generateEnemyTextures(): void {
    const enemies = [
      { key: 'enemy_basic', color: COLORS.enemyBasic },
      { key: 'enemy_fast', color: COLORS.enemyFast },
      { key: 'enemy_tank', color: COLORS.enemyTank },
      { key: 'enemy_boss', color: COLORS.enemyBoss },
    ];

    for (const enemy of enemies) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(enemy.color, 1);
      g.fillRect(4, 4, 20, 20);
      g.lineStyle(2, 0x000000, 0.5);
      g.strokeRect(4, 4, 20, 20);
      g.generateTexture(enemy.key, 28, 28);
      g.destroy();
    }
  }

  private generateProjectileTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffff00, 1);
    g.fillCircle(4, 4, 3);
    g.generateTexture('projectile', 8, 8);
    g.destroy();

    // Range indicator (semi-transparent circle)
    const r = this.make.graphics({ x: 0, y: 0 });
    r.fillStyle(0xffffff, 0.1);
    r.fillCircle(64, 64, 64);
    r.lineStyle(1, 0xffffff, 0.3);
    r.strokeCircle(64, 64, 64);
    r.generateTexture('range_indicator', 128, 128);
    r.destroy();
  }

  private generateUITextures(): void {
    // Star icon
    const s = this.make.graphics({ x: 0, y: 0 });
    s.fillStyle(COLORS.gold, 1);
    // Simple star shape
    const cx = 8, cy = 8, r1 = 8, r2 = 3;
    const starPoints: number[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 2) * -1 + (Math.PI / 5) * i;
      const radius = i % 2 === 0 ? r1 : r2;
      starPoints.push(cx + Math.cos(angle) * radius);
      starPoints.push(cy + Math.sin(angle) * radius);
    }
    s.fillPoints(starPoints.map((v, i) => new Phaser.Geom.Point(
      i % 2 === 0 ? v : starPoints[i],
      i % 2 === 1 ? v : starPoints[i]
    )));
    // Simple fallback: just a yellow circle for star
    s.fillStyle(COLORS.gold, 1);
    s.fillCircle(8, 8, 6);
    s.generateTexture('star_icon', 16, 16);
    s.destroy();

    // Gold coin icon
    const gc = this.make.graphics({ x: 0, y: 0 });
    gc.fillStyle(COLORS.gold, 1);
    gc.fillCircle(8, 8, 7);
    gc.lineStyle(1, 0xc49000, 1);
    gc.strokeCircle(8, 8, 7);
    gc.generateTexture('gold_icon', 16, 16);
    gc.destroy();
  }
}
