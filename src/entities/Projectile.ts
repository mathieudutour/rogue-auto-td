import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { GameScene } from '../scenes/GameScene';
import { SynergyBonusState } from './Champion';

const PROJECTILE_SPEED = 300; // pixels per second

export class Projectile {
  private scene: GameScene;
  private sprite: Phaser.GameObjects.Sprite;
  private target: Enemy;
  private damage: number;
  private alive: boolean = true;
  private synergy: SynergyBonusState;

  constructor(
    scene: GameScene,
    x: number,
    y: number,
    target: Enemy,
    damage: number,
    synergy: SynergyBonusState,
  ) {
    this.scene = scene;
    this.target = target;
    this.damage = damage;
    this.synergy = synergy;

    const textureKey = this.getTextureForEffects(synergy);
    this.sprite = scene.add.sprite(x, y, textureKey);
    this.sprite.setDepth(9999);
  }

  private getTextureForEffects(s: SynergyBonusState): string {
    // Pick projectile texture based on the strongest effect
    if (s.chainOnHit > 0) return 'projectile_chain';
    if (s.splashOnHit) return 'projectile_splash';
    if (s.slowAmount > 0 && s.slowAmount < 1) return 'projectile_slow';
    if (s.dotOnHit > 0) return 'projectile_dot';
    if (s.burnOnHit > 0) return 'projectile_dot';
    return 'projectile';
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
    let finalDamage = this.damage;

    // Crit check
    if (this.synergy.critChance > 0 && Math.random() < this.synergy.critChance) {
      finalDamage = Math.round(finalDamage * this.synergy.critMult);
      this.showCritEffect(targetPos);
    }

    // Apply primary damage
    this.target.takeDamage(finalDamage);

    // Slow on hit
    if (this.synergy.slowAmount > 0 && this.synergy.slowAmount < 1) {
      this.target.applySlow(this.synergy.slowAmount, this.synergy.slowDuration);
    }

    // DoT on hit
    if (this.synergy.dotOnHit > 0) {
      this.target.applyDot(this.synergy.dotOnHit, this.synergy.dotDuration, this.synergy.dotTickRate);
    }

    // Splash damage
    if (this.synergy.splashOnHit) {
      this.applySplash(targetPos);
    }

    // Chain lightning
    if (this.synergy.chainOnHit > 0) {
      this.applyChain(this.target);
    }

    // Burn AoE
    if (this.synergy.burnOnHit > 0) {
      this.applyBurnAoE(targetPos);
    }

    // Execute: instantly kill low HP enemies
    if (this.synergy.executeThreshold > 0 && this.target.isAlive()) {
      const hpPercent = this.target.health / this.target.maxHealth;
      if (hpPercent <= this.synergy.executeThreshold) {
        this.target.takeDamage(this.target.health);
        this.showExecuteEffect(targetPos);
      }
    }

    // Freeze chance
    if (this.synergy.freezeChance > 0 && Math.random() < this.synergy.freezeChance) {
      this.target.applySlow(0, this.synergy.freezeDuration);
      this.showFreezeEffect(targetPos);
    }

    // Bonus gold on kill
    if (this.synergy.bonusGoldOnKill > 0 && !this.target.isAlive()) {
      this.scene.economyManager.addGold(this.synergy.bonusGoldOnKill);
      this.scene.events.emit('goldChanged', this.scene.economyManager.getGold());
      this.showGoldEffect(targetPos);
    }
  }

  private applySplash(center: { x: number; y: number }): void {
    const radius = this.synergy.splashRadius;
    const frac = this.synergy.splashFrac;
    const splashDmg = Math.round(this.damage * frac);

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

  private applyBurnAoE(center: { x: number; y: number }): void {
    const radius = this.synergy.burnRadius;
    const burnDmg = this.synergy.burnOnHit;

    this.showBurnEffect(center, radius);

    for (const enemy of this.scene.enemies) {
      if (!enemy.isAlive()) continue;
      const pos = enemy.getPosition();
      const dx = pos.x - center.x;
      const dy = pos.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        enemy.applyDot(burnDmg, 2.0, 2);
      }
    }
  }

  private applyChain(firstTarget: Enemy): void {
    const chainCount = this.synergy.chainOnHit;
    const chainRange = this.synergy.chainRange;
    const chainFrac = this.synergy.chainDamageFrac;

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

      this.showChainEffect(currentTarget.getPosition(), bestEnemy.getPosition());

      bestEnemy.takeDamage(currentDamage);
      hit.add(bestEnemy);
      currentTarget = bestEnemy;
    }
  }

  // ── Visual Effects ────────────────────────────────

  private showSplashEffect(center: { x: number; y: number }, radius: number, color: number = 0xff6600): void {
    const circle = this.scene.add.circle(center.x, center.y, radius, color, 0.25);
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

  private showCritEffect(pos: { x: number; y: number }): void {
    const text = this.scene.add.text(pos.x, pos.y - 10, 'CRIT!', {
      fontSize: '12px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5, 1).setDepth(10000);
    this.scene.tweens.add({
      targets: text,
      y: pos.y - 30,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy(),
    });
  }

  private showExecuteEffect(pos: { x: number; y: number }): void {
    const text = this.scene.add.text(pos.x, pos.y - 10, 'EXECUTE', {
      fontSize: '11px',
      color: '#cc00ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5, 1).setDepth(10000);
    this.scene.tweens.add({
      targets: text,
      y: pos.y - 30,
      alpha: 0,
      duration: 700,
      onComplete: () => text.destroy(),
    });
  }

  private showFreezeEffect(pos: { x: number; y: number }): void {
    const circle = this.scene.add.circle(pos.x, pos.y, 14, 0x66ccff, 0.5);
    circle.setDepth(9998);
    this.scene.tweens.add({
      targets: circle,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 400,
      onComplete: () => circle.destroy(),
    });
  }

  private showBurnEffect(center: { x: number; y: number }, radius: number): void {
    const circle = this.scene.add.circle(center.x, center.y, radius, 0xff4400, 0.2);
    circle.setDepth(9998);
    this.scene.tweens.add({
      targets: circle,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 400,
      onComplete: () => circle.destroy(),
    });
  }

  private showGoldEffect(pos: { x: number; y: number }): void {
    const text = this.scene.add.text(pos.x + 8, pos.y - 5, `+${this.synergy.bonusGoldOnKill}g`, {
      fontSize: '10px',
      color: '#ffd700',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5, 1).setDepth(10000);
    this.scene.tweens.add({
      targets: text,
      y: pos.y - 25,
      alpha: 0,
      duration: 500,
      onComplete: () => text.destroy(),
    });
  }

  destroy(): void {
    this.alive = false;
    this.sprite.destroy();
  }
}
