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
  // Waves 1-15: +8% per wave (smooth ramp)
  // Waves 16+: exponential growth that makes late game increasingly hard
  let healthMultiplier: number;
  if (waveNumber <= 15) {
    healthMultiplier = 1 + (waveNumber - 1) * 0.08;
  } else {
    // Base from wave 15 (2.12x), then exponential
    healthMultiplier = 2.12 * Math.pow(1.10, waveNumber - 15);
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
    { enemyType: 'basic', count: 6 + waveNumber, delayBetween: 800 },
    { enemyType: 'fast', count: 3 + waveNumber, delayBetween: 600 },
    { enemyType: 'tank', count: 1 + Math.floor(waveNumber / 3), delayBetween: 1200 },
  ];

  if (isBossWave) {
    entries.push({ enemyType: 'boss', count: Math.floor(waveNumber / 10), delayBetween: 2000 });
  }

  return { entries, healthMultiplier };
}
