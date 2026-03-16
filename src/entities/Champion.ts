import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { ChampionData, AttackType, AttackTypeParams } from '../data/champions';
import { SynergyTier } from '../data/synergies';
import { STAR_2_MULTIPLIER, STAR_3_MULTIPLIER, COLORS } from '../utils/constants';

export interface SynergyBonusState {
  damageMult: number;
  attackSpeedMult: number;
  rangeMult: number;
  armor: number;
  // Special effects from max-tier synergies
  critChance: number;
  critMult: number;
  multishot: number;
  executeThreshold: number;
  burnOnHit: number;
  burnRadius: number;
  freezeChance: number;
  freezeDuration: number;
  splashOnHit: boolean;
  splashRadius: number;
  splashFrac: number;
  bonusGoldOnKill: number;
  damageReflect: number;
}

function defaultBonuses(): SynergyBonusState {
  return {
    damageMult: 1, attackSpeedMult: 1, rangeMult: 1, armor: 0,
    critChance: 0, critMult: 1, multishot: 0, executeThreshold: 0,
    burnOnHit: 0, burnRadius: 0, freezeChance: 0, freezeDuration: 0,
    splashOnHit: false, splashRadius: 0, splashFrac: 0,
    bonusGoldOnKill: 0, damageReflect: 0,
  };
}

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
  synergyBonuses: SynergyBonusState = defaultBonuses();

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

  /** TFT-style sell price: full investment minus 1g for starred units (except 1-cost) */
  getSellPrice(): number {
    const invested = this.cost * Math.pow(3, this.starLevel - 1);
    if (this.starLevel === 1 || this.cost === 1) return invested;
    return invested - 1;
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
    this.synergyBonuses = defaultBonuses();
    this.applyStats();
  }

  applySynergyBonus(bonuses: SynergyTier['bonuses']): void {
    if (bonuses.damageMult) this.synergyBonuses.damageMult *= bonuses.damageMult;
    if (bonuses.attackSpeedMult) this.synergyBonuses.attackSpeedMult *= bonuses.attackSpeedMult;
    if (bonuses.rangeMult) this.synergyBonuses.rangeMult *= bonuses.rangeMult;
    if (bonuses.armor) this.synergyBonuses.armor += bonuses.armor;
    // Special effects (take the highest value if multiple sources)
    if (bonuses.critChance) this.synergyBonuses.critChance = Math.max(this.synergyBonuses.critChance, bonuses.critChance);
    if (bonuses.critMult) this.synergyBonuses.critMult = Math.max(this.synergyBonuses.critMult, bonuses.critMult);
    if (bonuses.multishot) this.synergyBonuses.multishot = Math.max(this.synergyBonuses.multishot, bonuses.multishot);
    if (bonuses.executeThreshold) this.synergyBonuses.executeThreshold = Math.max(this.synergyBonuses.executeThreshold, bonuses.executeThreshold);
    if (bonuses.burnOnHit) this.synergyBonuses.burnOnHit = Math.max(this.synergyBonuses.burnOnHit, bonuses.burnOnHit);
    if (bonuses.burnRadius) this.synergyBonuses.burnRadius = Math.max(this.synergyBonuses.burnRadius, bonuses.burnRadius);
    if (bonuses.freezeChance) this.synergyBonuses.freezeChance = Math.max(this.synergyBonuses.freezeChance, bonuses.freezeChance);
    if (bonuses.freezeDuration) this.synergyBonuses.freezeDuration = Math.max(this.synergyBonuses.freezeDuration, bonuses.freezeDuration);
    if (bonuses.splashOnHit) this.synergyBonuses.splashOnHit = true;
    if (bonuses.splashRadius) this.synergyBonuses.splashRadius = Math.max(this.synergyBonuses.splashRadius, bonuses.splashRadius);
    if (bonuses.splashFrac) this.synergyBonuses.splashFrac = Math.max(this.synergyBonuses.splashFrac, bonuses.splashFrac);
    if (bonuses.bonusGoldOnKill) this.synergyBonuses.bonusGoldOnKill += bonuses.bonusGoldOnKill;
    if (bonuses.damageReflect) this.synergyBonuses.damageReflect = Math.max(this.synergyBonuses.damageReflect, bonuses.damageReflect);
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
