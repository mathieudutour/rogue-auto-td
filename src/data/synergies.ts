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
  // Element synergies
  {
    id: 'fire',
    name: 'Fire',
    description: 'Fire champions deal bonus damage',
    tiers: [
      { count: 2, description: '+20% damage', bonuses: { damageMult: 1.2 } },
      { count: 4, description: '+50% damage', bonuses: { damageMult: 1.5 } },
    ],
  },
  {
    id: 'ice',
    name: 'Ice',
    description: 'Ice champions gain attack range',
    tiers: [
      { count: 2, description: '+20% range', bonuses: { rangeMult: 1.2 } },
      { count: 4, description: '+40% range', bonuses: { rangeMult: 1.4 } },
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Nature champions attack faster',
    tiers: [
      { count: 2, description: '+20% attack speed', bonuses: { attackSpeedMult: 1.2 } },
      { count: 3, description: '+40% attack speed', bonuses: { attackSpeedMult: 1.4 } },
    ],
  },
  {
    id: 'shadow',
    name: 'Shadow',
    description: 'Shadow champions deal massive bonus damage',
    tiers: [
      { count: 2, description: '+30% damage', bonuses: { damageMult: 1.3 } },
      { count: 4, description: '+70% damage', bonuses: { damageMult: 1.7 } },
    ],
  },
  // Class synergies
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Warriors are tougher, reducing damage taken',
    tiers: [
      { count: 2, description: '5 armor', bonuses: { armor: 5 } },
      { count: 4, description: '15 armor', bonuses: { armor: 15 } },
    ],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Rangers attack faster and have more range',
    tiers: [
      { count: 2, description: '+15% AS, +10% range', bonuses: { attackSpeedMult: 1.15, rangeMult: 1.1 } },
      { count: 3, description: '+30% AS, +20% range', bonuses: { attackSpeedMult: 1.3, rangeMult: 1.2 } },
    ],
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Mages deal increased damage',
    tiers: [
      { count: 2, description: '+25% damage', bonuses: { damageMult: 1.25 } },
      { count: 4, description: '+60% damage', bonuses: { damageMult: 1.6 } },
    ],
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Assassins attack much faster',
    tiers: [
      { count: 2, description: '+30% attack speed', bonuses: { attackSpeedMult: 1.3 } },
      { count: 3, description: '+60% attack speed', bonuses: { attackSpeedMult: 1.6 } },
    ],
  },
];

export function getSynergyById(id: string): SynergyData | undefined {
  return SYNERGIES.find(s => s.id === id);
}
