export interface WaveEntry {
  enemyType: string;
  count: number;
  delayBetween: number; // ms between spawns
}

export interface WaveData {
  entries: WaveEntry[];
  healthMultiplier: number; // scales enemy HP per wave
}

/** Generate wave data for a given wave number */
export function getWaveData(waveNumber: number): WaveData {
  // Scaling: gentle linear early, compounding in late game
  // Waves 1-10: +10% per wave (smooth ramp)
  // Waves 11-20: 15% compound per wave (mid-game pressure)
  // Waves 21+: 25% compound per wave (games should end wave 25-40)
  let healthMultiplier: number;
  if (waveNumber <= 10) {
    healthMultiplier = 1 + (waveNumber - 1) * 0.10;
  } else if (waveNumber <= 20) {
    // Base from wave 10 (1.9x), then 15% compound per wave
    healthMultiplier = 1.9 * Math.pow(1.15, waveNumber - 10);
  } else if (waveNumber <= 30) {
    // Base from wave 20 (7.69x), then 25% compound per wave
    healthMultiplier = 7.69 * Math.pow(1.25, waveNumber - 20);
  } else {
    // Base from wave 30 (71.6x), then 45% compound per wave — endgame wall
    healthMultiplier = 71.6 * Math.pow(1.45, waveNumber - 30);
  }

  if (waveNumber <= 3) {
    // Early waves: just basics
    return {
      entries: [
        { enemyType: 'basic', count: 3 + waveNumber * 2, delayBetween: 1200 },
      ],
      healthMultiplier,
    };
  }

  if (waveNumber <= 6) {
    // Introduce fast enemies
    return {
      entries: [
        { enemyType: 'basic', count: 4 + waveNumber, delayBetween: 1000 },
        { enemyType: 'fast', count: 1 + waveNumber, delayBetween: 800 },
      ],
      healthMultiplier,
    };
  }

  if (waveNumber <= 9) {
    // Introduce tanks — smoother ramp (fewer tanks early)
    return {
      entries: [
        { enemyType: 'basic', count: 5 + waveNumber, delayBetween: 900 },
        { enemyType: 'fast', count: 2 + waveNumber, delayBetween: 700 },
        { enemyType: 'tank', count: waveNumber - 6, delayBetween: 1500 },
      ],
      healthMultiplier,
    };
  }

  // Wave 10+: boss every 5 waves, growing composition
  const isBossWave = waveNumber % 5 === 0;
  const entries: WaveEntry[] = [
    { enemyType: 'basic', count: 5 + Math.floor(waveNumber * 1.0), delayBetween: 700 },
    { enemyType: 'fast', count: 3 + Math.floor(waveNumber * 0.8), delayBetween: 500 },
    { enemyType: 'tank', count: 1 + Math.floor(waveNumber / 3), delayBetween: 1000 },
  ];

  if (isBossWave) {
    entries.push({ enemyType: 'boss', count: 1 + Math.floor(waveNumber / 8), delayBetween: 1800 });
  }

  return { entries, healthMultiplier };
}
