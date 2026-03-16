export type AttackType = 'normal' | 'splash' | 'slow' | 'chain' | 'dot';

export interface AttackTypeParams {
  splashRadius?: number;       // splash: AoE radius in pixels
  splashDamageFrac?: number;   // splash: fraction of damage to nearby enemies (0-1)
  slowAmount?: number;         // slow: speed multiplier (0.5 = 50% slower)
  slowDuration?: number;       // slow: duration in seconds
  chainCount?: number;         // chain: number of bounces
  chainRange?: number;         // chain: bounce range in pixels
  chainDamageFrac?: number;    // chain: damage multiplier per bounce
  dotDamage?: number;          // dot: damage per tick
  dotDuration?: number;        // dot: total duration in seconds
  dotTickRate?: number;        // dot: ticks per second
}

export interface ChampionData {
  id: string;
  name: string;
  cost: number;
  traits: string[];
  textureKey: string;
  attackType?: AttackType;
  attackTypeParams?: AttackTypeParams;
  stats: {
    damage: number;
    range: number;          // in pixels
    attackSpeed: number;    // attacks per second
    health: number;
  };
}

export const CHAMPIONS: ChampionData[] = [
  // ── Cost 1 ──────────────────────────────────────────
  {
    id: 'flame_grunt',
    name: 'Flame Grunt',
    cost: 1,
    traits: ['fire', 'warrior'],
    textureKey: 'champion_fire_warrior',
    stats: { damage: 15, range: 80, attackSpeed: 0.8, health: 100 },
  },
  {
    id: 'frost_archer',
    name: 'Frost Archer',
    cost: 1,
    traits: ['ice', 'ranger'],
    textureKey: 'champion_ice_ranger',
    attackType: 'slow',
    attackTypeParams: { slowAmount: 0.7, slowDuration: 1.0 },
    stats: { damage: 10, range: 130, attackSpeed: 1.0, health: 60 },
  },
  {
    id: 'vine_fighter',
    name: 'Vine Fighter',
    cost: 1,
    traits: ['nature', 'warrior'],
    textureKey: 'champion_nature_warrior',
    attackType: 'dot',
    attackTypeParams: { dotDamage: 4, dotDuration: 2.0, dotTickRate: 2 },
    stats: { damage: 8, range: 80, attackSpeed: 0.9, health: 90 },
  },
  {
    id: 'arcane_sentinel',
    name: 'Arcane Sentinel',
    cost: 1,
    traits: ['arcane', 'guardian'],
    textureKey: 'champion_arcane_guardian',
    stats: { damage: 10, range: 90, attackSpeed: 0.7, health: 120 },
  },
  {
    id: 'shadow_scout',
    name: 'Shadow Scout',
    cost: 1,
    traits: ['shadow', 'ranger'],
    textureKey: 'champion_shadow_ranger',
    stats: { damage: 13, range: 120, attackSpeed: 1.1, health: 50 },
  },

  // ── Cost 2 ──────────────────────────────────────────
  {
    id: 'fire_mage',
    name: 'Fire Mage',
    cost: 2,
    traits: ['fire', 'mage'],
    textureKey: 'champion_fire_mage',
    attackType: 'splash',
    attackTypeParams: { splashRadius: 50, splashDamageFrac: 0.5 },
    stats: { damage: 25, range: 110, attackSpeed: 0.6, health: 70 },
  },
  {
    id: 'ice_mage',
    name: 'Ice Mage',
    cost: 2,
    traits: ['ice', 'mage'],
    textureKey: 'champion_ice_mage',
    attackType: 'slow',
    attackTypeParams: { slowAmount: 0.5, slowDuration: 1.5 },
    stats: { damage: 18, range: 120, attackSpeed: 0.7, health: 65 },
  },
  {
    id: 'leaf_ranger',
    name: 'Leaf Ranger',
    cost: 2,
    traits: ['nature', 'ranger'],
    textureKey: 'champion_nature_ranger',
    attackType: 'dot',
    attackTypeParams: { dotDamage: 6, dotDuration: 3.0, dotTickRate: 2 },
    stats: { damage: 12, range: 140, attackSpeed: 1.1, health: 55 },
  },
  {
    id: 'arcane_mage',
    name: 'Arcane Mage',
    cost: 2,
    traits: ['arcane', 'mage'],
    textureKey: 'champion_arcane_mage',
    stats: { damage: 22, range: 115, attackSpeed: 0.65, health: 60 },
  },
  {
    id: 'fire_guardian',
    name: 'Ember Guardian',
    cost: 2,
    traits: ['fire', 'guardian'],
    textureKey: 'champion_fire_guardian',
    stats: { damage: 16, range: 85, attackSpeed: 0.6, health: 130 },
  },

  // ── Cost 3 ──────────────────────────────────────────
  {
    id: 'shadow_blade',
    name: 'Shadow Blade',
    cost: 3,
    traits: ['shadow', 'assassin'],
    textureKey: 'champion_shadow_assassin',
    stats: { damage: 40, range: 70, attackSpeed: 1.3, health: 80 },
  },
  {
    id: 'shadow_caster',
    name: 'Shadow Caster',
    cost: 3,
    traits: ['shadow', 'mage'],
    textureKey: 'champion_shadow_mage',
    attackType: 'chain',
    attackTypeParams: { chainCount: 3, chainRange: 80, chainDamageFrac: 0.7 },
    stats: { damage: 35, range: 120, attackSpeed: 0.5, health: 75 },
  },
  {
    id: 'storm_warden',
    name: 'Storm Warden',
    cost: 3,
    traits: ['arcane', 'warrior'],
    textureKey: 'champion_arcane_warrior',
    attackType: 'chain',
    attackTypeParams: { chainCount: 4, chainRange: 90, chainDamageFrac: 0.65 },
    stats: { damage: 28, range: 85, attackSpeed: 0.85, health: 140 },
  },
  {
    id: 'thorn_guardian',
    name: 'Thorn Guardian',
    cost: 3,
    traits: ['nature', 'guardian'],
    textureKey: 'champion_nature_guardian',
    attackType: 'splash',
    attackTypeParams: { splashRadius: 40, splashDamageFrac: 0.4 },
    stats: { damage: 22, range: 90, attackSpeed: 0.7, health: 180 },
  },
  {
    id: 'ice_assassin',
    name: 'Frost Fang',
    cost: 3,
    traits: ['ice', 'assassin'],
    textureKey: 'champion_ice_assassin',
    attackType: 'slow',
    attackTypeParams: { slowAmount: 0.4, slowDuration: 1.2 },
    stats: { damage: 35, range: 75, attackSpeed: 1.2, health: 70 },
  },

  // ── Cost 4 ──────────────────────────────────────────
  {
    id: 'inferno_assassin',
    name: 'Inferno Assassin',
    cost: 4,
    traits: ['fire', 'assassin'],
    textureKey: 'champion_fire_assassin',
    attackType: 'splash',
    attackTypeParams: { splashRadius: 45, splashDamageFrac: 0.35 },
    stats: { damage: 55, range: 80, attackSpeed: 1.5, health: 100 },
  },
  {
    id: 'glacier_knight',
    name: 'Glacier Knight',
    cost: 4,
    traits: ['ice', 'warrior'],
    textureKey: 'champion_ice_warrior',
    attackType: 'slow',
    attackTypeParams: { slowAmount: 0.35, slowDuration: 2.0 },
    stats: { damage: 28, range: 90, attackSpeed: 0.7, health: 200 },
  },
  {
    id: 'nature_assassin',
    name: 'Venom Stalker',
    cost: 4,
    traits: ['nature', 'assassin'],
    textureKey: 'champion_nature_assassin',
    attackType: 'dot',
    attackTypeParams: { dotDamage: 12, dotDuration: 4.0, dotTickRate: 2 },
    stats: { damage: 35, range: 75, attackSpeed: 1.4, health: 90 },
  },
  {
    id: 'arcane_ranger',
    name: 'Arcane Sniper',
    cost: 4,
    traits: ['arcane', 'ranger'],
    textureKey: 'champion_arcane_ranger',
    stats: { damage: 35, range: 170, attackSpeed: 0.9, health: 75 },
  },

  // ── Cost 5 ──────────────────────────────────────────
  {
    id: 'phoenix_lord',
    name: 'Phoenix Lord',
    cost: 5,
    traits: ['fire', 'guardian'],
    textureKey: 'champion_fire_legendary',
    attackType: 'splash',
    attackTypeParams: { splashRadius: 65, splashDamageFrac: 0.6 },
    stats: { damage: 55, range: 100, attackSpeed: 0.8, health: 300 },
  },
  {
    id: 'void_reaper',
    name: 'Void Reaper',
    cost: 5,
    traits: ['shadow', 'assassin'],
    textureKey: 'champion_shadow_legendary',
    attackType: 'chain',
    attackTypeParams: { chainCount: 5, chainRange: 100, chainDamageFrac: 0.75 },
    stats: { damage: 70, range: 85, attackSpeed: 1.6, health: 120 },
  },
  {
    id: 'frost_queen',
    name: 'Frost Queen',
    cost: 5,
    traits: ['ice', 'mage'],
    textureKey: 'champion_ice_legendary',
    attackType: 'slow',
    attackTypeParams: { slowAmount: 0.3, slowDuration: 2.5 },
    stats: { damage: 45, range: 150, attackSpeed: 0.8, health: 150 },
  },
  {
    id: 'elder_treant',
    name: 'Elder Treant',
    cost: 5,
    traits: ['nature', 'guardian'],
    textureKey: 'champion_nature_legendary',
    attackType: 'dot',
    attackTypeParams: { dotDamage: 15, dotDuration: 5.0, dotTickRate: 2 },
    stats: { damage: 30, range: 95, attackSpeed: 0.6, health: 400 },
  },
];

export function getChampionById(id: string): ChampionData | undefined {
  return CHAMPIONS.find(c => c.id === id);
}
