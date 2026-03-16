import { GameScene } from '../scenes/GameScene';
import { Champion } from '../entities/Champion';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';

export class CombatSystem {
  private scene: GameScene;
  private projectiles: Projectile[] = [];

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  fireProjectile(champion: Champion, target: Enemy): void {
    const projectile = new Projectile(
      this.scene,
      champion.sprite.x,
      champion.sprite.y - 4,
      target,
      champion.damage,
    );
    this.projectiles.push(projectile);
  }

  update(delta: number): void {
    // Update projectiles, remove dead ones
    this.projectiles = this.projectiles.filter(p => p.update(delta));
  }

  clearProjectiles(): void {
    for (const p of this.projectiles) {
      p.destroy();
    }
    this.projectiles = [];
  }
}
