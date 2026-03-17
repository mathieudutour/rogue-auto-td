export type UltimateType =
  | 'aoe_damage'      // Deal damage to all enemies in range
  | 'meteor'          // Deal massive damage in a small area around target
  | 'freeze_all'      // Freeze all enemies in range
  | 'stun_aoe'        // Stun all enemies in range
  | 'poison_cloud'    // Apply heavy DoT to all enemies in range
  | 'ally_boost'      // Boost all allies' attack speed temporarily
  | 'chain_nova'      // Chain lightning to many enemies
  | 'snipe'           // Deal massive single-target damage
  | 'gold_rush'       // Kill target and gain bonus gold
  | 'heal_wave';      // Restore mana to all allies (refill partial)

export interface UltimateData {
  name: string;
  type: UltimateType;
  description: string;
  manaCost: number;        // mana required to cast
  damage?: number;         // damage dealt (for damage ults)
  radius?: number;         // AoE radius (for area ults)
  duration?: number;       // effect duration in seconds
  value?: number;          // generic value (e.g. AS multiplier, gold amount)
}

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
    manaMax: number;        // total mana pool
  };
  ultimate: UltimateData;
}

export const CHAMPIONS: ChampionData[] = [
  // ── Cost 1 ──────────────────────────────────────────
  {
    id: 'flame_grunt',
    name: 'Flame Grunt',
    cost: 1,
    traits: ['fire', 'warrior'],
    textureKey: 'champion_fire_warrior',
    stats: { damage: 15, range: 80, attackSpeed: 0.8, manaMax: 60 },
    ultimate: { name: 'Flame Slam', type: 'aoe_damage', description: 'Deal damage to all enemies in range', manaCost: 60, damage: 40, radius: 80 },
  },
  {
    id: 'frost_archer',
    name: 'Frost Archer',
    cost: 1,
    traits: ['ice', 'ranger'],
    textureKey: 'champion_ice_ranger',
    stats: { damage: 10, range: 130, attackSpeed: 1.0, manaMax: 70 },
    ultimate: { name: 'Ice Volley', type: 'freeze_all', description: 'Freeze all enemies in range for 2s', manaCost: 70, radius: 130, duration: 2.0 },
  },
  {
    id: 'vine_fighter',
    name: 'Vine Fighter',
    cost: 1,
    traits: ['nature', 'warrior'],
    textureKey: 'champion_nature_warrior',
    stats: { damage: 8, range: 80, attackSpeed: 0.9, manaMax: 50 },
    ultimate: { name: 'Vine Lash', type: 'poison_cloud', description: 'Poison all enemies in range', manaCost: 50, radius: 80, damage: 8, duration: 4.0 },
  },
  {
    id: 'arcane_sentinel',
    name: 'Arcane Sentinel',
    cost: 1,
    traits: ['arcane', 'guardian'],
    textureKey: 'champion_arcane_guardian',
    stats: { damage: 12, range: 100, attackSpeed: 0.8, manaMax: 80 },
    ultimate: { name: 'Arcane Surge', type: 'ally_boost', description: 'Boost all allies attack speed by 40% for 4s', manaCost: 80, duration: 4.0, value: 0.4 },
  },
  {
    id: 'shadow_scout',
    name: 'Shadow Scout',
    cost: 1,
    traits: ['shadow', 'ranger'],
    textureKey: 'champion_shadow_ranger',
    stats: { damage: 13, range: 120, attackSpeed: 1.1, manaMax: 60 },
    ultimate: { name: 'Shadow Strike', type: 'snipe', description: 'Deal massive damage to current target', manaCost: 60, damage: 100 },
  },

  // ── Cost 2 ──────────────────────────────────────────
  {
    id: 'fire_mage',
    name: 'Fire Mage',
    cost: 2,
    traits: ['fire', 'mage'],
    textureKey: 'champion_fire_mage',
    stats: { damage: 25, range: 110, attackSpeed: 0.6, manaMax: 80 },
    ultimate: { name: 'Meteor', type: 'meteor', description: 'Hurl a meteor dealing massive AoE damage', manaCost: 80, damage: 120, radius: 60 },
  },
  {
    id: 'ice_mage',
    name: 'Ice Mage',
    cost: 2,
    traits: ['ice', 'mage'],
    textureKey: 'champion_ice_mage',
    stats: { damage: 18, range: 120, attackSpeed: 0.7, manaMax: 75 },
    ultimate: { name: 'Blizzard', type: 'freeze_all', description: 'Freeze all enemies in range for 2.5s', manaCost: 75, radius: 120, duration: 2.5 },
  },
  {
    id: 'leaf_ranger',
    name: 'Leaf Ranger',
    cost: 2,
    traits: ['nature', 'ranger'],
    textureKey: 'champion_nature_ranger',
    stats: { damage: 12, range: 140, attackSpeed: 1.1, manaMax: 65 },
    ultimate: { name: 'Thorn Barrage', type: 'poison_cloud', description: 'Poison all enemies in range', manaCost: 65, radius: 140, damage: 10, duration: 4.0 },
  },
  {
    id: 'arcane_mage',
    name: 'Arcane Mage',
    cost: 2,
    traits: ['arcane', 'mage'],
    textureKey: 'champion_arcane_mage',
    stats: { damage: 22, range: 115, attackSpeed: 0.65, manaMax: 85 },
    ultimate: { name: 'Arcane Barrage', type: 'chain_nova', description: 'Chain lightning hits 6 enemies', manaCost: 85, damage: 60, value: 6 },
  },
  {
    id: 'fire_guardian',
    name: 'Ember Guardian',
    cost: 2,
    traits: ['fire', 'guardian'],
    textureKey: 'champion_fire_guardian',
    stats: { damage: 16, range: 85, attackSpeed: 0.6, manaMax: 90 },
    ultimate: { name: 'Ember Shield', type: 'ally_boost', description: 'Boost all allies attack speed by 50% for 4s', manaCost: 90, duration: 4.0, value: 0.5 },
  },

  // ── Cost 3 ──────────────────────────────────────────
  {
    id: 'shadow_blade',
    name: 'Shadow Blade',
    cost: 3,
    traits: ['shadow', 'assassin'],
    textureKey: 'champion_shadow_assassin',
    stats: { damage: 40, range: 70, attackSpeed: 1.3, manaMax: 50 },
    ultimate: { name: 'Death Mark', type: 'snipe', description: 'Deal massive damage to target', manaCost: 50, damage: 200 },
  },
  {
    id: 'shadow_caster',
    name: 'Shadow Caster',
    cost: 3,
    traits: ['shadow', 'mage'],
    textureKey: 'champion_shadow_mage',
    stats: { damage: 35, range: 120, attackSpeed: 0.5, manaMax: 90 },
    ultimate: { name: 'Dark Nova', type: 'chain_nova', description: 'Chain lightning hits 8 enemies', manaCost: 90, damage: 80, value: 8 },
  },
  {
    id: 'storm_warden',
    name: 'Storm Warden',
    cost: 3,
    traits: ['arcane', 'warrior'],
    textureKey: 'champion_arcane_warrior',
    stats: { damage: 28, range: 85, attackSpeed: 0.85, manaMax: 70 },
    ultimate: { name: 'Thunderclap', type: 'stun_aoe', description: 'Stun all enemies in range for 2s', manaCost: 70, radius: 85, duration: 2.0 },
  },
  {
    id: 'thorn_guardian',
    name: 'Thorn Guardian',
    cost: 3,
    traits: ['nature', 'guardian'],
    textureKey: 'champion_nature_guardian',
    stats: { damage: 25, range: 95, attackSpeed: 0.75, manaMax: 100 },
    ultimate: { name: 'Rejuvenate', type: 'heal_wave', description: 'Restore 30 mana to all allies', manaCost: 100, value: 30 },
  },
  {
    id: 'ice_assassin',
    name: 'Frost Fang',
    cost: 3,
    traits: ['ice', 'assassin'],
    textureKey: 'champion_ice_assassin',
    stats: { damage: 35, range: 75, attackSpeed: 1.2, manaMax: 55 },
    ultimate: { name: 'Shatter Strike', type: 'snipe', description: 'Deal massive damage to target', manaCost: 55, damage: 180 },
  },

  // ── Cost 4 ──────────────────────────────────────────
  {
    id: 'inferno_assassin',
    name: 'Inferno Assassin',
    cost: 4,
    traits: ['fire', 'assassin'],
    textureKey: 'champion_fire_assassin',
    stats: { damage: 55, range: 80, attackSpeed: 1.5, manaMax: 60 },
    ultimate: { name: 'Inferno Burst', type: 'meteor', description: 'Massive fire explosion around target', manaCost: 60, damage: 250, radius: 70 },
  },
  {
    id: 'glacier_knight',
    name: 'Glacier Knight',
    cost: 4,
    traits: ['ice', 'warrior'],
    textureKey: 'champion_ice_warrior',
    stats: { damage: 28, range: 90, attackSpeed: 0.7, manaMax: 80 },
    ultimate: { name: 'Glacial Prison', type: 'freeze_all', description: 'Freeze all enemies in range for 3s', manaCost: 80, radius: 90, duration: 3.0 },
  },
  {
    id: 'nature_assassin',
    name: 'Venom Stalker',
    cost: 4,
    traits: ['nature', 'assassin'],
    textureKey: 'champion_nature_assassin',
    stats: { damage: 35, range: 75, attackSpeed: 1.4, manaMax: 55 },
    ultimate: { name: 'Venom Nova', type: 'poison_cloud', description: 'Deadly poison to all enemies in range', manaCost: 55, radius: 75, damage: 18, duration: 5.0 },
  },
  {
    id: 'arcane_ranger',
    name: 'Arcane Sniper',
    cost: 4,
    traits: ['arcane', 'ranger'],
    textureKey: 'champion_arcane_ranger',
    stats: { damage: 35, range: 170, attackSpeed: 0.9, manaMax: 70 },
    ultimate: { name: 'Arcane Bolt', type: 'snipe', description: 'Deal massive damage to target', manaCost: 70, damage: 300 },
  },

  // ── Cost 5 ──────────────────────────────────────────
  {
    id: 'phoenix_lord',
    name: 'Phoenix Lord',
    cost: 5,
    traits: ['fire', 'guardian'],
    textureKey: 'champion_fire_legendary',
    stats: { damage: 55, range: 100, attackSpeed: 0.8, manaMax: 100 },
    ultimate: { name: 'Rebirth Flame', type: 'aoe_damage', description: 'Deal massive damage to all enemies in range and boost allies', manaCost: 100, damage: 200, radius: 100 },
  },
  {
    id: 'void_reaper',
    name: 'Void Reaper',
    cost: 5,
    traits: ['shadow', 'assassin'],
    textureKey: 'champion_shadow_legendary',
    stats: { damage: 65, range: 85, attackSpeed: 1.3, manaMax: 50 },
    ultimate: { name: 'Reap', type: 'gold_rush', description: 'Execute target enemy and gain 3 gold', manaCost: 50, damage: 500, value: 3 },
  },
  {
    id: 'frost_queen',
    name: 'Frost Queen',
    cost: 5,
    traits: ['ice', 'mage'],
    textureKey: 'champion_ice_legendary',
    stats: { damage: 45, range: 150, attackSpeed: 0.8, manaMax: 90 },
    ultimate: { name: 'Absolute Zero', type: 'freeze_all', description: 'Freeze ALL enemies on the map for 3s', manaCost: 90, radius: 9999, duration: 3.0 },
  },
  {
    id: 'elder_treant',
    name: 'Elder Treant',
    cost: 5,
    traits: ['nature', 'guardian'],
    textureKey: 'champion_nature_legendary',
    stats: { damage: 30, range: 95, attackSpeed: 0.6, manaMax: 120 },
    ultimate: { name: 'World Tree', type: 'heal_wave', description: 'Restore 50 mana to all allies and boost AS 60% for 5s', manaCost: 120, value: 50, duration: 5.0 },
  },
];

export function getChampionById(id: string): ChampionData | undefined {
  return CHAMPIONS.find(c => c.id === id);
}
