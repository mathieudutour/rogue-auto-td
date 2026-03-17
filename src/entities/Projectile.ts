import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { GameScene } from '../scenes/GameScene';
import { AttackType, AttackTypeParams } from '../data/champions';
import { SynergyBonusState } from './Champion';

const PROJECTILE_SPEED = 300; // pixels per second

export class Projectile {
  private scene: GameScene;
  private sprite: Phaser.GameObjects.Sprite;
  private target: Enemy;
  private damage: number;
  private alive: boolean = true;
  private attackType: AttackType;
  private params: AttackTypeParams;
  private synergy: SynergyBonusState;

  constructor(
    scene: GameScene,
    x: number,
    y: number,
    target: Enemy,
    damage: number,
    attackType: AttackType = 'normal',
    params: AttackTypeParams = {},
    synergy?: SynergyBonusState,
  ) {
    this.scene = scene;
    this.target = target;
    this.damage = damage;
    this.attackType = attackType;
    this.params = params;
    this.synergy = synergy || {
      damageMult: 1, attackSpeedMult: 1, rangeMult: 1,
      critChance: 0, critMult: 1, multishot: 0, executeThreshold: 0,
      burnOnHit: 0, burnRadius: 0, freezeChance: 0, freezeDuration: 0,
      splashOnHit: false, splashRadius: 0, splashFrac: 0,
      bonusGoldOnKill: 0, damageReflect: 0,
    };

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
    let finalDamage = this.damage;

    // Crit check
    let isCrit = false;
    if (this.synergy.critChance > 0 && Math.random() < this.synergy.critChance) {
      finalDamage = Math.round(finalDamage * this.synergy.critMult);
      isCrit = true;
      this.showCritEffect(targetPos);
    }

    // Apply base attack type
    switch (this.attackType) {
      case 'splash':
        this.target.takeDamage(finalDamage);
        this.applySplash(targetPos);
        break;

      case 'slow':
        this.target.takeDamage(finalDamage);
        this.target.applySlow(
          this.params.slowAmount ?? 0.5,
          this.params.slowDuration ?? 1.5,
        );
        break;

      case 'chain':
        this.target.takeDamage(finalDamage);
        this.applyChain(this.target);
        break;

      case 'dot':
        this.target.takeDamage(finalDamage);
        this.target.applyDot(
          this.params.dotDamage ?? 5,
          this.params.dotDuration ?? 3,
          this.params.dotTickRate ?? 2,
        );
        break;

      default:
        this.target.takeDamage(finalDamage);
        break;
    }

    // Execute: instantly kill low HP enemies
    if (this.synergy.executeThreshold > 0 && this.target.isAlive()) {
      const hpPercent = this.target.health / this.target.maxHealth;
      if (hpPercent <= this.synergy.executeThreshold) {
        this.target.takeDamage(this.target.health);
        this.showExecuteEffect(targetPos);
      }
    }

    // Burn AoE: apply DoT to all nearby enemies
    if (this.synergy.burnOnHit > 0) {
      this.applyBurnAoE(targetPos);
    }

    // Freeze chance
    if (this.synergy.freezeChance > 0 && Math.random() < this.synergy.freezeChance) {
      // Freeze = a very strong slow (0 speed) for the duration
      this.target.applySlow(0, this.synergy.freezeDuration);
      this.showFreezeEffect(targetPos);
    }

    // Synergy splash: non-splash attacks gain splash
    if (this.synergy.splashOnHit && this.attackType !== 'splash') {
      this.applySynergySplash(targetPos);
    }

    // Bonus gold on kill
    if (this.synergy.bonusGoldOnKill > 0 && !this.target.isAlive()) {
      this.scene.economyManager.addGold(this.synergy.bonusGoldOnKill);
      this.scene.events.emit('goldChanged', this.scene.economyManager.getGold());
      this.showGoldEffect(targetPos);
    }
  }

  private applySplash(center: { x: number; y: number }): void {
    const radius = this.params.splashRadius ?? 50;
    const frac = this.params.splashDamageFrac ?? 0.5;
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

  private applySynergySplash(center: { x: number; y: number }): void {
    const radius = this.synergy.splashRadius;
    const frac = this.synergy.splashFrac;
    const splashDmg = Math.round(this.damage * frac);

    this.showSplashEffect(center, radius, 0x9944ff);

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
