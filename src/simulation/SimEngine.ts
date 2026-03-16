/**
 * Headless game simulation engine — no Phaser dependency.
 * Replicates the game's combat and economy logic for automated testing.
 */

import { CHAMPIONS, ChampionData, getChampionById } from '../data/champions';
import { ENEMY_TYPES } from '../data/enemies';
import { getWaveData } from '../data/waves';
import { SYNERGIES } from '../data/synergies';
import { MapData, MAP_1 } from '../data/maps';
import { tileToScreen } from '../utils/iso';
import {
  STARTING_GOLD,
  STARTING_LIVES,
  STARTING_LEVEL,
  MAX_LEVEL,
  BASE_WAVE_GOLD,
  INTEREST_PER_10_GOLD,
  MAX_INTEREST,
  REROLL_COST,
  BUY_XP_COST,
  BUY_XP_AMOUNT,
  XP_PER_LEVEL,
  BOARD_SIZE_PER_LEVEL,
  POOL_SIZES,
  SHOP_ODDS_PER_LEVEL,
  SHOP_SIZE,
  BENCH_SIZE,
  STAR_2_MULTIPLIER,
  STAR_3_MULTIPLIER,
  MAX_WIN_STREAK_BONUS,
} from '../utils/constants';
import { SimChampion, SimEnemy, SimProjectile, SimState } from './SimTypes';

const PROJECTILE_SPEED = 300;
const PROJECTILE_HIT_RANGE = 8;
const SIM_TIMESTEP = 50; // ms per tick (20 fps — fast enough for accuracy)

/** Precomputed path data */
interface PathData {
  points: { x: number; y: number }[];
  segmentLengths: number[];
  totalLength: number;
}

/** Placeable tile positions on the map */
interface PlaceableTile {
  col: number;
  row: number;
  x: number;
  y: number;
}

function buildPathData(map: MapData): PathData {
  const points = map.pathWaypoints.map(wp => tileToScreen(wp.col, wp.row));
  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segmentLengths.push(len);
    totalLength += len;
  }
  return { points, segmentLengths, totalLength };
}

function getPointAtDistance(path: PathData, dist: number): { x: number; y: number } {
  if (dist <= 0) return { ...path.points[0] };
  if (dist >= path.totalLength) return { ...path.points[path.points.length - 1] };

  let remaining = dist;
  for (let i = 0; i < path.segmentLengths.length; i++) {
    if (remaining <= path.segmentLengths[i]) {
      const t = remaining / path.segmentLengths[i];
      return {
        x: path.points[i].x + (path.points[i + 1].x - path.points[i].x) * t,
        y: path.points[i].y + (path.points[i + 1].y - path.points[i].y) * t,
      };
    }
    remaining -= path.segmentLengths[i];
  }
  return { ...path.points[path.points.length - 1] };
}

/** Get all placeable tiles from the map */
function getPlaceableTiles(map: MapData): PlaceableTile[] {
  const tiles: PlaceableTile[] = [];
  for (let row = 0; row < map.grid.length; row++) {
    for (let col = 0; col < map.grid[row].length; col++) {
      if (map.grid[row][col] === 1) {
        const { x, y } = tileToScreen(col, row);
        tiles.push({ col, row, x, y });
      }
    }
  }
  return tiles;
}

/** Score tiles by how close they are to the path (lower = closer = better) */
function scoreTileByPathProximity(tile: PlaceableTile, pathData: PathData): number {
  let minDist = Infinity;
  for (let d = 0; d < pathData.totalLength; d += 20) {
    const pt = getPointAtDistance(pathData, d);
    const dx = pt.x - tile.x;
    const dy = pt.y - tile.y;
    minDist = Math.min(minDist, Math.sqrt(dx * dx + dy * dy));
  }
  return minDist;
}

function buildSortedTiles(map: MapData, pathData: PathData): PlaceableTile[] {
  const tiles = getPlaceableTiles(map);
  return tiles.sort((a, b) => scoreTileByPathProximity(a, pathData) - scoreTileByPathProximity(b, pathData));
}

export interface ShopOffer {
  championData: ChampionData;
  available: boolean;
}

export interface SimResult {
  wavesCompleted: number;
  livesRemaining: number;
  finalGold: number;
  finalLevel: number;
  championsOwned: number;
}

