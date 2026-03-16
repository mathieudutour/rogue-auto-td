import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { GameScene } from '../scenes/GameScene';
import { AttackType, AttackTypeParams } from '../data/champions';

const PROJECTILE_SPEED = 300; // pixels per second

export class Projectile {
  private scene: GameScene;
  private sprite: Phaser.GameObjects.Sprite;
  private target: Enemy;
  private damage: number;
  private alive: boolean = true;
  private attackType: AttackType;
  private params: AttackTypeParams;

  constructor(
    scene: GameScene,
    x: number,
    y: number,
    target: Enemy,
    damage: number,
    attackType: AttackType = 'normal',
    params: AttackTypeParams = {},
  ) {
    this.scene = scene;
    this.target = target;
    this.damage = damage;
    this.attackType = attackType;
    this.params = params;

    const textureKey = this.getTextureForType(attackType);
    this.sprite = scene.add.sprite(x, y, textureKey);
    this.sprite.setDepth(9999);
  }

  private getTextureForType(type: AttackType): string {
    switch (type) {
      case 'splash': return 'projectile_splash';
      case 'slow': return 'projectile_slow';
      case 'chain': return 'projectile_chain';
      case 'dot': return 'projectile_dot';
      default: return 'projectile';
    }
  }

  update(delta: number): boolean {
    if (!this.alive) return false;

    // If target died, remove projectile
    if (!this.target.isAlive()) {
      this.destroy();
      return false;
    }

    const targetPos = this.target.getPosition();
    const dx = targetPos.x - this.sprite.x;
    const dy = targetPos.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      this.onHit();
      this.destroy();
      return false;
    }

    // Move toward target
    const speed = PROJECTILE_SPEED * (delta / 1000);
    this.sprite.x += (dx / dist) * speed;
    this.sprite.y += (dy / dist) * speed;

    return true;
  }

  private onHit(): void {
    const targetPos = this.target.getPosition();

    switch (this.attackType) {
      case 'splash':
        this.target.takeDamage(this.damage);
        this.applySplash(targetPos);
        break;

      case 'slow':
        this.target.takeDamage(this.damage);
        this.target.applySlow(
          this.params.slowAmount ?? 0.5,
          this.params.slowDuration ?? 1.5,
        );
        break;

      case 'chain':
        this.target.takeDamage(this.damage);
        this.applyChain(this.target);
        break;

      case 'dot':
        this.target.takeDamage(this.damage);
        this.target.applyDot(
          this.params.dotDamage ?? 5,
          this.params.dotDuration ?? 3,
          this.params.dotTickRate ?? 2,
        );
        break;

      default:
        this.target.takeDamage(this.damage);
        break;
    }
  }

  private applySplash(center: { x: number; y: number }): void {
    const radius = this.params.splashRadius ?? 50;
    const frac = this.params.splashDamageFrac ?? 0.5;
    const splashDmg = Math.round(this.damage * frac);

    // Show splash visual
    this.showSplashEffect(center, radius);

    for (const enemy of this.scene.enemies) {
      if (!enemy.isAlive() || enemy === this.target) continue;
      const pos = enemy.getPosition();
      const dx = pos.x - center.x;
      const dy = pos.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        enemy.takeDamage(splashDmg);
      }
    }
  }

  private applyChain(firstTarget: Enemy): void {
    const chainCount = this.params.chainCount ?? 3;
    const chainRange = this.params.chainRange ?? 80;
    const chainFrac = this.params.chainDamageFrac ?? 0.7;

    let currentTarget = firstTarget;
    let currentDamage = this.damage;
    const hit = new Set<Enemy>([firstTarget]);

    for (let i = 0; i < chainCount; i++) {
      currentDamage = Math.round(currentDamage * chainFrac);
      if (currentDamage < 1) break;

      const currentPos = currentTarget.getPosition();
      let bestEnemy: Enemy | null = null;
      let bestDist = Infinity;

      for (const enemy of this.scene.enemies) {
        if (!enemy.isAlive() || hit.has(enemy)) continue;
        const pos = enemy.getPosition();
        const dx = pos.x - currentPos.x;
        const dy = pos.y - currentPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= chainRange && dist < bestDist) {
          bestDist = dist;
          bestEnemy = enemy;
        }
      }

      if (!bestEnemy) break;

      // Show chain visual
      this.showChainEffect(currentTarget.getPosition(), bestEnemy.getPosition());

      bestEnemy.takeDamage(currentDamage);
      hit.add(bestEnemy);
      currentTarget = bestEnemy;
    }
  }

  private showSplashEffect(center: { x: number; y: number }, radius: number): void {
    const circle = this.scene.add.circle(center.x, center.y, radius, 0xff6600, 0.25);
    circle.setDepth(9998);
    this.scene.tweens.add({
      targets: circle,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 300,
      onComplete: () => circle.destroy(),
    });
  }

  private showChainEffect(from: { x: number; y: number }, to: { x: number; y: number }): void {
    const line = this.scene.add.graphics();
    line.lineStyle(2, 0x88aaff, 0.8);
    line.lineBetween(from.x, from.y, to.x, to.y);
    line.setDepth(9998);
    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 200,
      onComplete: () => line.destroy(),
    });
  }

  destroy(): void {
    this.alive = false;
    this.sprite.destroy();
  }
}
