import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { MetaScene } from './scenes/MetaScene';
import { RunStartScene } from './scenes/RunStartScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, MetaScene, RunStartScene, GameScene, UIScene],
  autoRound: true,
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
  callbacks: {
    postBoot: (game) => {
      // Render text at native device resolution for crisp text on HiDPI displays
      const dpr = window.devicePixelRatio || 1;
      if (dpr > 1) {
        const origAddText = Phaser.GameObjects.GameObjectFactory.prototype.text;
        Phaser.GameObjects.GameObjectFactory.prototype.text = function (
          this: Phaser.GameObjects.GameObjectFactory,
          x: number, y: number, text: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle,
        ) {
          const t = origAddText.call(this, x, y, text, style);
          t.setResolution(dpr);
          return t;
        };
      }
    },
  },
};

new Phaser.Game(config);