export class SimEngine {
  state: SimState;
  private path: PathData;
  private tilesByProximity: PlaceableTile[];
  private occupiedTiles: Set<string> = new Set();

  constructor(map: MapData = MAP_1) {
    this.path = buildPathData(map);
    this.tilesByProximity = buildSortedTiles(map, this.path);
    this.state = {
      gold: STARTING_GOLD,
      lives: STARTING_LIVES,
      level: STARTING_LEVEL,
      xp: 0,
      waveNumber: 0,
      winStreak: 0,
      champions: [],
      bench: [],
      pool: new Map(),
    };
    this.initPool();
  }

  private initPool(): void {
    for (const champ of CHAMPIONS) {
      const poolSize = POOL_SIZES[champ.cost] || 10;
      this.state.pool.set(champ.id, poolSize);
    }
  }

  // --- Economy ---

  getMaxBoardSize(): number {
    return BOARD_SIZE_PER_LEVEL[this.state.level] || this.state.level;
  }

  canAfford(cost: number): boolean {
    return this.state.gold >= cost;
  }

  spendGold(amount: number): boolean {
    if (this.state.gold < amount) return false;
    this.state.gold -= amount;
    return true;
  }

  buyXp(): boolean {
    if (this.state.level >= MAX_LEVEL) return false;
    if (!this.spendGold(BUY_XP_COST)) return false;
    this.addXp(BUY_XP_AMOUNT);
    return true;
  }

  private addXp(amount: number): void {
    if (this.state.level >= MAX_LEVEL) return;
    this.state.xp += amount;
    while (this.state.level < MAX_LEVEL) {
      const needed = XP_PER_LEVEL[this.state.level + 1];
      if (needed === undefined || this.state.xp < needed) break;
      this.state.xp -= needed;
      this.state.level++;
    }
    if (this.state.level >= MAX_LEVEL) this.state.xp = 0;
  }

  // --- Shop ---

  rollShop(): ShopOffer[] {
    const offers: ShopOffer[] = [];
    for (let i = 0; i < SHOP_SIZE; i++) {
      const champ = this.rollOne();
      if (champ) {
        offers.push({ championData: champ, available: true });
      }
    }
    return offers;
  }

  private rollOne(): ChampionData | null {
    const odds = SHOP_ODDS_PER_LEVEL[this.state.level] || SHOP_ODDS_PER_LEVEL[2];
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

    const available = [...this.state.pool.entries()]
      .filter(([id, remaining]) => {
        if (remaining <= 0) return false;
        const data = getChampionById(id);
        return data && data.cost === costTier;
      });

    const fallback = available.length > 0
      ? available
      : [...this.state.pool.entries()].filter(([, r]) => r > 0);

    if (fallback.length === 0) return null;

    const totalWeight = fallback.reduce((sum, [, r]) => sum + r, 0);
    let roll = Math.random() * totalWeight;
    for (const [id, remaining] of fallback) {
      roll -= remaining;
      if (roll <= 0) return getChampionById(id) || null;
    }
    return null;
  }

  /** Buy a champion from a shop offer. Returns the champion or null. */
  buyChampion(offer: ShopOffer): SimChampion | null {
    if (!offer.available) return null;
    const data = offer.championData;
    if (!this.canAfford(data.cost)) return null;

    // Check bench space
    const benchSpace = this.state.bench.filter(b => b === null).length;
    if (benchSpace === 0 && this.state.bench.length >= BENCH_SIZE) return null;

    this.spendGold(data.cost);

    // Remove from pool
    const remaining = this.state.pool.get(data.id) || 0;
    this.state.pool.set(data.id, Math.max(0, remaining - 1));

    const champ = this.createSimChampion(data);

    // Add to bench
    const emptyIdx = this.state.bench.indexOf(null);
    if (emptyIdx !== -1) {
      this.state.bench[emptyIdx] = champ;
    } else {
      this.state.bench.push(champ);
    }

    offer.available = false;

    // Check auto-merge
    this.checkAutoMerge(data.id);

    return champ;
  }

  rerollShop(currentOffers: ShopOffer[]): ShopOffer[] {
    if (!this.spendGold(REROLL_COST)) return currentOffers;

    // Return unbought to pool
    for (const slot of currentOffers) {
      if (slot.available) {
        const rem = this.state.pool.get(slot.championData.id) || 0;
        this.state.pool.set(slot.championData.id, rem + 1);
      }
    }

    return this.rollShop();
  }

