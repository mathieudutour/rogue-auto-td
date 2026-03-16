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
export const BENCH_SIZE = 8;
export const SHOP_SIZE = 5;

// Star upgrade multipliers
export const STAR_2_MULTIPLIER = 1.8;
export const STAR_3_MULTIPLIER = 3.2;

// Champion pool sizes by cost tier
export const POOL_SIZES: Record<number, number> = {
  1: 30,
  2: 20,
  3: 15,
  4: 10,
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
  warrior: 0xcc8844,
  ranger: 0x44cc44,
  mage: 0x4444ff,
  assassin: 0xff44ff,
};
