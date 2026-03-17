/**
 * TFT-style item system:
 * - 8 base components with small stat bonuses
 * - Combine any 2 components to create a completed item
 * - Each champion can hold up to 3 items
 * - Selling a champion returns its items to inventory
 */

export interface ItemStats {
  damage?: number;          // flat bonus damage
  attackSpeed?: number;     // flat bonus attacks/sec
  range?: number;           // flat bonus range
  critChance?: number;      // 0-1
  critMult?: number;        // multiplier on crit
  splashFrac?: number;      // fraction of damage dealt as splash
  splashRadius?: number;    // splash area
  slowAmount?: number;      // slow multiplier on hit (0.5 = 50% slow)
  slowDuration?: number;    // slow duration
  burnDamage?: number;      // DoT damage per tick on hit
  burnDuration?: number;    // DoT duration
  bonusGoldOnKill?: number; // extra gold per kill
  damageMult?: number;      // multiplicative damage bonus
}

export interface ComponentData {
  id: string;
  name: string;
  description: string;
  color: number;       // for texture generation
  stats: ItemStats;
}

export interface CombinedItemData {
  id: string;
  name: string;
  description: string;
  recipe: [string, string];  // two component IDs
  color: number;
  stats: ItemStats;
}

// ── 8 Base Components ─────────────────────────────────

export const COMPONENTS: ComponentData[] = [
  {
    id: 'bf_sword',
    name: 'B.F. Sword',
    description: '+10 damage',
    color: 0xcc4444,
    stats: { damage: 10 },
  },
  {
    id: 'recurve_bow',
    name: 'Recurve Bow',
    description: '+15% attack speed',
    color: 0x44cc44,
    stats: { attackSpeed: 0.15 },
  },
  {
    id: 'chain_vest',
    name: 'Chain Vest',
    description: '+5 damage, +10 range',
    color: 0xccaa44,
    stats: { damage: 5, range: 10 },
  },
  {
    id: 'negatron_cloak',
    name: 'Negatron Cloak',
    description: '+20 range',
    color: 0x4488cc,
    stats: { range: 20 },
  },
  {
    id: 'needlessly_rod',
    name: 'Needlessly Rod',
    description: '+10% damage',
    color: 0x9944cc,
    stats: { damageMult: 0.10 },
  },
  {
    id: 'tear',
    name: 'Tear of Goddess',
    description: '+10% attack speed',
    color: 0x4466dd,
    stats: { attackSpeed: 0.10 },
  },
  {
    id: 'giants_belt',
    name: "Giant's Belt",
    description: '+8 damage',
    color: 0xcc6622,
    stats: { damage: 8 },
  },
  {
    id: 'sparring_gloves',
    name: 'Sparring Gloves',
    description: '+10% crit chance',
    color: 0xdddddd,
    stats: { critChance: 0.10 },
  },
];

// ── Combined Items (2 components → 1 item) ────────────

