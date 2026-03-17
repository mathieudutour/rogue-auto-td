import { GameScene } from '../scenes/GameScene';
import { SYNERGIES, SynergyData, SynergyTier } from '../data/synergies';

export interface ActiveSynergy {
  synergy: SynergyData;
  count: number;
  activeTier: SynergyTier | null;
  nextTier: SynergyTier | null;
}

export class SynergyManager {
  private scene: GameScene;
  activeSynergies: ActiveSynergy[] = [];

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  calculateSynergies(): void {
    // Count traits from placed champions (unique champion IDs only)
    const traitCounts: Record<string, number> = {};
    const seenPerTrait: Record<string, Set<string>> = {};

    for (const champion of this.scene.champions) {
      if (!champion.placed) continue;
      for (const trait of champion.traits) {
        if (!seenPerTrait[trait]) seenPerTrait[trait] = new Set();
        if (!seenPerTrait[trait].has(champion.championId)) {
          seenPerTrait[trait].add(champion.championId);
          traitCounts[trait] = (traitCounts[trait] || 0) + 1;
        }
      }
    }

    // Reset all champion synergy bonuses
    for (const champion of this.scene.champions) {
      champion.resetSynergyBonuses();
    }

    // Determine active synergies
    this.activeSynergies = [];

    for (const synergy of SYNERGIES) {
      const count = traitCounts[synergy.id] || 0;
      if (count === 0) continue;

      // Find highest active tier
      let activeTier: SynergyTier | null = null;
      let nextTier: SynergyTier | null = null;

      for (let i = synergy.tiers.length - 1; i >= 0; i--) {
        if (count >= synergy.tiers[i].count) {
          activeTier = synergy.tiers[i];
          nextTier = synergy.tiers[i + 1] || null;
          break;
        }
      }

      if (!activeTier) {
        nextTier = synergy.tiers[0];
      }

      this.activeSynergies.push({ synergy, count, activeTier, nextTier });

      // Apply bonuses to champions with this trait (or ALL allies if allAllies flag)
      if (activeTier) {
        const applyToAll = activeTier.bonuses.allAllies === true;
        for (const champion of this.scene.champions) {
          if (!champion.placed) continue;
          if (applyToAll || champion.traits.includes(synergy.id)) {
            champion.applySynergyBonus(activeTier.bonuses);
          }
        }
      }
    }

    // Apply blessing bonuses to champions
    const blessing = this.scene.runConfig?.blessing;
    if (blessing) {
      for (const champion of this.scene.champions) {
        if (!champion.placed) continue;
        this.applyBlessingBonus(champion, blessing.id);
      }
    }

    // Sort: active synergies first, then by count
    this.activeSynergies.sort((a, b) => {
      const aActive = a.activeTier ? 1 : 0;
      const bActive = b.activeTier ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return b.count - a.count;
    });

    this.scene.events.emit('synergiesChanged', this.activeSynergies);
  }

  private applyBlessingBonus(champion: any, blessingId: string): void {
    const traits = champion.traits as string[];

    // Element affinities
    if (blessingId === 'fire_affinity' && traits.includes('fire')) {
      champion.applySynergyBonus({ damageMult: 0.15 });
    } else if (blessingId === 'ice_affinity' && traits.includes('ice')) {
      champion.applySynergyBonus({ attackSpeedMult: 0.15 });
    } else if (blessingId === 'nature_affinity' && traits.includes('nature')) {
      champion.applySynergyBonus({ bonusRange: 20 });
    } else if (blessingId === 'shadow_affinity' && traits.includes('shadow')) {
      champion.applySynergyBonus({ critChance: 0.15 });
    } else if (blessingId === 'lightning_affinity' && traits.includes('lightning')) {
      champion.applySynergyBonus({ attackSpeedMult: 0.15 });
    } else if (blessingId === 'void_affinity' && traits.includes('void')) {
      champion.applySynergyBonus({ damageMult: 0.15 });
    } else if (blessingId === 'arcane_affinity' && traits.includes('arcane')) {
      champion.applySynergyBonus({ bonusRange: 15, damageMult: 0.10 });
    }

    // Class affinities
    if (blessingId === 'warrior_might' && traits.includes('warrior')) {
      champion.applySynergyBonus({ damageMult: 0.20 });
    } else if (blessingId === 'ranger_precision' && traits.includes('ranger')) {
      champion.applySynergyBonus({ bonusRange: 30 });
    } else if (blessingId === 'mage_power' && traits.includes('mage')) {
      champion.applySynergyBonus({ damageMult: 0.20 });
    } else if (blessingId === 'assassin_edge' && traits.includes('assassin')) {
      champion.applySynergyBonus({ critChance: 0.20, critMult: 2.0 });
    } else if (blessingId === 'guardian_wall' && traits.includes('guardian')) {
      champion.applySynergyBonus({ bonusRange: 25, damageMult: 0.10 });
    }

    // Global blessings
    if (blessingId === 'all_for_one') {
      champion.applySynergyBonus({ damageMult: 0.08, attackSpeedMult: 0.08 });
    }
  }
}
