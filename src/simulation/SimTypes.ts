/** Lightweight types for headless simulation — no Phaser dependency */

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
  speed: number;
  damage: number;
  goldReward: number;
  distanceTraveled: number;
  alive: boolean;
}

export interface SimProjectile {
  targetIndex: number; // index into enemies array
  damage: number;
  x: number;
  y: number;
}

export interface SimState {
  gold: number;
  lives: number;
  level: number;
  xp: number;
  waveNumber: number;

  champions: SimChampion[]; // placed on board
  bench: (SimChampion | null)[];

  // Pool tracking: championId -> remaining count
  pool: Map<string, number>;
}
