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
  const healthMultiplier = 1 + (waveNumber - 1) * 0.15;

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
        { enemyType: 'fast', count: 2 + waveNumber, delayBetween: 800 },
      ],
      healthMultiplier,
    };
  }

  if (waveNumber <= 9) {
    // Introduce tanks
    return {
      entries: [
        { enemyType: 'basic', count: 6 + waveNumber, delayBetween: 900 },
        { enemyType: 'fast', count: 3 + waveNumber, delayBetween: 700 },
        { enemyType: 'tank', count: Math.floor(waveNumber / 3), delayBetween: 1500 },
      ],
      healthMultiplier,
    };
  }

  // Wave 10+: boss every 5 waves, mixed composition
  const isBossWave = waveNumber % 5 === 0;
  const entries: WaveEntry[] = [
    { enemyType: 'basic', count: 8 + waveNumber, delayBetween: 800 },
    { enemyType: 'fast', count: 4 + waveNumber, delayBetween: 600 },
    { enemyType: 'tank', count: 2 + Math.floor(waveNumber / 3), delayBetween: 1200 },
  ];

  if (isBossWave) {
    entries.push({ enemyType: 'boss', count: 1, delayBetween: 0 });
  }

  return { entries, healthMultiplier };
}
