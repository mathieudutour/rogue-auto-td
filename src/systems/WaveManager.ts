import { GameScene } from '../scenes/GameScene';
import { Enemy } from '../entities/Enemy';
import { ENEMY_TYPES } from '../data/enemies';
import { getWaveData, WaveEntry } from '../data/waves';

interface SpawnQueue {
  enemyType: string;
  remaining: number;
  delayBetween: number;
  timer: number;
}

export class WaveManager {
  private scene: GameScene;
  private spawnQueues: SpawnQueue[] = [];
  private waveActive: boolean = false;
  private allSpawned: boolean = false;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  startWave(waveNumber: number): void {
    const waveData = getWaveData(waveNumber);
    this.spawnQueues = waveData.entries.map((entry: WaveEntry) => ({
      enemyType: entry.enemyType,
      remaining: entry.count,
      delayBetween: entry.delayBetween,
      timer: 0, // Spawn first immediately
    }));

    this.waveActive = true;
    this.allSpawned = false;

    // Store health multiplier for this wave
    (this as any)._healthMult = waveData.healthMultiplier;
  }

  update(delta: number): void {
    if (!this.waveActive) return;

    let anyRemaining = false;

    for (const queue of this.spawnQueues) {
      if (queue.remaining <= 0) continue;
      anyRemaining = true;

      queue.timer -= delta;
      if (queue.timer <= 0) {
        this.spawnEnemy(queue.enemyType);
        queue.remaining--;
        queue.timer = queue.delayBetween;
      }
    }

    if (!anyRemaining) {
      this.allSpawned = true;
    }
  }

  private spawnEnemy(type: string): void {
    const data = ENEMY_TYPES[type];
    if (!data) return;

    const healthMult = (this as any)._healthMult || 1;
    const enemy = new Enemy(
      this.scene,
      this.scene.pathGraph,
      data.textureKey,
      Math.round(data.health * healthMult),
      data.speed,
      data.damage,
      data.goldReward,
    );

    this.scene.addEnemy(enemy);
  }

  isWaveComplete(): boolean {
    return this.allSpawned && this.scene.enemies.length === 0;
  }

  isActive(): boolean {
    return this.waveActive;
  }
}
