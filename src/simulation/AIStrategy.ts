/**
 * AI strategies for the simulation.
 * Each strategy represents a different approach to building a team.
 */

import { SimEngine, ShopOffer, AIStrategy } from './SimEngine';
import { SimChampion } from './SimTypes';
import { CHAMPIONS } from '../data/champions';
import { SYNERGIES } from '../data/synergies';

// ── Shared helpers ────────────────────────────────────

function countCopies(state: { champions: SimChampion[]; bench: (SimChampion | null)[] }, id: string, starLevel: number): number {
  let count = 0;
  for (const c of state.bench) {
    if (c && c.championId === id && c.starLevel === starLevel) count++;
  }
  for (const c of state.champions) {
    if (c.championId === id && c.starLevel === starLevel) count++;
  }
  return count;
}

function placeAllBenchChampions(engine: SimEngine): void {
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
}

function levelUpSmart(engine: SimEngine, benchChamps: number): void {
  const state = engine.state;
  const placedCount = state.champions.filter(c => c.placed).length;
  const maxBoard = engine.getMaxBoardSize();

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
    if (state.level === prevLevel) break;
    if (state.gold < 4) break;
  }
}

// ── SmartAI: generic skilled player ────────────────────

export class SmartAI implements AIStrategy {
  shop(engine: SimEngine, offers: ShopOffer[]): ShopOffer[] {
    const state = engine.state;
    const benchChamps = state.bench.filter(b => b !== null).length;
    levelUpSmart(engine, benchChamps);

    offers = this.buyFromShop(engine, offers);
    placeAllBenchChampions(engine);

    if (state.gold >= 6 && state.waveNumber >= 3) {
      offers = engine.rerollShop(offers);
      offers = this.buyFromShop(engine, offers);
      placeAllBenchChampions(engine);
    }

    return offers;
  }

  private buyFromShop(engine: SimEngine, offers: ShopOffer[]): ShopOffer[] {
    const state = engine.state;
    const scoredOffers = offers
      .map((offer) => ({ offer, score: this.scoreChampionBuy(engine, offer) }))
      .filter(o => o.offer.available)
      .sort((a, b) => b.score - a.score);

    for (const { offer } of scoredOffers) {
      if (!offer.available || !engine.canAfford(offer.championData.cost)) continue;
      const benchFull = state.bench.filter(b => b === null).length === 0 && state.bench.length >= 8;
      if (benchFull) continue;
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
    let score = data.cost * 2;

    const copies = countCopies(state, data.id, 1);
    if (copies >= 2) score += 20;
    else if (copies >= 1) score += 5;

    const traitCounts: Record<string, number> = {};
    for (const champ of state.champions) {
      if (!champ.placed) continue;
      for (const trait of champ.traits) {
        traitCounts[trait] = (traitCounts[trait] || 0) + 1;
      }
    }
    for (const trait of data.traits) {
      const count = traitCounts[trait] || 0;
      if (count >= 1) score += 3;
    }

    return score;
  }
}

// ── GreedyAI: casual player ───────────────────────────

export class GreedyAI implements AIStrategy {
  shop(engine: SimEngine, offers: ShopOffer[]): ShopOffer[] {
    for (const offer of offers) {
      if (offer.available && engine.canAfford(offer.championData.cost)) {
        engine.buyChampion(offer);
      }
    }
    placeAllBenchChampions(engine);
    return offers;
  }
}

// ── EconAI: economy-focused player ────────────────────

export class EconAI implements AIStrategy {
  shop(engine: SimEngine, offers: ShopOffer[]): ShopOffer[] {
    const state = engine.state;

    while (state.gold >= 8 && state.level < 9) {
      const prev = state.level;
      engine.buyXp();
      if (state.level === prev) break;
    }

    const minGold = state.waveNumber <= 3 ? 0 : 50;
    for (const offer of offers) {
      if (!offer.available) continue;
      if (state.gold - offer.championData.cost < minGold) continue;
      engine.buyChampion(offer);
    }

    placeAllBenchChampions(engine);
    return offers;
  }
}

// ── SynergyAI: focuses on a single synergy trait ──────

/**
 * One AI per synergy. Prioritizes buying champions with the target trait,
 * and fills remaining slots with the best available.
 */
export class SynergyAI implements AIStrategy {
  private targetTrait: string;
  private traitChampionIds: Set<string>;

