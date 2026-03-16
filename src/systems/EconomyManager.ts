import {
  INTEREST_PER_10_GOLD,
  MAX_INTEREST,
  STARTING_LEVEL,
  MAX_LEVEL,
  BUY_XP_COST,
  BUY_XP_AMOUNT,
  XP_PER_LEVEL,
  BOARD_SIZE_PER_LEVEL,
} from '../utils/constants';

export class EconomyManager {
  private gold: number;
  level: number;
  xp: number = 0;

  constructor(startingGold: number) {
    this.gold = startingGold;
    this.level = STARTING_LEVEL;
  }

  getGold(): number {
    return this.gold;
  }

  addGold(amount: number): void {
    this.gold += amount;
  }

  spendGold(amount: number): boolean {
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }

  canAfford(amount: number): boolean {
    return this.gold >= amount;
  }

  calculateInterest(): number {
    const interest = Math.floor(this.gold / 10) * INTEREST_PER_10_GOLD;
    return Math.min(interest, MAX_INTEREST);
  }

  /** Buy XP with gold. Returns true if purchased. */
  buyXp(): boolean {
    if (this.level >= MAX_LEVEL) return false;
    if (!this.spendGold(BUY_XP_COST)) return false;
    this.addXp(BUY_XP_AMOUNT);
    return true;
  }

  /** Add XP (from wave completion or buying). Auto-levels up. */
  addXp(amount: number): void {
    if (this.level >= MAX_LEVEL) return;
    this.xp += amount;

    // Check for level up
    while (this.level < MAX_LEVEL) {
      const needed = XP_PER_LEVEL[this.level + 1];
      if (needed === undefined || this.xp < needed) break;
      this.xp -= needed;
      this.level++;
    }

    // Cap XP at 0 if max level
    if (this.level >= MAX_LEVEL) {
      this.xp = 0;
    }
  }

  /** Get XP needed for next level */
  getXpToNextLevel(): number {
    if (this.level >= MAX_LEVEL) return 0;
    return XP_PER_LEVEL[this.level + 1] || 0;
  }

  /** Max champions allowed on the board */
  getMaxBoardSize(): number {
    return BOARD_SIZE_PER_LEVEL[this.level] || this.level;
  }
}
