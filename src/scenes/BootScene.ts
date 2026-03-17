import Phaser from 'phaser';
import {
  generateTileTextures,
  generateChampionTextures,
  generateEnemyTextures,
  generateProjectileTextures,
  generateUITextures,
  generateItemTextures,
} from '../graphics/TextureGenerator';
import { MetaProgressionManager } from '../systems/MetaProgressionManager';

/**
 * BootScene: generates all textures via TextureGenerator, then starts meta hub.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    generateTileTextures(this);
    generateChampionTextures(this);
    generateEnemyTextures(this);
    generateProjectileTextures(this);
    generateUITextures(this);
    generateItemTextures(this);

    const meta = new MetaProgressionManager();
    this.scene.start('MetaScene', { meta });
  }
}
