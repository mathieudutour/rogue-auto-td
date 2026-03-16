/**
 * CLI simulation runner — run many games with different AI strategies
 * and report statistics to help tune game difficulty.
 *
 * Usage: npx tsx src/simulation/runSimulation.ts [numGames]
 */

import { SimEngine, SimResult } from './SimEngine';
import { SmartAI, GreedyAI, EconAI } from './AIStrategy';
import type { AIStrategy } from './SimEngine';
import { generateMap } from '../map/MapGenerator';

function runBatch(strategyName: string, createStrategy: () => AIStrategy, numGames: number): void {
  const results: SimResult[] = [];

  for (let i = 0; i < numGames; i++) {
    const map = generateMap();
    const engine = new SimEngine(map);
    const strategy = createStrategy();
    results.push(engine.runGame(strategy));
  }

  // Compute statistics
  const waves = results.map(r => r.wavesCompleted);
  const avgWaves = waves.reduce((a, b) => a + b, 0) / waves.length;
  const minWaves = Math.min(...waves);
  const maxWaves = Math.max(...waves);
  const medianWaves = waves.sort((a, b) => a - b)[Math.floor(waves.length / 2)];

  const survivalByWave: Record<number, number> = {};
  for (let w = 1; w <= maxWaves; w++) {
    survivalByWave[w] = results.filter(r => r.wavesCompleted >= w).length;
  }

  const levels = results.map(r => r.finalLevel);
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;

  const lostAllLives = results.filter(r => r.livesRemaining <= 0).length;
  const survived20 = results.filter(r => r.wavesCompleted >= 20).length;
  const survived30 = results.filter(r => r.wavesCompleted >= 30).length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Strategy: ${strategyName} (${numGames} games)`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Waves survived:`);
  console.log(`  Average: ${avgWaves.toFixed(1)}`);
  console.log(`  Median:  ${medianWaves}`);
  console.log(`  Min:     ${minWaves}`);
  console.log(`  Max:     ${maxWaves}`);
  console.log(`  Std Dev: ${stdDev(waves).toFixed(1)}`);
  console.log(`\nFinal level: ${avgLevel.toFixed(1)} avg`);
  console.log(`\nSurvival rates:`);
  console.log(`  Reached wave 10: ${pct(results.filter(r => r.wavesCompleted >= 10).length, numGames)}`);
  console.log(`  Reached wave 15: ${pct(results.filter(r => r.wavesCompleted >= 15).length, numGames)}`);
  console.log(`  Reached wave 20: ${pct(survived20, numGames)}`);
  console.log(`  Reached wave 25: ${pct(results.filter(r => r.wavesCompleted >= 25).length, numGames)}`);
  console.log(`  Reached wave 30: ${pct(survived30, numGames)}`);

  // Wave-by-wave survival curve (every 5 waves)
  console.log(`\nSurvival curve:`);
  for (let w = 5; w <= maxWaves; w += 5) {
    const alive = survivalByWave[w] || 0;
    const bar = '█'.repeat(Math.round(alive / numGames * 40));
    console.log(`  Wave ${String(w).padStart(2)}: ${bar} ${pct(alive, numGames)}`);
  }

  // Distribution of death waves
  console.log(`\nDeath wave distribution:`);
  const buckets = [
    { label: 'Wave 1-5', min: 1, max: 5 },
    { label: 'Wave 6-10', min: 6, max: 10 },
    { label: 'Wave 11-15', min: 11, max: 15 },
    { label: 'Wave 16-20', min: 16, max: 20 },
    { label: 'Wave 21-25', min: 21, max: 25 },
    { label: 'Wave 26-30', min: 26, max: 30 },
    { label: 'Wave 31+', min: 31, max: 999 },
  ];
  for (const bucket of buckets) {
    const count = results.filter(r => r.wavesCompleted >= bucket.min && r.wavesCompleted <= bucket.max).length;
    if (count > 0) {
      const bar = '█'.repeat(Math.round(count / numGames * 40));
      console.log(`  ${bucket.label.padEnd(12)}: ${bar} ${pct(count, numGames)}`);
    }
  }
}

function pct(count: number, total: number): string {
  return `${count}/${total} (${(count / total * 100).toFixed(1)}%)`;
}

function stdDev(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// --- Main ---

const numGames = parseInt(process.argv[2] || '200', 10);

console.log(`Running ${numGames} simulations per strategy...\n`);

runBatch('Greedy (casual player)', () => new GreedyAI(), numGames);
runBatch('Smart (skilled player)', () => new SmartAI(), numGames);
runBatch('Econ (economy-focused)', () => new EconAI(), numGames);

console.log(`\n${'='.repeat(60)}`);
console.log('BALANCE ANALYSIS');
console.log(`${'='.repeat(60)}`);
console.log(`
Target difficulty:
  - Casual players (Greedy): should lose around wave 8-12
  - Skilled players (Smart): should lose around wave 15-25
  - Expert players (Econ): should lose around wave 20-30

If the above targets are not met, consider adjusting:
  - Wave health scaling (currently +15% per wave)
  - Enemy counts per wave
  - Enemy base stats (HP, speed)
  - Champion damage/range/attack speed
  - Gold income or interest rates
`);
