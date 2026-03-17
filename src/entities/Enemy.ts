import Phaser from 'phaser';
import { PathGraph } from '../map/PathGraph';
import { GameScene } from '../scenes/GameScene';
import { COLORS } from '../utils/constants';

export class Enemy {
  scene: GameScene;
  sprite: Phaser.GameObjects.Sprite;
  healthBar: Phaser.GameObjects.Graphics;

  maxHealth: number;
  health: number;
  baseSpeed: number;
  speed: number;
  damage: number;
  goldReward: number;

  // Status effects
  private slowTimer: number = 0;
  private slowMultiplier: number = 1;
  private dotTimer: number = 0;
  private dotTickTimer: number = 0;
  private dotDamagePerTick: number = 0;
  private dotTickInterval: number = 0;
  private stunTimer: number = 0;
  private slowTint: Phaser.GameObjects.Sprite | null = null;

  private pathGraph: PathGraph;
  private distanceTraveled: number = 0;
  private alive: boolean = true;

  constructor(
    scene: GameScene,
    pathGraph: PathGraph,
    textureKey: string,
    health: number,
    speed: number,
    damage: number,
    goldReward: number,
  ) {
    this.scene = scene;
    this.pathGraph = pathGraph;
    this.maxHealth = health;
    this.health = health;
    this.baseSpeed = speed;
    this.speed = speed;
    this.damage = damage;
    this.goldReward = goldReward;

    const start = pathGraph.getStartPoint();
    this.sprite = scene.add.sprite(start.x, start.y, textureKey);
    this.sprite.setDepth(start.y + 1);
    this.sprite.setScale(0.9);

    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
  }

  update(delta: number): void {
    if (!this.alive) return;

    const dt = delta / 1000;

    // Update stun effect (stunned = cannot move, takes no actions)
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.sprite.clearTint();
        // Reapply slow tint if still slowed
        if (this.slowTimer > 0) {
          this.sprite.setTint(0x4488ff);
        } else if (this.dotTimer > 0) {
          this.sprite.setTint(0x44ff44);
        }
      }
      this.updateHealthBar();
      return; // Stunned: skip all movement and effects processing
    }

    // Update slow effect
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowMultiplier = 1;
        this.speed = this.baseSpeed;
        this.sprite.clearTint();
        if (this.slowTint) {
          this.slowTint.destroy();
          this.slowTint = null;
        }
      }
    }

    // Update DoT effect
    if (this.dotTimer > 0) {
      this.dotTimer -= dt;
      this.dotTickTimer -= dt;
      if (this.dotTickTimer <= 0 && this.dotTimer > 0) {
        this.takeDamage(this.dotDamagePerTick);
        this.dotTickTimer = this.dotTickInterval;
        if (!this.alive) return;
      }
      if (this.dotTimer <= 0) {
        this.sprite.clearTint();
      }
    }

    this.distanceTraveled += this.speed * dt;

    if (this.distanceTraveled >= this.pathGraph.getTotalLength()) {
      this.scene.enemyReachedEnd(this);
      return;
    }

    const pos = this.pathGraph.getPointAtDistance(this.distanceTraveled);
    this.sprite.setPosition(pos.x, pos.y);
    this.sprite.setDepth(pos.y + 1);
    this.updateHealthBar();
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
    this.updateHealthBar();
  }

  /** Apply a slow debuff. Stronger slows overwrite weaker ones. */
  applySlow(multiplier: number, duration: number): void {
    if (multiplier < this.slowMultiplier || this.slowTimer <= 0) {
      this.slowMultiplier = multiplier;
      this.speed = this.baseSpeed * multiplier;
      this.sprite.setTint(0x4488ff);
    }
    // Always refresh duration
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  /** Apply a damage-over-time effect. Refreshes duration, uses strongest. */
  applyDot(damagePerTick: number, duration: number, tickRate: number): void {
    if (damagePerTick > this.dotDamagePerTick || this.dotTimer <= 0) {
      this.dotDamagePerTick = damagePerTick;
      this.dotTickInterval = 1 / tickRate;
    }
    this.dotTimer = Math.max(this.dotTimer, duration);
    if (this.dotTickTimer <= 0) {
      this.dotTickTimer = this.dotTickInterval;
    }
    this.sprite.setTint(this.slowTimer > 0 ? 0x4488ff : 0x44ff44);
  }

  /** Apply a stun effect. Enemy cannot move or act for the duration. */
  applyStun(duration: number): void {
    this.stunTimer = Math.max(this.stunTimer, duration);
    this.sprite.setTint(0xffff00);
  }

  private die(): void {
    this.alive = false;
    this.scene.removeEnemy(this);
  }

  private updateHealthBar(): void {
    this.healthBar.clear();
    const barWidth = 24;
    const barHeight = 4;
    const x = this.sprite.x - barWidth / 2;
    const y = this.sprite.y - 18;

    // Background
    this.healthBar.fillStyle(COLORS.healthBarBg, 0.8);
    this.healthBar.fillRect(x, y, barWidth, barHeight);

    // Health
    const healthPercent = this.health / this.maxHealth;
    const color = healthPercent > 0.5 ? COLORS.healthBar : healthPercent > 0.25 ? 0xf39c12 : 0xe74c3c;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);

    this.healthBar.setDepth(this.sprite.depth + 1);
  }

  isAlive(): boolean {
    return this.alive;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getDistanceTraveled(): number {
    return this.distanceTraveled;
  }

  destroy(): void {
    this.alive = false;
    this.sprite.destroy();
    this.healthBar.destroy();
    if (this.slowTint) {
      this.slowTint.destroy();
    }
  }
}
