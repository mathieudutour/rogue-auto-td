/**
 * Meta progression system for roguelike runs.
 *
 * - Souls: currency earned per run based on waves survived
 * - Upgrades: permanent stat boosts purchased with souls
 * - Blessings: pick-one-of-three positive modifiers at run start
 * - Curses: optional hard-mode modifiers for bonus souls
 */

// ── Permanent Upgrades ───────────────────────────────

export interface MetaUpgrade {
  id: string;
  name: string;
  description: string;       // shown per-level with {value}
  maxLevel: number;
  costPerLevel: number[];    // souls cost for each level (length === maxLevel)
  icon: string;              // emoji/label for UI
}

export const META_UPGRADES: MetaUpgrade[] = [
  {
    id: 'starting_gold',
    name: 'Stockpile',
    description: '+{value}g starting gold',
    maxLevel: 5,
    costPerLevel: [20, 40, 80, 150, 300],
    icon: 'G',
  },
  {
    id: 'interest_rate',
    name: 'Investor',
    description: '+{value}g max interest',
    maxLevel: 3,
    costPerLevel: [50, 120, 250],
    icon: '%',
  },
  {
    id: 'reroll_discount',
    name: 'Haggler',
    description: 'Reroll costs {value}g less',
    maxLevel: 1,
    costPerLevel: [200],
    icon: 'R',
  },
  {
    id: 'free_reroll',
    name: 'Fresh Stock',
    description: '{value} free reroll(s) per round',
    maxLevel: 2,
    costPerLevel: [60, 180],
    icon: 'F',
  },
  {
    id: 'starting_xp',
    name: 'Veteran',
    description: '+{value} XP at game start',
    maxLevel: 3,
    costPerLevel: [40, 100, 200],
    icon: 'X',
  },
  {
    id: 'item_luck',
    name: 'Treasure Hunter',
    description: '+{value}% chance for bonus component drop',
    maxLevel: 3,
    costPerLevel: [30, 80, 180],
    icon: 'I',
  },
  {
    id: 'starting_lives',
    name: 'Fortification',
    description: '+{value} starting lives',
    maxLevel: 3,
    costPerLevel: [40, 100, 220],
    icon: 'L',
  },
  {
    id: 'soul_bonus',
    name: 'Soul Reaper',
    description: '+{value}% souls earned per run',
    maxLevel: 3,
    costPerLevel: [60, 150, 350],
    icon: 'S',
  },
];

/** Get the effective value of an upgrade at a given level */
export function getUpgradeValue(upgradeId: string, level: number): number {
  if (level <= 0) return 0;
  switch (upgradeId) {
    case 'starting_gold': return level * 2;         // +2/4/6/8/10g
    case 'interest_rate': return level;              // +1/2/3g max interest
    case 'reroll_discount': return level;            // -1g reroll cost
    case 'free_reroll': return level;                // 1/2 free rerolls
    case 'starting_xp': return level * 4;            // +4/8/12 XP
    case 'item_luck': return level * 15;             // +15/30/45%
    case 'starting_lives': return level * 3;         // +3/6/9 lives
    case 'soul_bonus': return level * 10;            // +10/20/30%
    default: return 0;
  }
}

// ── Blessings (pick 1 of 3 at run start) ─────────────

export interface Blessing {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic';
}

export const BLESSINGS: Blessing[] = [
  // Common
  { id: 'fire_affinity', name: 'Fire Affinity', description: 'Fire champions deal +15% damage', rarity: 'common' },
  { id: 'ice_affinity', name: 'Ice Affinity', description: 'Ice champions attack 15% faster', rarity: 'common' },
  { id: 'nature_affinity', name: 'Nature Affinity', description: 'Nature champions gain +20 range', rarity: 'common' },
  { id: 'shadow_affinity', name: 'Shadow Affinity', description: 'Shadow champions gain +15% crit chance', rarity: 'common' },
  { id: 'lightning_affinity', name: 'Lightning Affinity', description: 'Lightning champions attack 15% faster', rarity: 'common' },
  { id: 'void_affinity', name: 'Void Affinity', description: 'Void champions deal +15% damage', rarity: 'common' },
  { id: 'arcane_affinity', name: 'Arcane Affinity', description: 'Arcane champions gain +15 range and +10% dmg', rarity: 'common' },
  { id: 'gold_rush', name: 'Gold Rush', description: '+2g income per wave', rarity: 'common' },
  { id: 'item_cache', name: 'Item Cache', description: 'Start with 2 random item components', rarity: 'common' },

  // Rare
  { id: 'warrior_might', name: 'Warrior Might', description: 'Warriors deal +20% damage', rarity: 'rare' },
  { id: 'ranger_precision', name: 'Ranger Precision', description: 'Rangers gain +30 range', rarity: 'rare' },
  { id: 'mage_power', name: 'Mage Power', description: 'Mages deal +20% damage', rarity: 'rare' },
  { id: 'assassin_edge', name: 'Assassin Edge', description: 'Assassins gain +20% crit and 2.0x crit mult', rarity: 'rare' },
  { id: 'guardian_wall', name: 'Guardian Wall', description: 'Guardians gain +25 range and +10% damage', rarity: 'rare' },
  { id: 'early_bird', name: 'Early Bird', description: 'Start at level 3', rarity: 'rare' },
  { id: 'merchant', name: 'Merchant', description: 'Shop has 6 slots instead of 5', rarity: 'rare' },

  // Epic
  { id: 'double_drop', name: 'Double Drop', description: 'Item drop waves give 2x components', rarity: 'epic' },
  { id: 'all_for_one', name: 'All For One', description: 'All champions gain +8% damage and +8% AS', rarity: 'epic' },
  { id: 'lucky_rolls', name: 'Lucky Rolls', description: 'Shop odds shift one tier higher', rarity: 'epic' },
];

// ── Curses (optional hard mode for bonus souls) ──────

export interface Curse {
  id: string;
  name: string;
  description: string;
  soulMultiplier: number;  // e.g. 1.25 = +25% souls
}

export const CURSES: Curse[] = [
  { id: 'fragile', name: 'Fragile', description: '-5 starting lives', soulMultiplier: 1.25 },
  { id: 'inflation', name: 'Inflation', description: 'Rerolls cost +1g', soulMultiplier: 1.20 },
  { id: 'famine', name: 'Famine', description: '-2g income per wave', soulMultiplier: 1.30 },
  { id: 'no_interest', name: 'Poverty', description: 'No interest income', soulMultiplier: 1.35 },
  { id: 'armored_foes', name: 'Armored Foes', description: 'Enemies have +25% HP', soulMultiplier: 1.40 },
  { id: 'slow_learner', name: 'Slow Learner', description: 'Passive XP gain halved', soulMultiplier: 1.20 },
];

// ── Souls Calculation ────────────────────────────────

/** Calculate souls earned from a run */
export function calculateSoulsEarned(waveSurvived: number, soulBonusPercent: number, curseMultiplier: number): number {
  // Base: 2 souls per wave + bonus for milestones
  let souls = waveSurvived * 2;
  if (waveSurvived >= 10) souls += 10;
  if (waveSurvived >= 20) souls += 25;
  if (waveSurvived >= 30) souls += 50;
  if (waveSurvived >= 40) souls += 100;

  // Apply soul bonus from meta upgrade
  souls = Math.floor(souls * (1 + soulBonusPercent / 100));

  // Apply curse multiplier
  souls = Math.floor(souls * curseMultiplier);

  return souls;
}

// ── Run Configuration ────────────────────────────────

export interface RunConfig {
  blessing: Blessing | null;
  curses: Curse[];
}
