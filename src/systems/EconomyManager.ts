import { INTEREST_PER_10_GOLD, MAX_INTEREST } from '../utils/constants';

export class EconomyManager {
  private gold: number;

  constructor(startingGold: number) {
    this.gold = startingGold;
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
}
