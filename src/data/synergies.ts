export interface SynergyTier {
  count: number;
  description: string;
  bonuses: {
    damageMult?: number;     // multiplicative bonus to damage
    attackSpeedMult?: number; // multiplicative bonus to attack speed
    rangeMult?: number;       // multiplicative bonus to range
    armor?: number;           // flat damage reduction
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
    description: 'Fire champions deal bonus damage',
    tiers: [
      { count: 2, description: '+20% damage', bonuses: { damageMult: 1.2 } },
      { count: 4, description: '+50% damage', bonuses: { damageMult: 1.5 } },
      { count: 6, description: '+90% damage', bonuses: { damageMult: 1.9 } },
    ],
  },
  {
    id: 'ice',
    name: 'Ice',
    description: 'Ice champions gain attack range',
    tiers: [
      { count: 2, description: '+20% range', bonuses: { rangeMult: 1.2 } },
      { count: 4, description: '+40% range', bonuses: { rangeMult: 1.4 } },
      { count: 6, description: '+70% range, +20% AS', bonuses: { rangeMult: 1.7, attackSpeedMult: 1.2 } },
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Nature champions attack faster',
    tiers: [
      { count: 2, description: '+20% attack speed', bonuses: { attackSpeedMult: 1.2 } },
      { count: 4, description: '+45% attack speed', bonuses: { attackSpeedMult: 1.45 } },
      { count: 6, description: '+75% AS, +20% damage', bonuses: { attackSpeedMult: 1.75, damageMult: 1.2 } },
    ],
  },
  {
    id: 'shadow',
    name: 'Shadow',
    description: 'Shadow champions deal massive bonus damage',
    tiers: [
      { count: 2, description: '+30% damage', bonuses: { damageMult: 1.3 } },
      { count: 4, description: '+70% damage', bonuses: { damageMult: 1.7 } },
      { count: 6, description: '+120% damage', bonuses: { damageMult: 2.2 } },
    ],
  },
  {
    id: 'arcane',
    name: 'Arcane',
    description: 'Arcane champions gain damage and range',
    tiers: [
      { count: 2, description: '+15% damage, +15% range', bonuses: { damageMult: 1.15, rangeMult: 1.15 } },
      { count: 4, description: '+35% damage, +30% range', bonuses: { damageMult: 1.35, rangeMult: 1.3 } },
    ],
  },

  // ── Class synergies ────────────────────────────────
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Warriors are tougher, reducing damage taken',
    tiers: [
      { count: 2, description: '5 armor', bonuses: { armor: 5 } },
      { count: 4, description: '15 armor, +20% damage', bonuses: { armor: 15, damageMult: 1.2 } },
      { count: 6, description: '25 armor, +40% damage', bonuses: { armor: 25, damageMult: 1.4 } },
    ],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Rangers attack faster and have more range',
    tiers: [
      { count: 2, description: '+15% AS, +10% range', bonuses: { attackSpeedMult: 1.15, rangeMult: 1.1 } },
      { count: 3, description: '+30% AS, +20% range', bonuses: { attackSpeedMult: 1.3, rangeMult: 1.2 } },
      { count: 5, description: '+50% AS, +40% range', bonuses: { attackSpeedMult: 1.5, rangeMult: 1.4 } },
    ],
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Mages deal increased damage',
    tiers: [
      { count: 2, description: '+25% damage', bonuses: { damageMult: 1.25 } },
      { count: 4, description: '+60% damage', bonuses: { damageMult: 1.6 } },
      { count: 6, description: '+100% damage, +20% range', bonuses: { damageMult: 2.0, rangeMult: 1.2 } },
    ],
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Assassins attack much faster',
    tiers: [
      { count: 2, description: '+30% attack speed', bonuses: { attackSpeedMult: 1.3 } },
      { count: 4, description: '+65% AS, +20% damage', bonuses: { attackSpeedMult: 1.65, damageMult: 1.2 } },
      { count: 6, description: '+100% AS, +40% damage', bonuses: { attackSpeedMult: 2.0, damageMult: 1.4 } },
    ],
  },
  {
    id: 'guardian',
    name: 'Guardian',
    description: 'Guardians bolster defenses and range',
    tiers: [
      { count: 2, description: '8 armor, +10% range', bonuses: { armor: 8, rangeMult: 1.1 } },
      { count: 4, description: '20 armor, +25% range, +15% damage', bonuses: { armor: 20, rangeMult: 1.25, damageMult: 1.15 } },
    ],
  },
];

export function getSynergyById(id: string): SynergyData | undefined {
  return SYNERGIES.find(s => s.id === id);
}
