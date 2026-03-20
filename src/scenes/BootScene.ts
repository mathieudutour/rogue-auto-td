import Phaser from 'phaser';
import {
  generateTileTextures,
  generateChampionTextures,
  generateEnemyTextures,
  generateProjectileTextures,
  generateUITextures,
  generateItemTextures,
} from '../graphics/TextureGenerator';
import { ASSET_MANIFEST, getItemAssetEntries } from '../graphics/AssetManifest';
import { COMPONENTS, COMBINED_ITEMS } from '../data/items';
import { MetaProgressionManager } from '../systems/MetaProgressionManager';

/**
 * BootScene: tries to load PNG assets from public/assets/, then generates
 * procedural textures for any that are missing. This lets you incrementally
 * replace procedural sprites with AI-generated art — just drop PNGs into
 * the right folder and they'll be picked up automatically.
 */
export class BootScene extends Phaser.Scene {
  private assetsToLoad: string[] = [];

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Build the full manifest including items
    const itemEntries = getItemAssetEntries(
      COMPONENTS.map(c => c.id),
      COMBINED_ITEMS.map(i => i.id),
    );
    const allEntries = [...ASSET_MANIFEST, ...itemEntries];

    // Attempt to load every PNG — failures are expected and silenced
    for (const entry of allEntries) {
      this.assetsToLoad.push(entry.key);
      this.load.image(entry.key, entry.path);
    }

    // Silence individual file errors (missing PNGs are fine)
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      // Remove from textures so we know to generate it procedurally
      this.assetsToLoad = this.assetsToLoad.filter(k => k !== file.key);
    });
  }

  create(): void {
    const loaded = new Set<string>();
    for (const key of this.assetsToLoad) {
      if (this.textures.exists(key)) {
        loaded.add(key);
      }
    }

    const pngCount = loaded.size;

    // Generate ALL procedural textures — they'll only create textures
    // for keys that don't already exist (loaded PNGs take priority)
    generateTileTextures(this);
    generateChampionTextures(this);
    generateEnemyTextures(this);
    generateProjectileTextures(this);
    generateUITextures(this);
    generateItemTextures(this);

    if (pngCount > 0) {
      console.log(`[Assets] Loaded ${pngCount} PNG sprite(s), rest are procedural`);
    }

    const meta = new MetaProgressionManager();
    this.scene.start('MetaScene', { meta });
  }
}
