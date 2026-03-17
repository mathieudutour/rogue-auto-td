/**
 * CLI simulation runner — run many games with different AI strategies
 * and report statistics to help tune game difficulty.
 *
 * Usage: npx tsx src/simulation/runSimulation.ts [numGames]
 */

import { SimEngine, SimResult } from './SimEngine';
import { SmartAI, GreedyAI, EconAI, SynergyAI, getAllTraits } from './AIStrategy';
import type { AIStrategy } from './SimEngine';
import { generateMap } from '../map/MapGenerator';

interface BatchResult {
  name: string;
  results: SimResult[];
  avgWaves: number;
  medianWaves: number;
}

function runBatch(strategyName: string, createStrategy: () => AIStrategy, numGames: number): BatchResult {
  const results: SimResult[] = [];

  for (let i = 0; i < numGames; i++) {
    const map = generateMap();
    const engine = new SimEngine(map);
    const strategy = createStrategy();
    results.push(engine.runGame(strategy));
  }

  const waves = results.map(r => r.wavesCompleted);
  const avgWaves = waves.reduce((a, b) => a + b, 0) / waves.length;
  const sorted = [...waves].sort((a, b) => a - b);
  const medianWaves = sorted[Math.floor(sorted.length / 2)];

  return { name: strategyName, results, avgWaves, medianWaves };
}

function printBatch(batch: BatchResult, numGames: number): void {
  const { name, results, avgWaves, medianWaves } = batch;
  const waves = results.map(r => r.wavesCompleted);
  const minWaves = Math.min(...waves);
  const maxWaves = Math.max(...waves);

  const levels = results.map(r => r.finalLevel);
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Strategy: ${name} (${numGames} games)`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`  Avg waves: ${avgWaves.toFixed(1)}  |  Median: ${medianWaves}  |  Range: ${minWaves}-${maxWaves}  |  StdDev: ${stdDev(waves).toFixed(1)}`);
  console.log(`  Avg level: ${avgLevel.toFixed(1)}`);

  // Survival rates
  const milestones = [10, 15, 20, 25, 30];
  const survStr = milestones.map(w => {
    const count = results.filter(r => r.wavesCompleted >= w).length;
    return `W${w}: ${(count / numGames * 100).toFixed(0)}%`;
  }).join('  ');
  console.log(`  Survival:  ${survStr}`);
}

function stdDev(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// --- Main ---

const numGames = parseInt(process.argv[2] || '200', 10);

console.log(`Running ${numGames} simulations per strategy...\n`);

// Run baseline strategies
const baselines: BatchResult[] = [];
baselines.push(runBatch('Greedy (casual)', () => new GreedyAI(), numGames));
baselines.push(runBatch('Smart (skilled)', () => new SmartAI(), numGames));
baselines.push(runBatch('Econ (economy)', () => new EconAI(), numGames));

// Run per-synergy strategies
const synergyResults: BatchResult[] = [];
const traits = getAllTraits();
for (const trait of traits) {
  const name = trait.charAt(0).toUpperCase() + trait.slice(1);
  synergyResults.push(runBatch(`${name} synergy`, () => new SynergyAI(trait), numGames));
}

// Print results
console.log(`\n${'='.repeat(60)}`);
console.log('BASELINE STRATEGIES');
console.log(`${'='.repeat(60)}`);
for (const batch of baselines) {
  printBatch(batch, numGames);
}

console.log(`\n${'='.repeat(60)}`);
console.log('PER-SYNERGY STRATEGIES');
console.log(`${'='.repeat(60)}`);
for (const batch of synergyResults) {
  printBatch(batch, numGames);
}

// Balance summary
console.log(`\n${'='.repeat(60)}`);
console.log('BALANCE SUMMARY');
console.log(`${'='.repeat(60)}`);

// Sort synergies by average waves
const sorted = [...synergyResults].sort((a, b) => b.avgWaves - a.avgWaves);
console.log('\nSynergy ranking (avg waves survived):');
for (const batch of sorted) {
  const bar = '█'.repeat(Math.round(batch.avgWaves));
  const diff = batch.avgWaves - sorted[sorted.length - 1].avgWaves;
  const diffStr = diff > 3 ? ` (+${diff.toFixed(1)} vs worst)` : '';
  console.log(`  ${batch.name.padEnd(20)} ${bar} ${batch.avgWaves.toFixed(1)}${diffStr}`);
}

const best = sorted[0];
const worst = sorted[sorted.length - 1];
const spread = best.avgWaves - worst.avgWaves;
console.log(`\nSpread: ${spread.toFixed(1)} waves (${best.name} vs ${worst.name})`);
if (spread > 5) {
  console.log(`⚠ Spread is >5 waves — consider buffing ${worst.name} or nerfing ${best.name}`);
} else if (spread < 2) {
  console.log(`✓ Synergies are well balanced (spread < 2 waves)`);
} else {
  console.log(`~ Synergies are reasonably balanced (spread 2-5 waves)`);
}

console.log(`
Target difficulty:
  - Casual (Greedy): wave 8-12
  - Skilled (Smart): wave 15-25
  - Economy (Econ): wave 20-30
  - Per-synergy: all should be within ~3 waves of each other
`);