  sellChampion(champ: SimChampion): void {
    // Remove from board
    const boardIdx = this.state.champions.indexOf(champ);
    if (boardIdx !== -1) {
      this.state.champions.splice(boardIdx, 1);
      const key = `${champ.gridCol},${champ.gridRow}`;
      this.occupiedTiles.delete(key);
    }

    // Remove from bench
    const benchIdx = this.state.bench.indexOf(champ);
    if (benchIdx !== -1) {
      this.state.bench[benchIdx] = null;
    }

    // Return to pool
    const count = Math.pow(3, champ.starLevel - 1);
    const rem = this.state.pool.get(champ.championId) || 0;
    this.state.pool.set(champ.championId, rem + count);

    // Refund gold
    this.state.gold += champ.cost;
  }

  private createSimChampion(data: ChampionData, starLevel: number = 1): SimChampion {
    let baseDamage = data.stats.damage;
    let baseRange = data.stats.range;
    let baseAttackSpeed = data.stats.attackSpeed;
    let baseHealth = data.stats.health;

    // Apply star multipliers
    if (starLevel >= 2) {
      baseDamage = Math.round(baseDamage * STAR_2_MULTIPLIER);
      baseRange = Math.round(baseRange * 1.1);
      baseAttackSpeed = baseAttackSpeed * 1.1;
      baseHealth = Math.round(baseHealth * STAR_2_MULTIPLIER);
    }
    if (starLevel >= 3) {
      baseDamage = Math.round((data.stats.damage * STAR_3_MULTIPLIER));
      baseRange = Math.round(data.stats.range * 1.1 * 1.1);
      baseAttackSpeed = data.stats.attackSpeed * 1.1 * 1.1;
      baseHealth = Math.round((data.stats.health * STAR_3_MULTIPLIER));
    }

    return {
      championId: data.id,
      name: data.name,
      cost: data.cost,
      traits: [...data.traits],
      starLevel,
      baseDamage,
      baseRange,
      baseAttackSpeed,
      baseHealth,
      damage: baseDamage,
      range: baseRange,
      attackSpeed: baseAttackSpeed,
      attackType: data.attackType || 'normal',
      attackTypeParams: data.attackTypeParams || {},
      x: 0,
      y: 0,
      placed: false,
      gridCol: -1,
      gridRow: -1,
      attackCooldown: 0,
    };
  }

  // --- Placement ---

  /** Place a champion on a tile. Returns true if successful. */
  placeChampion(champ: SimChampion, col: number, row: number): boolean {
    const key = `${col},${row}`;
    if (this.occupiedTiles.has(key)) return false;

    // Check board size
    if (!champ.placed) {
      if (this.state.champions.filter(c => c.placed).length >= this.getMaxBoardSize()) return false;
    }

    const { x, y } = tileToScreen(col, row);
    champ.x = x;
    champ.y = y - 8; // match the sprite offset
    champ.placed = true;
    champ.gridCol = col;
    champ.gridRow = row;
    champ.attackCooldown = 0;

    this.occupiedTiles.add(key);

    if (!this.state.champions.includes(champ)) {
      this.state.champions.push(champ);
    }

    // Remove from bench
    const benchIdx = this.state.bench.indexOf(champ);
    if (benchIdx !== -1) {
      this.state.bench[benchIdx] = null;
    }

    return true;
  }

  /** Get available tiles sorted by path proximity, filtered to unoccupied */
  getAvailableTiles(): PlaceableTile[] {
    return this.tilesByProximity.filter(
      t => !this.occupiedTiles.has(`${t.col},${t.row}`)
    );
  }

  // --- Star merging ---

  private getAllChampionsOfId(id: string, starLevel: number): SimChampion[] {
    const result: SimChampion[] = [];
    for (const c of this.state.bench) {
      if (c && c.championId === id && c.starLevel === starLevel) result.push(c);
    }
    for (const c of this.state.champions) {
      if (c.championId === id && c.starLevel === starLevel) result.push(c);
    }
    return result;
  }

  private checkAutoMerge(championId: string): void {
    const oneStars = this.getAllChampionsOfId(championId, 1);
    if (oneStars.length >= 3) {
      this.mergeChampions(oneStars.slice(0, 3));
    }

    const twoStars = this.getAllChampionsOfId(championId, 2);
    if (twoStars.length >= 3) {
      this.mergeChampions(twoStars.slice(0, 3));
    }
  }

