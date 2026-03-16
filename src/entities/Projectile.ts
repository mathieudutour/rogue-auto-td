import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { GameScene } from '../scenes/GameScene';

const PROJECTILE_SPEED = 300; // pixels per second

export class Projectile {
  private scene: GameScene;
  private sprite: Phaser.GameObjects.Sprite;
  private target: Enemy;
  private damage: number;
  private alive: boolean = true;

  constructor(scene: GameScene, x: number, y: number, target: Enemy, damage: number) {
    this.scene = scene;
    this.target = target;
    this.damage = damage;

    this.sprite = scene.add.sprite(x, y, 'projectile');
    this.sprite.setDepth(9999);
  }

  update(delta: number): boolean {
    if (!this.alive) return false;

    // If target died, remove projectile
    if (!this.target.isAlive()) {
      this.destroy();
      return false;
    }

    const targetPos = this.target.getPosition();
    const dx = targetPos.x - this.sprite.x;
    const dy = targetPos.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      // Hit!
      this.target.takeDamage(this.damage);
      this.destroy();
      return false;
    }

    // Move toward target
    const speed = PROJECTILE_SPEED * (delta / 1000);
    this.sprite.x += (dx / dist) * speed;
    this.sprite.y += (dy / dist) * speed;

    return true;
  }

  destroy(): void {
    this.alive = false;
    this.sprite.destroy();
  }
}
