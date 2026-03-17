/** Lightweight types for headless simulation — no Phaser dependency */

export interface SimSynergyBonuses {
  damageMult: number;
  attackSpeedMult: number;
  rangeMult: number;
  slowAmount: number;
  slowDuration: number;
  burnOnHit: number;
  burnRadius: number;
  splashOnHit: boolean;
  splashFrac: number;
  splashRadius: number;
  chainOnHit: number;
  chainRange: number;
  chainDamageFrac: number;
  dotOnHit: number;
  dotDuration: number;
  dotTickRate: number;
  critChance: number;
  critMult: number;
  multishot: number;
  executeThreshold: number;
  freezeChance: number;
  freezeDuration: number;
  bonusGoldOnKill: number;
}

export function defaultSimBonuses(): SimSynergyBonuses {
  return {
    damageMult: 1, attackSpeedMult: 1, rangeMult: 1,
    slowAmount: 0, slowDuration: 0,
    burnOnHit: 0, burnRadius: 0,
    splashOnHit: false, splashFrac: 0, splashRadius: 0,
    chainOnHit: 0, chainRange: 0, chainDamageFrac: 0,
    dotOnHit: 0, dotDuration: 0, dotTickRate: 0,
    critChance: 0, critMult: 1, multishot: 0, executeThreshold: 0,
    freezeChance: 0, freezeDuration: 0,
    bonusGoldOnKill: 0,
  };
}

export interface SimChampion {
  championId: string;
  name: string;
  cost: number;
  traits: string[];
  starLevel: number;

  // Base stats (scaled by star level)
  baseDamage: number;
  baseRange: number;
  baseAttackSpeed: number;

  // Effective stats (after synergies)
  damage: number;
  range: number;
  attackSpeed: number;

  // Synergy effects
  synergyBonuses: SimSynergyBonuses;

  // Position on map (screen coords for distance checks)
  x: number;
  y: number;
  placed: boolean;
  gridCol: number;
  gridRow: number;

  // Combat
  attackCooldown: number;
}

export interface SimEnemy {
  type: string;
  maxHealth: number;
  health: number;
  baseSpeed: number;
  speed: number;
  damage: number;
  goldReward: number;
  distanceTraveled: number;
  alive: boolean;

  // Status effects
  slowTimer: number;
  slowMultiplier: number;
  dotTimer: number;
  dotTickTimer: number;
  dotDamagePerTick: number;
  dotTickInterval: number;
}

export interface SimProjectile {
  targetIndex: number; // index into enemies array
  damage: number;
  x: number;
  y: number;
  synergy: SimSynergyBonuses;
}

export interface SimState {
  gold: number;
  lives: number;
  level: number;
  xp: number;
  waveNumber: number;
  winStreak: number;

  champions: SimChampion[]; // placed on board
  bench: (SimChampion | null)[];

  // Pool tracking: championId -> remaining count
  pool: Map<string, number>;
}
