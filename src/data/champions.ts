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
    health: number;
  };
}

export const CHAMPIONS: ChampionData[] = [
  // Cost 1
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
    stats: { damage: 12, range: 130, attackSpeed: 1.0, health: 60 },
  },
  {
    id: 'vine_fighter',
    name: 'Vine Fighter',
    cost: 1,
    traits: ['nature', 'warrior'],
    textureKey: 'champion_nature_warrior',
    stats: { damage: 14, range: 80, attackSpeed: 0.9, health: 90 },
  },
  // Cost 2
  {
    id: 'fire_mage',
    name: 'Fire Mage',
    cost: 2,
    traits: ['fire', 'mage'],
    textureKey: 'champion_fire_mage',
    stats: { damage: 25, range: 110, attackSpeed: 0.6, health: 70 },
  },
  {
    id: 'ice_mage',
    name: 'Ice Mage',
    cost: 2,
    traits: ['ice', 'mage'],
    textureKey: 'champion_ice_mage',
    stats: { damage: 20, range: 120, attackSpeed: 0.7, health: 65 },
  },
  {
    id: 'leaf_ranger',
    name: 'Leaf Ranger',
    cost: 2,
    traits: ['nature', 'ranger'],
    textureKey: 'champion_nature_ranger',
    stats: { damage: 18, range: 140, attackSpeed: 1.1, health: 55 },
  },
  // Cost 3
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
    stats: { damage: 35, range: 120, attackSpeed: 0.5, health: 75 },
  },
  // Cost 4
  {
    id: 'inferno_assassin',
    name: 'Inferno Assassin',
    cost: 4,
    traits: ['fire', 'assassin'],
    textureKey: 'champion_fire_assassin',
    stats: { damage: 55, range: 80, attackSpeed: 1.5, health: 100 },
  },
  {
    id: 'glacier_knight',
    name: 'Glacier Knight',
    cost: 4,
    traits: ['ice', 'warrior'],
    textureKey: 'champion_ice_warrior',
    stats: { damage: 30, range: 90, attackSpeed: 0.7, health: 200 },
  },
];

export function getChampionById(id: string): ChampionData | undefined {
  return CHAMPIONS.find(c => c.id === id);
}
