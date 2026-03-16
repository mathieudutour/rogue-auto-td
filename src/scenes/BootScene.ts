import Phaser from 'phaser';
import {
  generateTileTextures,
  generateChampionTextures,
  generateEnemyTextures,
  generateProjectileTextures,
  generateUITextures,
} from '../graphics/TextureGenerator';

/**
 * BootScene: generates all textures via TextureGenerator, then starts the game.
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

    this.scene.start('GameScene');
  }
}