export const COMBINED_ITEMS: CombinedItemData[] = [
  // BF Sword combinations
  {
    id: 'infinity_edge',
    name: 'Infinity Edge',
    recipe: ['bf_sword', 'sparring_gloves'],
    description: '+25 dmg, +30% crit, 2.5x crit dmg',
    color: 0xff2244,
    stats: { damage: 25, critChance: 0.30, critMult: 2.5 },
  },
  {
    id: 'bloodthirster',
    name: 'Bloodthirster',
    recipe: ['bf_sword', 'negatron_cloak'],
    description: '+20 dmg, +25 range',
    color: 0xcc2244,
    stats: { damage: 20, range: 25 },
  },
  {
    id: 'giant_slayer',
    name: 'Giant Slayer',
    recipe: ['bf_sword', 'recurve_bow'],
    description: '+15 dmg, +20% attack speed',
    color: 0xee5522,
    stats: { damage: 15, attackSpeed: 0.20 },
  },
  {
    id: 'deathblade',
    name: 'Deathblade',
    recipe: ['bf_sword', 'bf_sword'],
    description: '+40 damage',
    color: 0xaa0000,
    stats: { damage: 40 },
  },
  {
    id: 'hextech_gunblade',
    name: 'Hextech Gunblade',
    recipe: ['bf_sword', 'needlessly_rod'],
    description: '+15 dmg, +20% damage',
    color: 0xcc44cc,
    stats: { damage: 15, damageMult: 0.20 },
  },

  {
    id: 'zeals_edge',
    name: "Zeal's Edge",
    recipe: ['bf_sword', 'chain_vest'],
    description: '+20 dmg, +15 range, 15% splash (30px)',
    color: 0xcc8833,
    stats: { damage: 20, range: 15, splashFrac: 0.15, splashRadius: 30 },
  },
  {
    id: 'shojin',
    name: 'Spear of Shojin',
    recipe: ['bf_sword', 'tear'],
    description: '+18 dmg, +15% AS',
    color: 0x8844cc,
    stats: { damage: 18, attackSpeed: 0.15 },
  },
  {
    id: 'titans_resolve',
    name: "Titan's Resolve",
    recipe: ['bf_sword', 'giants_belt'],
    description: '+30 dmg, +10% AS',
    color: 0xcc5533,
    stats: { damage: 30, attackSpeed: 0.10 },
  },

  // Recurve Bow combinations
  {
    id: 'rapid_firecannon',
    name: 'Rapid Firecannon',
    description: '+40% attack speed, +30 range',
    recipe: ['recurve_bow', 'recurve_bow'],
    color: 0x22cc22,
    stats: { attackSpeed: 0.40, range: 30 },
  },
  {
    id: 'runaans_hurricane',
    name: "Runaan's Hurricane",
    description: '+25% AS, 25% splash in 40px',
    recipe: ['recurve_bow', 'negatron_cloak'],
    color: 0x22aacc,
    stats: { attackSpeed: 0.25, splashFrac: 0.25, splashRadius: 40 },
  },
  {
    id: 'guinsoos_rageblade',
    name: "Guinsoo's Rageblade",
    description: '+30% AS, +15% damage',
    recipe: ['recurve_bow', 'needlessly_rod'],
    color: 0xcc22cc,
    stats: { attackSpeed: 0.30, damageMult: 0.15 },
  },
  {
    id: 'statikk_shiv',
    name: 'Statikk Shiv',
    description: '+20% AS, burn 6 dmg/tick in 50px',
    recipe: ['recurve_bow', 'tear'],
    color: 0xcccc22,
    stats: { attackSpeed: 0.20, burnDamage: 6, burnDuration: 2.0 },
  },

  {
    id: 'titans_bow',
    name: "Titan's Bow",
    recipe: ['recurve_bow', 'chain_vest'],
    description: '+8 dmg, +20% AS, +15 range',
    color: 0x88aa44,
    stats: { damage: 8, attackSpeed: 0.20, range: 15 },
  },

  // Chain Vest combinations
  {
    id: 'bramble_vest',
    name: 'Bramble Vest',
    description: '+15 dmg, 20% splash in 40px',
    recipe: ['chain_vest', 'chain_vest'],
    color: 0xbbaa22,
    stats: { damage: 15, splashFrac: 0.20, splashRadius: 40 },
  },
  {
    id: 'frozen_heart',
    name: 'Frozen Heart',
    description: '+10 dmg, slow 40% for 1.5s',
    recipe: ['chain_vest', 'tear'],
    color: 0x4488bb,
    stats: { damage: 10, slowAmount: 0.6, slowDuration: 1.5 },
  },
  {
    id: 'gargoyle_stoneplate',
    name: 'Gargoyle Plate',
    description: '+10 dmg, +30 range',
    recipe: ['chain_vest', 'negatron_cloak'],
    color: 0x888899,
    stats: { damage: 10, range: 30 },
  },

  {
    id: 'protectors_vow',
    name: "Protector's Vow",
    recipe: ['chain_vest', 'needlessly_rod'],
    description: '+10 dmg, +15% dmg, +10 range',
    color: 0x9988aa,
    stats: { damage: 10, damageMult: 0.15, range: 10 },
  },
  {
    id: 'edge_of_night',
    name: 'Edge of Night',
    recipe: ['chain_vest', 'sparring_gloves'],
    description: '+8 dmg, +15% crit, 1.8x crit, +10 range',
    color: 0xbbbb88,
    stats: { damage: 8, critChance: 0.15, critMult: 1.8, range: 10 },
  },

  // Negatron combinations
  {
    id: 'quicksilver',
    name: 'Quicksilver',
    description: '+35 range, +10% AS',
    recipe: ['negatron_cloak', 'negatron_cloak'],
    color: 0x66aadd,
    stats: { range: 35, attackSpeed: 0.10 },
  },

  {
    id: 'chalice_of_power',
    name: 'Chalice of Power',
    recipe: ['negatron_cloak', 'tear'],
    description: '+25 range, +15% AS',
    color: 0x5599cc,
    stats: { range: 25, attackSpeed: 0.15 },
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    recipe: ['negatron_cloak', 'giants_belt'],
    description: '+10 dmg, +25 range, slow 30% for 1s',
    color: 0x66bbaa,
    stats: { damage: 10, range: 25, slowAmount: 0.7, slowDuration: 1.0 },
  },
  {
    id: 'steadfast_heart',
    name: 'Steadfast Heart',
    recipe: ['negatron_cloak', 'sparring_gloves'],
    description: '+25 range, +15% crit, 1.8x crit dmg',
    color: 0x88ccdd,
    stats: { range: 25, critChance: 0.15, critMult: 1.8 },
  },

  // Needlessly Rod combinations
  {
    id: 'rabadons_deathcap',
    name: "Rabadon's Deathcap",
    description: '+40% damage',
    recipe: ['needlessly_rod', 'needlessly_rod'],
    color: 0x7722cc,
    stats: { damageMult: 0.40 },
  },
  {
    id: 'ionic_spark',
    name: 'Ionic Spark',
    description: '+15% dmg, +15 range, burn 5/tick',
    recipe: ['needlessly_rod', 'negatron_cloak'],
    color: 0x6644dd,
    stats: { damageMult: 0.15, range: 15, burnDamage: 5, burnDuration: 2.0 },
  },
  {
    id: 'morellos',
    name: "Morellonomicon",
    description: '+20% dmg, burn 8 dmg/tick for 3s',
    recipe: ['needlessly_rod', 'giants_belt'],
    color: 0xaa22aa,
    stats: { damageMult: 0.20, burnDamage: 8, burnDuration: 3.0 },
  },

  {
    id: 'archangels_staff',
    name: "Archangel's Staff",
    recipe: ['needlessly_rod', 'tear'],
    description: '+20% dmg, +15% AS',
    color: 0x7744bb,
    stats: { damageMult: 0.20, attackSpeed: 0.15 },
  },

  // Tear combinations
  {
    id: 'blue_buff',
    name: 'Blue Buff',
    description: '+25% attack speed',
    recipe: ['tear', 'tear'],
    color: 0x2244cc,
    stats: { attackSpeed: 0.25 },
  },

  {
    id: 'redemption',
    name: 'Redemption',
    recipe: ['tear', 'giants_belt'],
    description: '+10 dmg, +15% AS, +1 gold on kill',
    color: 0x88aa66,
    stats: { damage: 10, attackSpeed: 0.15, bonusGoldOnKill: 1 },
  },

  // Giant's Belt combinations
  {
    id: 'warmogs',
    name: "Warmog's Might",
    description: '+20 damage, +10% AS',
    recipe: ['giants_belt', 'giants_belt'],
    color: 0xcc4400,
    stats: { damage: 20, attackSpeed: 0.10 },
  },
  {
    id: 'zekes_herald',
    name: "Zeke's Herald",
    description: '+12 dmg, +20% AS',
    recipe: ['giants_belt', 'recurve_bow'],
    color: 0xcc8844,
    stats: { damage: 12, attackSpeed: 0.20 },
  },
  {
    id: 'sunfire_cape',
    name: 'Sunfire Cape',
    description: '+10 dmg, burn 10/tick in 60px',
    recipe: ['giants_belt', 'chain_vest'],
    color: 0xff6600,
    stats: { damage: 10, burnDamage: 10, burnDuration: 2.5 },
  },

  {
    id: 'guardbreaker',
    name: 'Guardbreaker',
    recipe: ['giants_belt', 'sparring_gloves'],
    description: '+12 dmg, +15% crit, 1.8x crit dmg',
    color: 0xcc9966,
    stats: { damage: 12, critChance: 0.15, critMult: 1.8 },
  },

  // Sparring Gloves combinations
  {
    id: 'jeweled_gauntlet',
    name: 'Jeweled Gauntlet',
    description: '+20% crit, 2x crit dmg, +10% dmg',
    recipe: ['sparring_gloves', 'needlessly_rod'],
    color: 0xaa44dd,
    stats: { critChance: 0.20, critMult: 2.0, damageMult: 0.10 },
  },
  {
    id: 'thiefs_gloves',
    name: "Thief's Gloves",
    description: '+15% crit, +15% AS, +1g on kill',
    recipe: ['sparring_gloves', 'sparring_gloves'],
    color: 0xeeeeee,
    stats: { critChance: 0.15, attackSpeed: 0.15, bonusGoldOnKill: 1 },
  },
  {
    id: 'hand_of_justice',
    name: 'Hand of Justice',
    description: '+15% crit, +15 dmg, +10% AS',
    recipe: ['sparring_gloves', 'tear'],
    color: 0xccddcc,
    stats: { critChance: 0.15, damage: 15, attackSpeed: 0.10 },
  },
  {
    id: 'last_whisper',
    name: 'Last Whisper',
    description: '+20% crit, +10 damage, 2x crit dmg',
    recipe: ['sparring_gloves', 'recurve_bow'],
    color: 0xddcc88,
    stats: { critChance: 0.20, damage: 10, critMult: 2.0 },
  },
];

