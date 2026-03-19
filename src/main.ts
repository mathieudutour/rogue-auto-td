import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { MetaScene } from './scenes/MetaScene';
import { RunStartScene } from './scenes/RunStartScene';

// Render at native device resolution for crisp text on HiDPI/Retina displays.
// We make the game container physically larger (by DPR), then CSS-transform it
// back to viewport size. Phaser's RESIZE mode picks up the larger dimensions
// and renders a high-resolution canvas.
const dpr = Math.min(window.devicePixelRatio || 1, 3);

const container = document.getElementById('game-container')!;
if (dpr > 1) {
  container.style.width = `${100 * dpr}vw`;
  container.style.height = `${100 * dpr}dvh`;
  container.style.transform = `scale(${1 / dpr})`;
  container.style.transformOrigin = 'top left';
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth * dpr,
  height: window.innerHeight * dpr,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, MetaScene, RunStartScene, GameScene, UIScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
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
