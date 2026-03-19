import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { MetaScene } from './scenes/MetaScene';
import { RunStartScene } from './scenes/RunStartScene';

// Render at native device resolution for crisp text on HiDPI/Retina displays.
// Use FIT mode with DPR-scaled dimensions — Phaser creates a high-res canvas
// and scales it down to fit the parent container.
const dpr = Math.min(window.devicePixelRatio || 1, 3);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: Math.round(window.innerWidth * dpr),
  height: Math.round(window.innerHeight * dpr),
  backgroundColor: '#1a1a2e',
  scene: [BootScene, MetaScene, RunStartScene, GameScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    roundPixels: true,
  },
  input: {
    mouse: {
      preventDefaultWheel: true,
    },
  },
};

new Phaser.Game(config);