  private mergeChampions(champions: SimChampion[]): void {
    const keeper = champions.find(c => c.placed) || champions[0];

    for (const champ of champions) {
      if (champ === keeper) continue;

      const benchIdx = this.state.bench.indexOf(champ);
      if (benchIdx !== -1) this.state.bench[benchIdx] = null;

      const boardIdx = this.state.champions.indexOf(champ);
      if (boardIdx !== -1) {
        this.occupiedTiles.delete(`${champ.gridCol},${champ.gridRow}`);
        this.state.champions.splice(boardIdx, 1);
      }
    }

    // Evolve keeper
    keeper.starLevel++;
    const data = getChampionById(keeper.championId)!;
    const mult = keeper.starLevel === 2 ? STAR_2_MULTIPLIER : STAR_3_MULTIPLIER;
    keeper.baseDamage = Math.round(keeper.baseDamage * mult / (keeper.starLevel === 3 ? STAR_2_MULTIPLIER : 1));
    keeper.baseRange = Math.round(keeper.baseRange * 1.1);
    keeper.baseAttackSpeed = keeper.baseAttackSpeed * 1.1;
    keeper.baseHealth = Math.round(keeper.baseHealth * mult / (keeper.starLevel === 3 ? STAR_2_MULTIPLIER : 1));
    keeper.damage = keeper.baseDamage;
    keeper.range = keeper.baseRange;
    keeper.attackSpeed = keeper.baseAttackSpeed;
  }

  // --- Synergies ---

  applySynergies(): void {
    const traitCounts: Record<string, number> = {};
    for (const champ of this.state.champions) {
      if (!champ.placed) continue;
      for (const trait of champ.traits) {
        traitCounts[trait] = (traitCounts[trait] || 0) + 1;
      }
    }

    // Reset bonuses
    for (const champ of this.state.champions) {
      champ.damage = champ.baseDamage;
      champ.range = champ.baseRange;
      champ.attackSpeed = champ.baseAttackSpeed;
    }

    // Apply synergy bonuses
    for (const synergy of SYNERGIES) {
      const count = traitCounts[synergy.id] || 0;
      if (count === 0) continue;

      let activeTier = null;
      for (let i = synergy.tiers.length - 1; i >= 0; i--) {
        if (count >= synergy.tiers[i].count) {
          activeTier = synergy.tiers[i];
          break;
        }
      }

      if (activeTier) {
        for (const champ of this.state.champions) {
          if (!champ.placed) continue;
          if (!champ.traits.includes(synergy.id)) continue;

          if (activeTier.bonuses.damageMult) {
            champ.damage = Math.round(champ.damage * activeTier.bonuses.damageMult);
          }
          if (activeTier.bonuses.rangeMult) {
            champ.range = Math.round(champ.range * activeTier.bonuses.rangeMult);
          }
          if (activeTier.bonuses.attackSpeedMult) {
            champ.attackSpeed *= activeTier.bonuses.attackSpeedMult;
          }
        }
      }
    }
  }

  // --- Combat simulation ---

