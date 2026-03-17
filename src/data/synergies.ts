export interface SynergyTier {
  count: number;
  description: string;
  bonuses: {
    damageMult?: number;     // multiplicative bonus to damage
    attackSpeedMult?: number; // multiplicative bonus to attack speed
    rangeMult?: number;       // multiplicative bonus to range
    // Effects granted by synergies
    slowAmount?: number;      // speed multiplier on hit (0.7 = 30% slow)
    slowDuration?: number;    // slow duration in seconds
    burnOnHit?: number;       // apply AoE burn: damage per tick around target
    burnRadius?: number;      // radius of burn AoE
    splashOnHit?: boolean;    // attacks gain splash
    splashRadius?: number;    // splash radius
    splashFrac?: number;      // splash damage fraction
    chainOnHit?: number;      // number of chain bounces
    chainRange?: number;      // chain bounce range
    chainDamageFrac?: number; // chain damage falloff per bounce
    dotOnHit?: number;        // DoT damage per tick
    dotDuration?: number;     // DoT total duration
    dotTickRate?: number;     // DoT ticks per second
    critChance?: number;      // chance (0-1) to deal critical hit
    critMult?: number;        // critical damage multiplier
    multishot?: number;       // fire N extra projectiles at nearby targets
    executeThreshold?: number; // instantly kill enemies below this HP %
    freezeChance?: number;    // chance to freeze (full stop) on hit
    freezeDuration?: number;  // freeze duration in seconds
    bonusGoldOnKill?: number; // extra gold per kill
    allAllies?: boolean;      // apply bonuses to ALL placed allies
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
    description: 'Fire champions ignite enemies, dealing burn damage in an area',
    tiers: [
      { count: 2, description: 'Attacks burn nearby enemies (4 dmg/tick, 40px)', bonuses: { burnOnHit: 4, burnRadius: 40 } },
      { count: 4, description: 'Stronger burn (8 dmg/tick, 55px), +25% dmg', bonuses: { burnOnHit: 8, burnRadius: 55, damageMult: 1.25 } },
      {
        count: 6,
        description: 'INFERNO: Devastating burn (14 dmg/tick, 75px), +50% dmg',
        bonuses: { burnOnHit: 14, burnRadius: 75, damageMult: 1.5 },
      },
    ],
  },
  {
    id: 'ice',
    name: 'Ice',
    description: 'Ice champions slow enemies on hit. At max: freeze them solid',
    tiers: [
      { count: 2, description: 'Attacks slow enemies by 25% for 1s', bonuses: { slowAmount: 0.75, slowDuration: 1.0 } },
      { count: 4, description: 'Slow 40% for 1.5s, +20% range', bonuses: { slowAmount: 0.6, slowDuration: 1.5, rangeMult: 1.2 } },
      {
        count: 6,
        description: 'PERMAFROST: Slow 55% for 2s, 30% freeze chance (1.5s), +30% range',
        bonuses: { slowAmount: 0.45, slowDuration: 2.0, freezeChance: 0.3, freezeDuration: 1.5, rangeMult: 1.3 },
      },
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Nature champions poison enemies with damage over time',
    tiers: [
      { count: 2, description: 'Attacks poison: 4 dmg/tick over 2s', bonuses: { dotOnHit: 4, dotDuration: 2, dotTickRate: 2 } },
      { count: 4, description: 'Stronger poison: 7 dmg/tick over 3s, +20% AS', bonuses: { dotOnHit: 7, dotDuration: 3, dotTickRate: 2, attackSpeedMult: 1.2 } },
      {
        count: 6,
        description: 'OVERGROWTH: Deadly poison (12 dmg/tick, 4s), +35% AS, +1 gold/kill',
        bonuses: { dotOnHit: 12, dotDuration: 4, dotTickRate: 2, attackSpeedMult: 1.35, bonusGoldOnKill: 1 },
      },
    ],
  },
  {
    id: 'shadow',
    name: 'Shadow',
    description: 'Shadow champions deal critical strikes. At max: execute low HP enemies',
    tiers: [
      { count: 2, description: '15% crit chance (1.8x dmg)', bonuses: { critChance: 0.15, critMult: 1.8 } },
      { count: 4, description: '25% crit (2.2x), +30% dmg', bonuses: { critChance: 0.25, critMult: 2.2, damageMult: 1.3 } },
      {
        count: 6,
        description: 'REAPER: 35% crit (2.5x), +50% dmg, execute below 15% HP',
        bonuses: { critChance: 0.35, critMult: 2.5, damageMult: 1.5, executeThreshold: 0.15 },
      },
    ],
  },
  {
    id: 'arcane',
    name: 'Arcane',
    description: 'Arcane champions empower all allies with bonus damage and range',
    tiers: [
      { count: 2, description: '+15% damage, +15% range to ALL allies', bonuses: { damageMult: 1.15, rangeMult: 1.15, allAllies: true } },
      { count: 4, description: '+30% dmg, +25% range, +15% AS to ALL allies', bonuses: { damageMult: 1.3, rangeMult: 1.25, attackSpeedMult: 1.15, allAllies: true } },
      {
        count: 6,
        description: 'ARCANUM: +45% dmg, +35% range, +25% AS to ALL allies',
        bonuses: { damageMult: 1.45, rangeMult: 1.35, attackSpeedMult: 1.25, allAllies: true },
      },
    ],
  },
  {
    id: 'lightning',
    name: 'Lightning',
    description: 'Lightning champions attack with electrifying speed and chain to nearby enemies',
    tiers: [
      { count: 2, description: '+25% AS, chain to 1 enemy (65% dmg, 60px)', bonuses: { attackSpeedMult: 1.25, chainOnHit: 1, chainDamageFrac: 0.65, chainRange: 60 } },
      { count: 4, description: '+45% AS, chain to 2 (70% dmg, 75px), +20% dmg', bonuses: { attackSpeedMult: 1.45, chainOnHit: 2, chainDamageFrac: 0.7, chainRange: 75, damageMult: 1.2 } },
      {
        count: 6,
        description: 'OVERCHARGE: +70% AS, chain to 3 (80% dmg, 90px), +40% dmg',
        bonuses: { attackSpeedMult: 1.7, chainOnHit: 3, chainDamageFrac: 0.8, chainRange: 90, damageMult: 1.4 },
      },
    ],
  },
  {
    id: 'void',
    name: 'Void',
    description: 'Void champions deal devastating damage and execute weakened enemies',
    tiers: [
      { count: 2, description: '+25% damage, execute below 8% HP', bonuses: { damageMult: 1.25, executeThreshold: 0.08 } },
      {
        count: 4,
        description: 'OBLIVION: +45% dmg, execute below 15% HP, +1 gold/kill',
        bonuses: { damageMult: 1.45, executeThreshold: 0.15, bonusGoldOnKill: 1 },
      },
    ],
  },

  // ── Class synergies ────────────────────────────────
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Warriors deal splash damage, hitting multiple enemies',
    tiers: [
      { count: 2, description: 'Attacks splash for 25% dmg (35px)', bonuses: { splashOnHit: true, splashFrac: 0.25, splashRadius: 35 } },
      { count: 4, description: 'Splash 40% dmg (50px), +20% dmg', bonuses: { splashOnHit: true, splashFrac: 0.4, splashRadius: 50, damageMult: 1.2 } },
      {
        count: 6,
        description: 'BULWARK: Splash 60% dmg (65px), +40% dmg',
        bonuses: { splashOnHit: true, splashFrac: 0.6, splashRadius: 65, damageMult: 1.4 },
      },
    ],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Rangers attack faster and farther. At max: fire extra projectiles',
    tiers: [
      { count: 2, description: '+20% attack speed, +15% range', bonuses: { attackSpeedMult: 1.2, rangeMult: 1.15 } },
      { count: 3, description: '+40% AS, +25% range', bonuses: { attackSpeedMult: 1.4, rangeMult: 1.25 } },
      {
        count: 5,
        description: 'BARRAGE: +60% AS, +35% range, fire 1 extra projectile',
        bonuses: { attackSpeedMult: 1.6, rangeMult: 1.35, multishot: 1 },
      },
    ],
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Mages chain lightning between enemies',
    tiers: [
      { count: 2, description: 'Attacks chain to 2 enemies (70% dmg, 70px)', bonuses: { chainOnHit: 2, chainDamageFrac: 0.7, chainRange: 70 } },
      { count: 4, description: 'Chain to 3 enemies (75% dmg, 85px), +25% dmg', bonuses: { chainOnHit: 3, chainDamageFrac: 0.75, chainRange: 85, damageMult: 1.25 } },
      {
        count: 6,
        description: 'ARCHMAGE: Chain to 5 enemies (80% dmg, 100px), +50% dmg',
        bonuses: { chainOnHit: 5, chainDamageFrac: 0.8, chainRange: 100, damageMult: 1.5 },
      },
    ],
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Assassins attack with blazing speed',
    tiers: [
      { count: 2, description: '+30% attack speed', bonuses: { attackSpeedMult: 1.3 } },
      { count: 4, description: '+55% AS, +20% dmg', bonuses: { attackSpeedMult: 1.55, damageMult: 1.2 } },
      {
        count: 6,
        description: 'LETHALITY: +80% AS, +40% dmg',
        bonuses: { attackSpeedMult: 1.8, damageMult: 1.4 },
      },
    ],
  },
  {
    id: 'guardian',
    name: 'Guardian',
    description: 'Guardians boost all allies with range and power',
    tiers: [
      { count: 2, description: '+20% range, +15% dmg to ALL allies', bonuses: { rangeMult: 1.2, damageMult: 1.15, allAllies: true } },
      { count: 4, description: '+30% range, +30% dmg, +20% AS to ALL allies', bonuses: { rangeMult: 1.3, damageMult: 1.3, attackSpeedMult: 1.2, allAllies: true } },
      {
        count: 6,
        description: 'BASTION: +40% range, +45% dmg, +30% AS, +1 gold/kill to ALL allies',
        bonuses: { rangeMult: 1.4, damageMult: 1.45, attackSpeedMult: 1.3, bonusGoldOnKill: 1, allAllies: true },
      },
    ],
  },
];

export function getSynergyById(id: string): SynergyData | undefined {
  return SYNERGIES.find(s => s.id === id);
}
