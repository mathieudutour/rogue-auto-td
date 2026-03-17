// Tile dimensions (2:1 isometric ratio)
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

// Map dimensions (in tiles)
export const MAP_COLS = 14;
export const MAP_ROWS = 14;

// Game balance
export const STARTING_GOLD = 10;
export const STARTING_LIVES = 20;
export const REROLL_COST = 2;
export const INTEREST_PER_10_GOLD = 1;
export const MAX_INTEREST = 5;
export const BASE_WAVE_GOLD = 5;
export const MAX_WIN_STREAK_BONUS = 3;
export const BENCH_SIZE = 8;
export const SHOP_SIZE = 5;

// Player level system
export const STARTING_LEVEL = 2;
export const MAX_LEVEL = 9;
export const BUY_XP_COST = 4;
export const BUY_XP_AMOUNT = 4;

// XP needed to reach each level (index = level, value = total XP needed)
// Level 2 = start, so XP to go from level 2→3 is XP_PER_LEVEL[3], etc.
export const XP_PER_LEVEL: Record<number, number> = {
  3: 2,
  4: 6,
  5: 10,
  6: 20,
  7: 36,
  8: 56,
  9: 80,
};

// Max champions on the board per level
export const BOARD_SIZE_PER_LEVEL: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
};

// Shop odds per level: probability of each cost tier [1-cost, 2-cost, 3-cost, 4-cost, 5-cost]
export const SHOP_ODDS_PER_LEVEL: Record<number, number[]> = {
  2: [1.00, 0.00, 0.00, 0.00, 0.00],
  3: [0.70, 0.30, 0.00, 0.00, 0.00],
  4: [0.50, 0.35, 0.15, 0.00, 0.00],
  5: [0.35, 0.35, 0.25, 0.05, 0.00],
  6: [0.22, 0.30, 0.30, 0.15, 0.03],
  7: [0.15, 0.22, 0.33, 0.25, 0.05],
  8: [0.10, 0.18, 0.30, 0.32, 0.10],
  9: [0.05, 0.10, 0.25, 0.40, 0.20],
};

// Star upgrade multipliers
export const STAR_2_MULTIPLIER = 1.8;
export const STAR_3_MULTIPLIER = 3.2;

// Champion pool sizes by cost tier
export const POOL_SIZES: Record<number, number> = {
  1: 30,
  2: 20,
  3: 15,
  4: 10,
  5: 10,
};

// Colors
export const COLORS = {
  path: 0x8b6914,
  pathStroke: 0xa07828,
  placeable: 0x2d5a27,
  placeableStroke: 0x3d7a37,
  blocked: 0x4a4a4a,
  blockedStroke: 0x5a5a5a,
  hover: 0xffff00,
  selected: 0x00ffff,
  enemyBasic: 0xe74c3c,
  enemyFast: 0xe67e22,
  enemyTank: 0x8e44ad,
  enemyBoss: 0xc0392b,
  healthBar: 0x2ecc71,
  healthBarBg: 0x333333,
  gold: 0xf1c40f,
  uiBg: 0x16213e,
  uiBorder: 0x0f3460,
};

// Trait colors for champion circles
export const TRAIT_COLORS: Record<string, number> = {
  fire: 0xff4444,
  ice: 0x44aaff,
  nature: 0x44ff44,
  shadow: 0x9944ff,
  arcane: 0xffaa22,
  warrior: 0xcc8844,
  ranger: 0x44cc44,
  mage: 0x4444ff,
  assassin: 0xff44ff,
  guardian: 0x88aacc,
};