  /**
   * Simulate a single combat wave. Returns lives lost during this wave.
   */
  simulateCombat(waveNumber: number): number {
    this.applySynergies();

    const waveData = getWaveData(waveNumber);
    const healthMult = waveData.healthMultiplier;

    // Build spawn queues
    const spawnQueues = waveData.entries.map(entry => ({
      enemyType: entry.enemyType,
      remaining: entry.count,
      delayBetween: entry.delayBetween,
      timer: 0,
    }));

    const enemies: SimEnemy[] = [];
    const projectiles: SimProjectile[] = [];
    let livesLost = 0;

    // Reset champion cooldowns
    for (const champ of this.state.champions) {
      champ.attackCooldown = 0;
    }

    // Run simulation at fixed timestep
    let allSpawned = false;
    const dt = SIM_TIMESTEP / 1000; // seconds

    for (let tick = 0; tick < 20000; tick++) { // safety: max ~1000 seconds of game time
      // Spawn enemies
      if (!allSpawned) {
        let anyRemaining = false;
        for (const queue of spawnQueues) {
          if (queue.remaining <= 0) continue;
          anyRemaining = true;
          queue.timer -= SIM_TIMESTEP;
          if (queue.timer <= 0) {
            const data = ENEMY_TYPES[queue.enemyType];
            if (data) {
              enemies.push({
                type: data.id,
                maxHealth: Math.round(data.health * healthMult),
                health: Math.round(data.health * healthMult),
                baseSpeed: data.speed,
                speed: data.speed,
                damage: data.damage,
                goldReward: data.goldReward,
                distanceTraveled: 0,
                alive: true,
                slowTimer: 0,
                slowMultiplier: 1,
                dotTimer: 0,
                dotTickTimer: 0,
                dotDamagePerTick: 0,
                dotTickInterval: 0,
              });
            }
            queue.remaining--;
            queue.timer = queue.delayBetween;
          }
        }
        if (!anyRemaining) allSpawned = true;
      }

      // Update enemy status effects & movement
      for (const enemy of enemies) {
        if (!enemy.alive) continue;

        // Update slow
        if (enemy.slowTimer > 0) {
          enemy.slowTimer -= dt;
          if (enemy.slowTimer <= 0) {
            enemy.slowMultiplier = 1;
            enemy.speed = enemy.baseSpeed;
          }
        }

        // Update DoT
        if (enemy.dotTimer > 0) {
          enemy.dotTimer -= dt;
          enemy.dotTickTimer -= dt;
          if (enemy.dotTickTimer <= 0 && enemy.dotTimer > 0) {
            enemy.health -= enemy.dotDamagePerTick;
            enemy.dotTickTimer = enemy.dotTickInterval;
            if (enemy.health <= 0) { enemy.alive = false; continue; }
          }
        }

        // Move
        enemy.distanceTraveled += enemy.speed * dt;

        if (enemy.distanceTraveled >= this.path.totalLength) {
          enemy.alive = false;
          livesLost += enemy.damage;
        }
      }

      // Champion targeting & attacks
      for (const champ of this.state.champions) {
        if (!champ.placed) continue;
        champ.attackCooldown -= dt;

        if (champ.attackCooldown <= 0) {
          // Find target (furthest along path within range)
          let bestEnemy: SimEnemy | null = null;
          let bestProgress = -1;

          for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const pos = getPointAtDistance(this.path, enemy.distanceTraveled);
            const dx = pos.x - champ.x;
            const dy = pos.y - champ.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= champ.range && enemy.distanceTraveled > bestProgress) {
              bestProgress = enemy.distanceTraveled;
              bestEnemy = enemy;
            }
          }

          if (bestEnemy) {
            const enemyIdx = enemies.indexOf(bestEnemy);
            projectiles.push({
              targetIndex: enemyIdx,
              damage: champ.damage,
              x: champ.x,
              y: champ.y,
              attackType: champ.attackType,
              attackTypeParams: champ.attackTypeParams,
            });
            champ.attackCooldown = 1 / champ.attackSpeed;
          }
        }
      }

      // Move projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        const target = enemies[proj.targetIndex];

        if (!target || !target.alive) {
          projectiles.splice(i, 1);
          continue;
        }

