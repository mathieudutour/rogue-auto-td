import { GameScene } from '../scenes/GameScene';
import { CHAMPIONS, ChampionData, getChampionById } from '../data/champions';
import { Champion } from '../entities/Champion';
import { POOL_SIZES, SHOP_SIZE, REROLL_COST, BENCH_SIZE, SHOP_ODDS_PER_LEVEL } from '../utils/constants';

interface PoolEntry {
  championId: string;
  remaining: number;
}

export interface ShopSlot {
  championData: ChampionData;
  available: boolean;
}

export class ShopManager {
  private scene: GameScene;
  private pool: PoolEntry[] = [];
  shopSlots: ShopSlot[] = [];

  constructor(scene: GameScene) {
    this.scene = scene;
    this.initializePool();
  }

  private initializePool(): void {
    for (const champ of CHAMPIONS) {
      const poolSize = POOL_SIZES[champ.cost] || 10;
      this.pool.push({
        championId: champ.id,
        remaining: poolSize,
      });
    }
  }

  rollShop(): void {
    this.shopSlots = [];

    for (let i = 0; i < SHOP_SIZE; i++) {
      const champ = this.rollOne();
      if (champ) {
        this.shopSlots.push({ championData: champ, available: true });
      }
    }

    this.scene.events.emit('shopUpdated', this.shopSlots);
  }

  private rollOne(): ChampionData | null {
    // First, pick a cost tier based on level odds
    const level = this.scene.economyManager.level;
    const odds = SHOP_ODDS_PER_LEVEL[level] || SHOP_ODDS_PER_LEVEL[2];
    const tierRoll = Math.random();
    let costTier = 1;
    let cumulative = 0;
    for (let i = 0; i < odds.length; i++) {
      cumulative += odds[i];
      if (tierRoll <= cumulative) {
        costTier = i + 1;
        break;
      }
    }

    // Filter pool to that cost tier with remaining copies, excluding 3-star owned
    const maxedIds = this.getMaxStarChampionIds();
    const available = this.pool.filter(p => {
      if (p.remaining <= 0) return false;
      if (maxedIds.has(p.championId)) return false;
      const data = getChampionById(p.championId);
      return data && data.cost === costTier;
    });

    // Fallback: if no champions of that tier, try any available (still excluding 3-star)
    const fallbackPool = available.length > 0 ? available : this.pool.filter(p => p.remaining > 0 && !maxedIds.has(p.championId));
    if (fallbackPool.length === 0) return null;

    const totalWeight = fallbackPool.reduce((sum, p) => sum + p.remaining, 0);
    let roll = Math.random() * totalWeight;

    for (const entry of fallbackPool) {
      roll -= entry.remaining;
      if (roll <= 0) {
        const data = getChampionById(entry.championId);
        return data || null;
      }
    }

    return null;
  }

  buyChampion(slotIndex: number): Champion | null {
    if (slotIndex < 0 || slotIndex >= this.shopSlots.length) return null;
    const slot = this.shopSlots[slotIndex];
    if (!slot.available) return null;

    const data = slot.championData;

    // Check gold
    if (!this.scene.economyManager.canAfford(data.cost)) return null;

    // Check bench space — skip if buying would trigger a merge (frees slots)
    const benchSpace = this.scene.bench.filter(b => b === null).length;
    const totalBench = this.scene.bench.length;
    if (benchSpace === 0 && totalBench >= BENCH_SIZE) {
      const copies = this.getAllChampionsOfId(data.id, 1);
      const twoStarCopies = this.getAllChampionsOfId(data.id, 2);
      const wouldMerge = copies.length >= 2 || twoStarCopies.length >= 2;
      if (!wouldMerge) return null;
    }

    // Spend gold
    this.scene.economyManager.spendGold(data.cost);

    // Remove from pool
    const poolEntry = this.pool.find(p => p.championId === data.id);
    if (poolEntry) poolEntry.remaining--;

    // Create champion
    const champion = new Champion(this.scene, data);

    // Add to bench
    const emptySlot = this.scene.bench.indexOf(null);
    if (emptySlot !== -1) {
      this.scene.bench[emptySlot] = champion;
    } else {
      this.scene.bench.push(champion);
    }

    slot.available = false;

    // Check for auto-combine (star upgrade)
    this.checkAutoMerge(data.id);

    this.scene.events.emit('shopUpdated', this.shopSlots);
    this.scene.events.emit('goldChanged', this.scene.economyManager.getGold());
    this.scene.events.emit('championsChanged');

    return champion;
  }

  reroll(): boolean {
    if (!this.scene.economyManager.spendGold(REROLL_COST)) return false;

    // Return unbought champions to pool
    for (const slot of this.shopSlots) {
      if (slot.available) {
        const poolEntry = this.pool.find(p => p.championId === slot.championData.id);
        if (poolEntry) poolEntry.remaining++;
      }
    }

    this.rollShop();
    this.scene.events.emit('goldChanged', this.scene.economyManager.getGold());
    return true;
  }

  returnToPool(championId: string, starLevel: number): void {
    const count = Math.pow(3, starLevel - 1); // 1-star=1, 2-star=3, 3-star=9
    const poolEntry = this.pool.find(p => p.championId === championId);
    if (poolEntry) {
      poolEntry.remaining += count;
    }
  }

  private checkAutoMerge(championId: string): void {
    // Find all 1-star copies of this champion (bench + board)
    const allChampions = this.getAllChampionsOfId(championId, 1);
    if (allChampions.length >= 3) {
      this.mergeChampions(allChampions.slice(0, 3));
    }

    // Check for 2-star merge
    const twoStars = this.getAllChampionsOfId(championId, 2);
    if (twoStars.length >= 3) {
      this.mergeChampions(twoStars.slice(0, 3));
    }
  }

  /** Get IDs of champions the player owns at 3-star. */
  private getMaxStarChampionIds(): Set<string> {
    const ids = new Set<string>();
    for (const champ of this.scene.bench) {
      if (champ && champ.starLevel >= 3) ids.add(champ.championId);
    }
    for (const champ of this.scene.champions) {
      if (champ.starLevel >= 3) ids.add(champ.championId);
    }
    return ids;
  }

  private getAllChampionsOfId(id: string, starLevel: number): Champion[] {
    const result: Champion[] = [];

    // Check bench
    for (const champ of this.scene.bench) {
      if (champ && champ.championId === id && champ.starLevel === starLevel) {
        result.push(champ);
      }
    }

    // Check board
    for (const champ of this.scene.champions) {
      if (champ.championId === id && champ.starLevel === starLevel) {
        result.push(champ);
      }
    }

    return result;
  }

  private mergeChampions(champions: Champion[]): void {
    // Keep the first one (prefer placed champion)
    const placed = champions.find(c => c.placed);
    const keeper = placed || champions[0];

    // Remove the other two
    for (const champ of champions) {
      if (champ === keeper) continue;

      // Remove from bench
      const benchIdx = this.scene.bench.indexOf(champ);
      if (benchIdx !== -1) this.scene.bench[benchIdx] = null;

      // Remove from board
      const boardIdx = this.scene.champions.indexOf(champ);
      if (boardIdx !== -1) {
        if (champ.gridCol !== undefined && champ.gridRow !== undefined) {
          this.scene.isoMap.setOccupied(champ.gridCol, champ.gridRow, false);
        }
        this.scene.champions.splice(boardIdx, 1);
      }

      champ.destroy();
    }

    // Upgrade keeper
    keeper.evolve();

    this.scene.events.emit('championsChanged');
  }
}
