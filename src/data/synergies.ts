export interface SynergyTier {
  count: number;
  description: string;
  bonuses: {
    damageMult?: number;     // multiplicative bonus to damage
    attackSpeedMult?: number; // multiplicative bonus to attack speed
    rangeMult?: number;       // multiplicative bonus to range
    // Game-changing max-tier effects
    critChance?: number;      // chance (0-1) to deal critical hit
    critMult?: number;        // critical damage multiplier
    multishot?: number;       // fire N extra projectiles at nearby targets
    executeThreshold?: number; // instantly kill enemies below this HP %
    burnOnHit?: number;       // apply AoE burn: damage per tick around target
    burnRadius?: number;      // radius of burn AoE
    freezeChance?: number;    // chance to freeze (full stop) on hit
    freezeDuration?: number;  // freeze duration in seconds
    splashOnHit?: boolean;    // all attacks gain splash
    splashRadius?: number;    // splash radius for splashOnHit
    splashFrac?: number;      // splash damage fraction
    bonusGoldOnKill?: number; // extra gold per kill
    allAllies?: boolean;      // apply stat bonuses to ALL placed allies
    damageReflect?: number;   // fraction of incoming damage reflected
  };
}

export interface SynergyData {
  id: string;
  name: string;
  description: string;
  tiers: SynergyTier[];
}

export const SYNERGIES: SynergyData[] = [
  // ── Element synergies ──────────────────────────────
  {
    id: 'fire',
    name: 'Fire',
    description: 'Fire champions deal bonus damage. Max: attacks ignite all nearby enemies',
    tiers: [
      { count: 2, description: '+25% damage', bonuses: { damageMult: 1.25 } },
      { count: 4, description: '+60% damage', bonuses: { damageMult: 1.6 } },
      {
        count: 6,
        description: 'INFERNO: +80% dmg, attacks burn all enemies in a radius',
        bonuses: { damageMult: 1.8, burnOnHit: 8, burnRadius: 60 },
      },
    ],
  },
  {
    id: 'ice',
    name: 'Ice',
    description: 'Ice champions gain range and slow enemies. Max: freeze enemies solid',
    tiers: [
      { count: 2, description: '+25% range, +10% AS', bonuses: { rangeMult: 1.25, attackSpeedMult: 1.1 } },
      { count: 4, description: '+45% range, +20% AS', bonuses: { rangeMult: 1.45, attackSpeedMult: 1.2 } },
      {
        count: 6,
        description: 'PERMAFROST: +55% range, +30% AS, 35% chance to freeze for 1.5s',
        bonuses: { rangeMult: 1.55, attackSpeedMult: 1.3, freezeChance: 0.35, freezeDuration: 1.5 },
      },
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Nature champions attack faster. Max: gain bonus gold on kills',
    tiers: [
      { count: 2, description: '+20% attack speed', bonuses: { attackSpeedMult: 1.2 } },
      { count: 4, description: '+50% attack speed', bonuses: { attackSpeedMult: 1.5 } },
      {
        count: 6,
        description: 'OVERGROWTH: +70% AS, +30% dmg, +1 gold per kill',
        bonuses: { attackSpeedMult: 1.7, damageMult: 1.3, bonusGoldOnKill: 1 },
      },
    ],
  },
  {
    id: 'shadow',
    name: 'Shadow',
    description: 'Shadow champions deal massive damage. Max: execute low HP enemies',
    tiers: [
      { count: 2, description: '+30% damage', bonuses: { damageMult: 1.3 } },
      { count: 4, description: '+75% damage', bonuses: { damageMult: 1.75 } },
      {
        count: 6,
        description: 'REAPER: +100% dmg, execute enemies below 15% HP',
        bonuses: { damageMult: 2.0, executeThreshold: 0.15 },
      },
    ],
  },
  {
    id: 'arcane',
    name: 'Arcane',
    description: 'Arcane champions gain damage and range. Max: buff ALL allies',
    tiers: [
      { count: 2, description: '+20% damage, +20% range', bonuses: { damageMult: 1.2, rangeMult: 1.2 } },
      {
        count: 4,
        description: 'ARCANUM: +40% dmg, +35% range, +15% AS to ALL allies',
        bonuses: { damageMult: 1.4, rangeMult: 1.35, attackSpeedMult: 1.15, allAllies: true },
      },
    ],
  },

  // ── Class synergies ────────────────────────────────
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Warriors deal more damage. Max: reflect damage back to attackers',
    tiers: [
      { count: 2, description: '+20% damage', bonuses: { damageMult: 1.2 } },
      { count: 4, description: '+45% damage, +15% AS', bonuses: { damageMult: 1.45, attackSpeedMult: 1.15 } },
      {
        count: 6,
        description: 'BULWARK: +70% dmg, +25% AS, reflect 25% damage',
        bonuses: { damageMult: 1.7, attackSpeedMult: 1.25, damageReflect: 0.25 },
      },
    ],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Rangers attack faster and farther. Max: fire double projectiles',
    tiers: [
      { count: 2, description: '+15% AS, +10% range', bonuses: { attackSpeedMult: 1.15, rangeMult: 1.1 } },
      { count: 3, description: '+30% AS, +20% range', bonuses: { attackSpeedMult: 1.3, rangeMult: 1.2 } },
      {
        count: 5,
        description: 'BARRAGE: +40% AS, +30% range, fire 1 extra projectile',
        bonuses: { attackSpeedMult: 1.4, rangeMult: 1.3, multishot: 1 },
      },
    ],
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Mages deal increased damage. Max: all attacks deal splash',
    tiers: [
      { count: 2, description: '+25% damage', bonuses: { damageMult: 1.25 } },
      { count: 4, description: '+65% damage', bonuses: { damageMult: 1.65 } },
      {
        count: 6,
        description: 'ARCHMAGE: +100% dmg, all attacks deal 40% splash',
        bonuses: { damageMult: 2.0, splashOnHit: true, splashRadius: 50, splashFrac: 0.4 },
      },
    ],
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Assassins attack faster. Max: gain devastating critical strikes',
    tiers: [
      { count: 2, description: '+20% attack speed', bonuses: { attackSpeedMult: 1.2 } },
      { count: 4, description: '+45% AS, +15% damage', bonuses: { attackSpeedMult: 1.45, damageMult: 1.15 } },
      {
        count: 6,
        description: 'LETHALITY: +60% AS, +25% dmg, 30% chance for 2.5x crit',
        bonuses: { attackSpeedMult: 1.6, damageMult: 1.25, critChance: 0.30, critMult: 2.5 },
      },
    ],
  },
  {
    id: 'guardian',
    name: 'Guardian',
    description: 'Guardians boost range and support allies. Max: buff ALL allies',
    tiers: [
      { count: 2, description: '+20% range, +15% damage, +10% AS', bonuses: { rangeMult: 1.2, damageMult: 1.15, attackSpeedMult: 1.1 } },
      {
        count: 4,
        description: 'BASTION: +35% range, +35% dmg, +25% AS to ALL allies',
        bonuses: { rangeMult: 1.35, damageMult: 1.35, attackSpeedMult: 1.25, allAllies: true },
      },
    ],
  },
];

export function getSynergyById(id: string): SynergyData | undefined {
  return SYNERGIES.find(s => s.id === id);
}