// ── Helpers ────────────────────────────────────────────

export function getComponentById(id: string): ComponentData | undefined {
  return COMPONENTS.find(c => c.id === id);
}

export function getCombinedItemById(id: string): CombinedItemData | undefined {
  return COMBINED_ITEMS.find(i => i.id === id);
}

/** Given two component IDs, find the combined item (order-independent) */
export function findCombinedItem(comp1Id: string, comp2Id: string): CombinedItemData | undefined {
  return COMBINED_ITEMS.find(
    i =>
      (i.recipe[0] === comp1Id && i.recipe[1] === comp2Id) ||
      (i.recipe[0] === comp2Id && i.recipe[1] === comp1Id),
  );
}

/** A held item can be either a component or a combined item */
export interface HeldItem {
  isComponent: boolean;
  componentId?: string;    // set if isComponent
  combinedId?: string;     // set if !isComponent
}

export function getHeldItemName(item: HeldItem): string {
  if (item.isComponent) {
    return getComponentById(item.componentId!)?.name ?? '???';
  }
  return getCombinedItemById(item.combinedId!)?.name ?? '???';
}

export function getHeldItemStats(item: HeldItem): ItemStats {
  if (item.isComponent) {
    return getComponentById(item.componentId!)?.stats ?? {};
  }
  return getCombinedItemById(item.combinedId!)?.stats ?? {};
}

export function getHeldItemColor(item: HeldItem): number {
  if (item.isComponent) {
    return getComponentById(item.componentId!)?.color ?? 0xcccccc;
  }
  return getCombinedItemById(item.combinedId!)?.color ?? 0xcccccc;
}

export function getHeldItemDescription(item: HeldItem): string {
  if (item.isComponent) {
    return getComponentById(item.componentId!)?.description ?? '';
  }
  return getCombinedItemById(item.combinedId!)?.description ?? '';
}

export const MAX_ITEMS_PER_CHAMPION = 3;
