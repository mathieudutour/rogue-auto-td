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

    // Sort: active synergies first, then by count
    this.activeSynergies.sort((a, b) => {
      const aActive = a.activeTier ? 1 : 0;
      const bActive = b.activeTier ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return b.count - a.count;
    });

    this.scene.events.emit('synergiesChanged', this.activeSynergies);
  }
}
