/**
 * Persists meta progression state to localStorage.
 * Tracks: souls, upgrade levels, stats, unlocks.
 */

import { META_UPGRADES, getUpgradeValue, calculateSoulsEarned, Blessing, Curse } from '../data/meta';

const STORAGE_KEY = 'rogue_auto_td_meta';

export interface MetaSaveData {
  souls: number;
  upgradeLevels: Record<string, number>;  // upgradeId → current level
  totalRuns: number;
  bestWave: number;
  totalSoulsEarned: number;
}

function defaultSave(): MetaSaveData {
  return {
    souls: 0,
    upgradeLevels: {},
    totalRuns: 0,
    bestWave: 0,
    totalSoulsEarned: 0,
  };
}

export class MetaProgressionManager {
  private data: MetaSaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): MetaSaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...defaultSave(), ...parsed };
      }
    } catch {
      // Corrupted data — start fresh
    }
    return defaultSave();
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage full or unavailable — ignore
    }
  }

  // ── Getters ────────────────────────────────────────

  getSouls(): number {
    return this.data.souls;
  }

  getBestWave(): number {
    return this.data.bestWave;
  }

  getTotalRuns(): number {
    return this.data.totalRuns;
  }

  getUpgradeLevel(upgradeId: string): number {
    return this.data.upgradeLevels[upgradeId] || 0;
  }

  getUpgradeValue(upgradeId: string): number {
    return getUpgradeValue(upgradeId, this.getUpgradeLevel(upgradeId));
  }

  // ── Actions ────────────────────────────────────────

  /** Purchase an upgrade level. Returns true on success. */
  buyUpgrade(upgradeId: string): boolean {
    const upgrade = META_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return false;

    const currentLevel = this.getUpgradeLevel(upgradeId);
    if (currentLevel >= upgrade.maxLevel) return false;

    const cost = upgrade.costPerLevel[currentLevel];
    if (this.data.souls < cost) return false;

    this.data.souls -= cost;
    this.data.upgradeLevels[upgradeId] = currentLevel + 1;
    this.save();
    return true;
  }

  /** Get cost of next level for an upgrade (or -1 if maxed) */
  getNextCost(upgradeId: string): number {
    const upgrade = META_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return -1;
    const currentLevel = this.getUpgradeLevel(upgradeId);
    if (currentLevel >= upgrade.maxLevel) return -1;
    return upgrade.costPerLevel[currentLevel];
  }

  /** Record end-of-run and award souls. Returns souls earned. */
  completeRun(waveSurvived: number, curses: Curse[]): number {
    const soulBonusPercent = this.getUpgradeValue('soul_bonus');
    const curseMultiplier = curses.reduce((m, c) => m * c.soulMultiplier, 1);
    const souls = calculateSoulsEarned(waveSurvived, soulBonusPercent, curseMultiplier);

    this.data.souls += souls;
    this.data.totalRuns++;
    this.data.totalSoulsEarned += souls;
    if (waveSurvived > this.data.bestWave) {
      this.data.bestWave = waveSurvived;
    }
    this.save();
    return souls;
  }

  // ── Convenience: get all active upgrade effects ────

  getStartingGoldBonus(): number { return this.getUpgradeValue('starting_gold'); }
  getMaxInterestBonus(): number { return this.getUpgradeValue('interest_rate'); }
  getRerollDiscount(): number { return this.getUpgradeValue('reroll_discount'); }
  getFreeRerolls(): number { return this.getUpgradeValue('free_reroll'); }
  getStartingXpBonus(): number { return this.getUpgradeValue('starting_xp'); }
  getItemLuckPercent(): number { return this.getUpgradeValue('item_luck'); }
  getStartingLivesBonus(): number { return this.getUpgradeValue('starting_lives'); }

  /** Reset all progress (debug) */
  reset(): void {
    this.data = defaultSave();
    this.save();
  }
}
