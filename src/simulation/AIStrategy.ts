/**
 * AI strategies for the simulation.
 * Each strategy represents a different skill level of player.
 */

import { SimEngine, ShopOffer, AIStrategy } from './SimEngine';
import { SimChampion } from './SimTypes';

/**
 * "Smart" AI — mimics a reasonably skilled player:
 * - Buys strongest affordable champions
 * - Places champions near the path
 * - Levels up at key thresholds
 * - Econ: saves for interest when safe, spends when needed
 * - Rerolls to find upgrades when appropriate
 */
export class SmartAI implements AIStrategy {
  shop(engine: SimEngine, offers: ShopOffer[]): ShopOffer[] {
    const state = engine.state;

    // Phase 1: Level up if it unlocks a board slot and we have bench champions to place
    const benchChamps = state.bench.filter(b => b !== null).length;
    this.levelUpIfNeeded(engine, benchChamps);

    // Phase 2: Buy champions from shop
    offers = this.buyFromShop(engine, offers);

    // Phase 3: Place all bench champions on board if possible
    this.placeAllBenchChampions(engine);

    // Phase 4: Maybe reroll if we have gold to spare and board isn't full
    if (state.gold >= 6 && state.waveNumber >= 3) {
      offers = engine.rerollShop(offers);
      offers = this.buyFromShop(engine, offers);
      this.placeAllBenchChampions(engine);
    }

    return offers;
  }

  private levelUpIfNeeded(engine: SimEngine, benchChamps: number): void {
    const state = engine.state;
    const placedCount = state.champions.filter(c => c.placed).length;
    const maxBoard = engine.getMaxBoardSize();

    // Level up if: we have bench champions waiting AND leveling would give us more board space
    // OR if we're past wave 5 and have gold to spare
    while (
      state.gold >= 4 &&
      state.level < 9 &&
      (
        (placedCount >= maxBoard && benchChamps > 0) ||
        (state.waveNumber >= 6 && state.gold >= 10)
      )
    ) {
      const prevLevel = state.level;
      engine.buyXp();
      if (state.level === prevLevel) break; // didn't level up, save gold
      // Recheck if we should keep leveling
      if (state.gold < 4) break;
    }
  }

  private buyFromShop(engine: SimEngine, offers: ShopOffer[]): ShopOffer[] {
    const state = engine.state;

    // Sort offers: prefer champions that would create pairs/triples, then by cost (higher = stronger)
    const scoredOffers = offers
      .map((offer, idx) => ({
        offer,
        idx,
        score: this.scoreChampionBuy(engine, offer),
      }))
      .filter(o => o.offer.available)
      .sort((a, b) => b.score - a.score);

    for (const { offer } of scoredOffers) {
      if (!offer.available) continue;
      if (!engine.canAfford(offer.championData.cost)) continue;

      // Don't buy if bench is full and no merge possible
      const benchFull = state.bench.filter(b => b === null).length === 0
        && state.bench.length >= 8;
      if (benchFull) continue;

      // Don't spend below 10 gold (interest threshold) unless it's a good buy
      const score = this.scoreChampionBuy(engine, offer);
      if (state.gold - offer.championData.cost < 10 && score < 5 && state.waveNumber > 3) continue;

      engine.buyChampion(offer);
    }

    return offers;
  }

  private scoreChampionBuy(engine: SimEngine, offer: ShopOffer): number {
    if (!offer.available) return -1;
    const state = engine.state;
    const data = offer.championData;
    let score = data.cost * 2; // higher cost = generally better

    // Bonus for having copies (closer to star upgrade)
    const copies = this.countCopies(state, data.id, 1);
    if (copies >= 2) score += 20; // would trigger 3-star merge
    else if (copies >= 1) score += 5; // pair

    // Bonus for synergy potential
    const traitCounts: Record<string, number> = {};
    for (const champ of state.champions) {
      if (!champ.placed) continue;
      for (const trait of champ.traits) {
        traitCounts[trait] = (traitCounts[trait] || 0) + 1;
      }
    }
    for (const trait of data.traits) {
      const count = traitCounts[trait] || 0;
      if (count >= 1) score += 3; // would activate or strengthen a synergy
    }

    return score;
  }

  private countCopies(state: { champions: SimChampion[]; bench: (SimChampion | null)[] }, id: string, starLevel: number): number {
    let count = 0;
    for (const c of state.bench) {
      if (c && c.championId === id && c.starLevel === starLevel) count++;
    }
    for (const c of state.champions) {
      if (c.championId === id && c.starLevel === starLevel) count++;
    }
    return count;
  }

  private placeAllBenchChampions(engine: SimEngine): void {
    const state = engine.state;
    const tiles = engine.getAvailableTiles();
    let tileIdx = 0;

    for (let i = 0; i < state.bench.length; i++) {
      const champ = state.bench[i];
      if (!champ) continue;

      const placedCount = state.champions.filter(c => c.placed).length;
      if (placedCount >= engine.getMaxBoardSize()) break;

      // Find next available tile
      while (tileIdx < tiles.length) {
        const tile = tiles[tileIdx];
        tileIdx++;
        if (engine.placeChampion(champ, tile.col, tile.row)) break;
      }
    }
  }
}

/**
 * "Greedy" AI — buys everything it can afford, no economy management.
 * Represents a new/casual player.
 */
export class GreedyAI implements AIStrategy {
  shop(engine: SimEngine, offers: ShopOffer[]): ShopOffer[] {
    // Buy everything affordable
    for (const offer of offers) {
      if (offer.available && engine.canAfford(offer.championData.cost)) {
        engine.buyChampion(offer);
      }
    }

    // Place everything
    const state = engine.state;
    const tiles = engine.getAvailableTiles();
    let tileIdx = 0;

    for (let i = 0; i < state.bench.length; i++) {
      const champ = state.bench[i];
      if (!champ) continue;
      const placedCount = state.champions.filter(c => c.placed).length;
      if (placedCount >= engine.getMaxBoardSize()) break;

      while (tileIdx < tiles.length) {
        const tile = tiles[tileIdx];
        tileIdx++;
        if (engine.placeChampion(champ, tile.col, tile.row)) break;
      }
    }

    return offers;
  }
}

/**
 * "Econ" AI — focuses on saving gold for interest, levels aggressively.
 * Represents a player who knows the economy system well.
 */
export class EconAI implements AIStrategy {
  shop(engine: SimEngine, offers: ShopOffer[]): ShopOffer[] {
    const state = engine.state;

    // Level up aggressively
    while (state.gold >= 8 && state.level < 9) {
      const prev = state.level;
      engine.buyXp();
      if (state.level === prev) break;
    }

    // Only buy if we can stay at 50+ gold (for max interest) or it's early game
    const minGold = state.waveNumber <= 3 ? 0 : 50;

    for (const offer of offers) {
      if (!offer.available) continue;
      if (state.gold - offer.championData.cost < minGold) continue;
      engine.buyChampion(offer);
    }

    // Place champions
    const tiles = engine.getAvailableTiles();
    let tileIdx = 0;
    for (let i = 0; i < state.bench.length; i++) {
      const champ = state.bench[i];
      if (!champ) continue;
      const placedCount = state.champions.filter(c => c.placed).length;
      if (placedCount >= engine.getMaxBoardSize()) break;

      while (tileIdx < tiles.length) {
        const tile = tiles[tileIdx];
        tileIdx++;
        if (engine.placeChampion(champ, tile.col, tile.row)) break;
      }
    }

    return offers;
  }
}