  constructor(targetTrait: string) {
    this.targetTrait = targetTrait;
    // Pre-compute which champion IDs have this trait
    this.traitChampionIds = new Set(
      CHAMPIONS.filter(c => c.traits.includes(targetTrait)).map(c => c.id)
    );
  }

  shop(engine: SimEngine, offers: ShopOffer[]): ShopOffer[] {
    const state = engine.state;
    const benchChamps = state.bench.filter(b => b !== null).length;
    levelUpSmart(engine, benchChamps);

    offers = this.buyFromShop(engine, offers);
    placeAllBenchChampions(engine);

    // Reroll more aggressively if we have gold and are looking for trait champs
    const rerollThreshold = state.waveNumber <= 5 ? 6 : 4;
    if (state.gold >= rerollThreshold && state.waveNumber >= 2) {
      offers = engine.rerollShop(offers);
      offers = this.buyFromShop(engine, offers);
      placeAllBenchChampions(engine);
    }

    // Second reroll if we're flush with gold
    if (state.gold >= 10 && state.waveNumber >= 5) {
      offers = engine.rerollShop(offers);
      offers = this.buyFromShop(engine, offers);
      placeAllBenchChampions(engine);
    }

    return offers;
  }

  private buyFromShop(engine: SimEngine, offers: ShopOffer[]): ShopOffer[] {
    const state = engine.state;
    const scoredOffers = offers
      .map((offer) => ({ offer, score: this.scoreChampionBuy(engine, offer) }))
      .filter(o => o.offer.available)
      .sort((a, b) => b.score - a.score);

    for (const { offer, score } of scoredOffers) {
      if (!offer.available || !engine.canAfford(offer.championData.cost)) continue;
      const benchFull = state.bench.filter(b => b === null).length === 0 && state.bench.length >= 8;
      if (benchFull) continue;

      // Be more willing to spend gold for trait champions
      const isTraitChamp = this.traitChampionIds.has(offer.championData.id);
      const goldFloor = isTraitChamp ? 2 : 10;
      if (state.gold - offer.championData.cost < goldFloor && score < 5 && state.waveNumber > 3) continue;

      engine.buyChampion(offer);
    }
    return offers;
  }

  private scoreChampionBuy(engine: SimEngine, offer: ShopOffer): number {
    if (!offer.available) return -1;
    const state = engine.state;
    const data = offer.championData;
    let score = data.cost; // base score by cost

    // Big bonus for having the target trait
    const hasTargetTrait = data.traits.includes(this.targetTrait);
    if (hasTargetTrait) score += 15;

    // Bonus for star upgrade potential
    const copies = countCopies(state, data.id, 1);
    if (copies >= 2) score += 25; // would trigger merge
    else if (copies >= 1) score += 8;

    // Bonus for synergy with existing board
    const traitCounts: Record<string, number> = {};
    for (const champ of state.champions) {
      if (!champ.placed) continue;
      for (const trait of champ.traits) {
        traitCounts[trait] = (traitCounts[trait] || 0) + 1;
      }
    }
    for (const trait of data.traits) {
      const count = traitCounts[trait] || 0;
      if (count >= 1) score += 4;
      // Extra bonus if this would hit a new synergy tier
      const synergy = SYNERGIES.find(s => s.id === trait);
      if (synergy) {
        for (const tier of synergy.tiers) {
          if (count + 1 === tier.count) score += 6;
        }
      }
    }

    // Small penalty for non-trait champions if we already have enough board slots
    if (!hasTargetTrait) {
      const traitChampsOnBoard = state.champions.filter(
        c => c.placed && c.traits.includes(this.targetTrait)
      ).length;
      const traitChampsOnBench = state.bench.filter(
        c => c !== null && c.traits.includes(this.targetTrait)
      ).length;
      // If we don't have many trait champs yet, penalize off-trait purchases
      if (traitChampsOnBoard + traitChampsOnBench < 4) {
        score -= 5;
      }
    }

    return score;
  }
}

/**
 * Get all unique trait IDs from the synergy data.
 */
export function getAllTraits(): string[] {
  return SYNERGIES.map(s => s.id);
}
