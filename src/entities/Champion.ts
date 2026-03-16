import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { ChampionData, AttackType, AttackTypeParams } from '../data/champions';
import { STAR_2_MULTIPLIER, STAR_3_MULTIPLIER, COLORS } from '../utils/constants';

export class Champion {
  scene: GameScene;
  sprite: Phaser.GameObjects.Sprite;
  starIndicator: Phaser.GameObjects.Text;

  // Identity
  championId: string;
  name: string;
  cost: number;
  traits: string[];
  textureKey: string;

  // Attack type
  attackType: AttackType;
  attackTypeParams: AttackTypeParams;

  // Base stats (before synergy bonuses)
  baseDamage: number;
  baseRange: number;
  baseAttackSpeed: number;
  baseHealth: number;

  // Effective stats (after synergies)
  damage: number;
  range: number;
  attackSpeed: number;

  // Synergy bonus tracking
  synergyBonuses = { damageMult: 1, attackSpeedMult: 1, rangeMult: 1, armor: 0 };

  // State
  starLevel: number = 1;
  placed: boolean = false;
  gridCol?: number;
  gridRow?: number;

  // Combat
  attackCooldown: number = 0;
  target: import('../entities/Enemy').Enemy | null = null;
  private rangeCircle: Phaser.GameObjects.Image | null = null;

  constructor(scene: GameScene, data: ChampionData) {
    this.scene = scene;
    this.championId = data.id;
    this.name = data.name;
    this.cost = data.cost;
    this.traits = [...data.traits];
    this.textureKey = data.textureKey;
    this.attackType = data.attackType || 'normal';
    this.attackTypeParams = data.attackTypeParams || {};

    this.baseDamage = data.stats.damage;
    this.baseRange = data.stats.range;
    this.baseAttackSpeed = data.stats.attackSpeed;
    this.baseHealth = data.stats.health;

    this.damage = this.baseDamage;
    this.range = this.baseRange;
    this.attackSpeed = this.baseAttackSpeed;

    // Create sprite (initially hidden, shown when placed or on bench)
    this.sprite = scene.add.sprite(0, 0, data.textureKey);
    this.sprite.setVisible(false);
    this.sprite.setScale(1.2);

    // Star indicator
    this.starIndicator = scene.add.text(0, 0, '', {
      fontSize: '10px',
      color: '#ffd700',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.starIndicator.setOrigin(0.5, 1);
    this.starIndicator.setVisible(false);
    this.updateStarDisplay();
  }

  place(col: number, row: number, screenX: number, screenY: number): void {
    this.gridCol = col;
    this.gridRow = row;
    this.placed = true;

    this.sprite.setPosition(screenX, screenY - 8); // Slightly above tile center
    this.sprite.setVisible(true);
    this.sprite.setDepth(screenY + 2);

    this.starIndicator.setPosition(screenX, screenY - 22);
    this.starIndicator.setVisible(true);
    this.starIndicator.setDepth(screenY + 3);

    this.attackCooldown = 0;
  }

  removeFromBoard(): void {
    this.placed = false;
    this.gridCol = undefined;
    this.gridRow = undefined;
    this.sprite.setVisible(false);
    this.starIndicator.setVisible(false);
    this.hideRange();
    this.target = null;
  }

  showRange(): void {
    if (this.rangeCircle || !this.placed) return;
    this.rangeCircle = this.scene.add.image(this.sprite.x, this.sprite.y, 'range_indicator');
    const scale = (this.range * 2) / 128;
    this.rangeCircle.setScale(scale);
    this.rangeCircle.setDepth(0);
    this.rangeCircle.setAlpha(0.3);
  }

  hideRange(): void {
    if (this.rangeCircle) {
      this.rangeCircle.destroy();
      this.rangeCircle = null;
    }
  }

  update(delta: number): void {
    if (!this.placed) return;

    this.attackCooldown -= delta / 1000;

    if (this.attackCooldown <= 0) {
      // Find target
      this.target = this.findTarget();
      if (this.target) {
        this.attack(this.target);
        this.attackCooldown = 1 / this.attackSpeed;
      }
    }
  }

  private findTarget(): import('../entities/Enemy').Enemy | null {
    let closest: import('../entities/Enemy').Enemy | null = null;
    let closestDist = Infinity;
    // Prefer enemies furthest along the path (most dangerous)
    let furthestProgress = -1;

    for (const enemy of this.scene.enemies) {
      if (!enemy.isAlive()) continue;
      const pos = enemy.getPosition();
      const dx = pos.x - this.sprite.x;
      const dy = pos.y - this.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= this.range) {
        const progress = enemy.getDistanceTraveled();
        if (progress > furthestProgress) {
          furthestProgress = progress;
          closest = enemy;
          closestDist = dist;
        }
      }
    }

    return closest;
  }

  private attack(target: import('../entities/Enemy').Enemy): void {
    this.scene.combatSystem.fireProjectile(this, target);
  }

  /** Upgrade star level (called when 3 copies merge) */
  evolve(): void {
    this.starLevel++;
    const mult = this.starLevel === 2 ? STAR_2_MULTIPLIER : STAR_3_MULTIPLIER;
    this.baseDamage = Math.round(this.baseDamage * mult / (this.starLevel === 3 ? STAR_2_MULTIPLIER : 1));
    this.baseRange = Math.round(this.baseRange * 1.1);
    this.baseAttackSpeed = this.baseAttackSpeed * 1.1;
    this.baseHealth = Math.round(this.baseHealth * mult / (this.starLevel === 3 ? STAR_2_MULTIPLIER : 1));
    this.applyStats();
    this.updateStarDisplay();
    this.sprite.setScale(1.2 + (this.starLevel - 1) * 0.2);
  }

  /** Recalculate effective stats from base + synergy bonuses */
  applyStats(): void {
    this.damage = Math.round(this.baseDamage * this.synergyBonuses.damageMult);
    this.range = Math.round(this.baseRange * this.synergyBonuses.rangeMult);
    this.attackSpeed = this.baseAttackSpeed * this.synergyBonuses.attackSpeedMult;
  }

  resetSynergyBonuses(): void {
    this.synergyBonuses = { damageMult: 1, attackSpeedMult: 1, rangeMult: 1, armor: 0 };
    this.applyStats();
  }

  applySynergyBonus(bonuses: { damageMult?: number; attackSpeedMult?: number; rangeMult?: number; armor?: number }): void {
    if (bonuses.damageMult) this.synergyBonuses.damageMult *= bonuses.damageMult;
    if (bonuses.attackSpeedMult) this.synergyBonuses.attackSpeedMult *= bonuses.attackSpeedMult;
    if (bonuses.rangeMult) this.synergyBonuses.rangeMult *= bonuses.rangeMult;
    if (bonuses.armor) this.synergyBonuses.armor += bonuses.armor;
    this.applyStats();
  }

  private updateStarDisplay(): void {
    const stars = '\u2605'.repeat(this.starLevel);
    this.starIndicator.setText(stars);
  }

  destroy(): void {
    this.sprite.destroy();
    this.starIndicator.destroy();
    this.hideRange();
  }
}