        const targetPos = getPointAtDistance(this.path, target.distanceTraveled);
        const dx = targetPos.x - proj.x;
        const dy = targetPos.y - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < PROJECTILE_HIT_RANGE) {
          this.applyProjectileHit(proj, target, enemies);
          projectiles.splice(i, 1);
        } else {
          const speed = PROJECTILE_SPEED * dt;
          proj.x += (dx / dist) * speed;
          proj.y += (dy / dist) * speed;
        }
      }

      // Check if wave is done
      const allDead = enemies.every(e => !e.alive);
      if (allSpawned && allDead && projectiles.length === 0) break;
    }

    return livesLost;
  }

  /** Apply projectile hit effects based on attack type */
  private applyProjectileHit(proj: SimProjectile, target: SimEnemy, enemies: SimEnemy[]): void {
    // Primary damage
    target.health -= proj.damage;
    if (target.health <= 0) target.alive = false;

    const params = proj.attackTypeParams;

    switch (proj.attackType) {
      case 'splash': {
        const radius = params.splashRadius ?? 50;
        const frac = params.splashDamageFrac ?? 0.5;
        const splashDmg = Math.round(proj.damage * frac);
        const targetPos = getPointAtDistance(this.path, target.distanceTraveled);

        for (const enemy of enemies) {
          if (!enemy.alive || enemy === target) continue;
          const pos = getPointAtDistance(this.path, enemy.distanceTraveled);
          const dx = pos.x - targetPos.x;
          const dy = pos.y - targetPos.y;
          if (Math.sqrt(dx * dx + dy * dy) <= radius) {
            enemy.health -= splashDmg;
            if (enemy.health <= 0) enemy.alive = false;
          }
        }
        break;
      }

      case 'slow': {
        const mult = params.slowAmount ?? 0.5;
        const dur = params.slowDuration ?? 1.5;
        if (mult < target.slowMultiplier || target.slowTimer <= 0) {
          target.slowMultiplier = mult;
          target.speed = target.baseSpeed * mult;
        }
        target.slowTimer = Math.max(target.slowTimer, dur);
        break;
      }

      case 'chain': {
        const chainCount = params.chainCount ?? 3;
        const chainRange = params.chainRange ?? 80;
        const chainFrac = params.chainDamageFrac ?? 0.7;
        let currentTarget = target;
        let currentDamage = proj.damage;
        const hit = new Set<SimEnemy>([target]);

        for (let i = 0; i < chainCount; i++) {
          currentDamage = Math.round(currentDamage * chainFrac);
          if (currentDamage < 1) break;

          const currentPos = getPointAtDistance(this.path, currentTarget.distanceTraveled);
          let bestEnemy: SimEnemy | null = null;
          let bestDist = Infinity;

          for (const enemy of enemies) {
            if (!enemy.alive || hit.has(enemy)) continue;
            const pos = getPointAtDistance(this.path, enemy.distanceTraveled);
            const dx = pos.x - currentPos.x;
            const dy = pos.y - currentPos.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d <= chainRange && d < bestDist) {
              bestDist = d;
              bestEnemy = enemy;
            }
          }

          if (!bestEnemy) break;
          bestEnemy.health -= currentDamage;
          if (bestEnemy.health <= 0) bestEnemy.alive = false;
          hit.add(bestEnemy);
          currentTarget = bestEnemy;
        }
        break;
      }

      case 'dot': {
        const dotDmg = params.dotDamage ?? 5;
        const dotDur = params.dotDuration ?? 3;
        const dotRate = params.dotTickRate ?? 2;
        if (dotDmg > target.dotDamagePerTick || target.dotTimer <= 0) {
          target.dotDamagePerTick = dotDmg;
          target.dotTickInterval = 1 / dotRate;
        }
        target.dotTimer = Math.max(target.dotTimer, dotDur);
        if (target.dotTickTimer <= 0) target.dotTickTimer = target.dotTickInterval;
        break;
      }
    }
  }

  // --- Shopping phase ---

  startShoppingPhase(livesLostLastWave: number = 0): ShopOffer[] {
    this.state.waveNumber++;

    if (this.state.waveNumber > 1) {
      // Track win/loss streak
      if (livesLostLastWave === 0) {
        this.state.winStreak++;
      } else {
        this.state.winStreak = 0;
      }

      const interest = Math.min(
        Math.floor(this.state.gold / 10) * INTEREST_PER_10_GOLD,
        MAX_INTEREST
      );
      const streakBonus = Math.min(this.state.winStreak, MAX_WIN_STREAK_BONUS);
      this.state.gold += BASE_WAVE_GOLD + interest + streakBonus;
      this.addXp(2);
    }

    return this.rollShop();
  }

  /** Run a full game with the given AI strategy. */
  runGame(strategy: AIStrategy): SimResult {
    let lastLivesLost = 0;
    while (this.state.lives > 0) {
      // Shopping phase
      let shop = this.startShoppingPhase(lastLivesLost);
      shop = strategy.shop(this, shop);

      // Combat phase
      const livesLost = this.simulateCombat(this.state.waveNumber);
      this.state.lives -= livesLost;
      lastLivesLost = livesLost;

      if (this.state.lives <= 0) break;

      // Safety: don't run forever
      if (this.state.waveNumber >= 100) break;
    }

    return {
      wavesCompleted: this.state.waveNumber,
      livesRemaining: Math.max(0, this.state.lives),
      finalGold: this.state.gold,
      finalLevel: this.state.level,
      championsOwned: this.state.champions.length + this.state.bench.filter(b => b !== null).length,
    };
  }
}

/** Interface for AI strategies that make shopping/placement decisions */
export interface AIStrategy {
  shop(engine: SimEngine, offers: ShopOffer[]): ShopOffer[];
}
