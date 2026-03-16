/** Lightweight types for headless simulation — no Phaser dependency */

import { AttackType, AttackTypeParams } from '../data/champions';

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
  baseHealth: number;

  // Effective stats (after synergies)
  damage: number;
  range: number;
  attackSpeed: number;

  // Attack type
  attackType: AttackType;
  attackTypeParams: AttackTypeParams;

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
  attackType: AttackType;
  attackTypeParams: AttackTypeParams;
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
