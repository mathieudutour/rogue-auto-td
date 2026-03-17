export interface ChampionData {
  id: string;
  name: string;
  cost: number;
  traits: string[];
  textureKey: string;
  stats: {
    damage: number;
    range: number;          // in pixels
    attackSpeed: number;    // attacks per second
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
    stats: { damage: 15, range: 80, attackSpeed: 0.8 },
  },
  {
    id: 'frost_archer',
    name: 'Frost Archer',
    cost: 1,
    traits: ['ice', 'ranger'],
    textureKey: 'champion_ice_ranger',
    stats: { damage: 10, range: 130, attackSpeed: 1.0 },
  },
  {
    id: 'vine_fighter',
    name: 'Vine Fighter',
    cost: 1,
    traits: ['nature', 'warrior'],
    textureKey: 'champion_nature_warrior',
    stats: { damage: 8, range: 80, attackSpeed: 0.9 },
  },
  {
    id: 'arcane_sentinel',
    name: 'Arcane Sentinel',
    cost: 1,
    traits: ['arcane', 'guardian'],
    textureKey: 'champion_arcane_guardian',
    stats: { damage: 12, range: 100, attackSpeed: 0.8 },
  },
  {
    id: 'shadow_scout',
    name: 'Shadow Scout',
    cost: 1,
    traits: ['shadow', 'ranger'],
    textureKey: 'champion_shadow_ranger',
    stats: { damage: 13, range: 120, attackSpeed: 1.1 },
  },

  // ── Cost 2 ──────────────────────────────────────────
  {
    id: 'fire_mage',
    name: 'Fire Mage',
    cost: 2,
    traits: ['fire', 'mage'],
    textureKey: 'champion_fire_mage',
    stats: { damage: 25, range: 110, attackSpeed: 0.6 },
  },
  {
    id: 'ice_mage',
    name: 'Ice Mage',
    cost: 2,
    traits: ['ice', 'mage'],
    textureKey: 'champion_ice_mage',
    stats: { damage: 18, range: 120, attackSpeed: 0.7 },
  },
  {
    id: 'leaf_ranger',
    name: 'Leaf Ranger',
    cost: 2,
    traits: ['nature', 'ranger'],
    textureKey: 'champion_nature_ranger',
    stats: { damage: 12, range: 140, attackSpeed: 1.1 },
  },
  {
    id: 'arcane_mage',
    name: 'Arcane Mage',
    cost: 2,
    traits: ['arcane', 'mage'],
    textureKey: 'champion_arcane_mage',
    stats: { damage: 22, range: 115, attackSpeed: 0.65 },
  },
  {
    id: 'fire_guardian',
    name: 'Ember Guardian',
    cost: 2,
    traits: ['fire', 'guardian'],
    textureKey: 'champion_fire_guardian',
    stats: { damage: 16, range: 85, attackSpeed: 0.6 },
  },

  // ── Cost 3 ──────────────────────────────────────────
  {
    id: 'shadow_blade',
    name: 'Shadow Blade',
    cost: 3,
    traits: ['shadow', 'assassin'],
    textureKey: 'champion_shadow_assassin',
    stats: { damage: 40, range: 70, attackSpeed: 1.3 },
  },
  {
    id: 'shadow_caster',
    name: 'Shadow Caster',
    cost: 3,
    traits: ['shadow', 'mage'],
    textureKey: 'champion_shadow_mage',
    stats: { damage: 35, range: 120, attackSpeed: 0.5 },
  },
  {
    id: 'storm_warden',
    name: 'Storm Warden',
    cost: 3,
    traits: ['arcane', 'warrior'],
    textureKey: 'champion_arcane_warrior',
    stats: { damage: 28, range: 85, attackSpeed: 0.85 },
  },
  {
    id: 'thorn_guardian',
    name: 'Thorn Guardian',
    cost: 3,
    traits: ['nature', 'guardian'],
    textureKey: 'champion_nature_guardian',
    stats: { damage: 25, range: 95, attackSpeed: 0.75 },
  },
  {
    id: 'ice_assassin',
    name: 'Frost Fang',
    cost: 3,
    traits: ['ice', 'assassin'],
    textureKey: 'champion_ice_assassin',
    stats: { damage: 35, range: 75, attackSpeed: 1.2 },
  },

  // ── Cost 4 ──────────────────────────────────────────
  {
    id: 'inferno_assassin',
    name: 'Inferno Assassin',
    cost: 4,
    traits: ['fire', 'assassin'],
    textureKey: 'champion_fire_assassin',
    stats: { damage: 55, range: 80, attackSpeed: 1.5 },
  },
  {
    id: 'glacier_knight',
    name: 'Glacier Knight',
    cost: 4,
    traits: ['ice', 'warrior'],
    textureKey: 'champion_ice_warrior',
    stats: { damage: 28, range: 90, attackSpeed: 0.7 },
  },
  {
    id: 'nature_assassin',
    name: 'Venom Stalker',
    cost: 4,
    traits: ['nature', 'assassin'],
    textureKey: 'champion_nature_assassin',
    stats: { damage: 35, range: 75, attackSpeed: 1.4 },
  },
  {
    id: 'arcane_ranger',
    name: 'Arcane Sniper',
    cost: 4,
    traits: ['arcane', 'ranger'],
    textureKey: 'champion_arcane_ranger',
    stats: { damage: 35, range: 170, attackSpeed: 0.9 },
  },

  // ── Cost 5 ──────────────────────────────────────────
  {
    id: 'phoenix_lord',
    name: 'Phoenix Lord',
    cost: 5,
    traits: ['fire', 'guardian'],
    textureKey: 'champion_fire_legendary',
    stats: { damage: 55, range: 100, attackSpeed: 0.8 },
  },
  {
    id: 'void_reaper',
    name: 'Void Reaper',
    cost: 5,
    traits: ['shadow', 'assassin'],
    textureKey: 'champion_shadow_legendary',
    stats: { damage: 65, range: 85, attackSpeed: 1.3 },
  },
  {
    id: 'frost_queen',
    name: 'Frost Queen',
    cost: 5,
    traits: ['ice', 'mage'],
    textureKey: 'champion_ice_legendary',
    stats: { damage: 45, range: 150, attackSpeed: 0.8 },
  },
  {
    id: 'elder_treant',
    name: 'Elder Treant',
    cost: 5,
    traits: ['nature', 'guardian'],
    textureKey: 'champion_nature_legendary',
    stats: { damage: 30, range: 95, attackSpeed: 0.6 },
  },
];

export function getChampionById(id: string): ChampionData | undefined {
  return CHAMPIONS.find(c => c.id === id);
}
